const Note = require('../models/notes.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../config');

let io;

// Keep track of active users per note
const activeUsers = new Map(); // noteId -> Set of {userId, socketId, username}

const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, config.jwtSecret);

        // Get user details
        const user = await User.findById(decoded.id).select('username email');
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = decoded.id;
        socket.username = user.username || user.email.split('@')[0];
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};

const verifyNoteAccess = async (userId, noteId) => {
    try {
        const note = await Note.findOne({
            _id: noteId,
            $or: [
                { user: userId },
                { sharedWith: userId }
            ]
        });
        return note;
    } catch (error) {
        return null;
    }
};

const addActiveUser = (noteId, userId, socketId, username) => {
    if (!activeUsers.has(noteId)) {
        activeUsers.set(noteId, new Set());
    }
    activeUsers.get(noteId).add({ userId, socketId, username });
};

const removeActiveUser = (noteId, socketId) => {
    if (activeUsers.has(noteId)) {
        const users = activeUsers.get(noteId);
        for (const user of users) {
            if (user.socketId === socketId) {
                users.delete(user);
                break;
            }
        }
        if (users.size === 0) {
            activeUsers.delete(noteId);
        }
    }
};

const getActiveUsers = (noteId) => {
    return Array.from(activeUsers.get(noteId) || []).map(user => ({
        id: user.userId,
        username: user.username
    }));
};

exports.setupNoteSocket = (serverIo) => {
    io = serverIo;

    // Add authentication middleware
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);
        let currentNoteId = null;

        socket.on('note:join', async ({ noteId }) => {
            try {
                // Verify access
                const note = await verifyNoteAccess(socket.userId, noteId);
                if (!note) {
                    socket.emit('error', { message: 'Access denied to this note' });
                    return;
                }

                // Leave previous note room if any
                if (currentNoteId) {
                    socket.leave(currentNoteId);
                    removeActiveUser(currentNoteId, socket.id);
                    io.to(currentNoteId).emit('note:users', getActiveUsers(currentNoteId));
                }

                // Join new note room
                socket.join(noteId);
                currentNoteId = noteId;
                addActiveUser(noteId, socket.userId, socket.id, socket.username);

                // Update active users list for everyone in the room
                io.to(noteId).emit('note:users', getActiveUsers(noteId));

            } catch (error) {
                console.error('Error joining note:', error);
                socket.emit('error', { message: 'Failed to join note' });
            }
        });

        socket.on('note:update', async ({ noteId, content }) => {
            try {
                // Verify access
                const note = await verifyNoteAccess(socket.userId, noteId);
                if (!note) {
                    socket.emit('error', { message: 'Access denied to this note' });
                    return;
                }

                // Update the note in database
                await Note.findByIdAndUpdate(
                    noteId,
                    {
                        content,
                        lastEditedBy: socket.userId,
                        lastEditedAt: new Date()
                    }
                );

                // Broadcast to others in the room
                socket.to(noteId).emit('note:updated', {
                    content,
                    userId: socket.userId
                });

            } catch (error) {
                console.error('Error updating note:', error);
                socket.emit('error', { message: 'Failed to update note' });
            }
        });

        socket.on('note:leave', ({ noteId }) => {
            if (noteId === currentNoteId) {
                socket.leave(noteId);
                removeActiveUser(noteId, socket.id);
                io.to(noteId).emit('note:users', getActiveUsers(noteId));
                currentNoteId = null;
            }
        });

        socket.on('disconnect', () => {
            if (currentNoteId) {
                removeActiveUser(currentNoteId, socket.id);
                io.to(currentNoteId).emit('note:users', getActiveUsers(currentNoteId));
            }
            console.log('Socket disconnected:', socket.id);
        });
    });
};
