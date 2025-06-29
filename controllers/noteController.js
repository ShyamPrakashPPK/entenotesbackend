const Note = require('../models/notes.model');
const User = require('../models/user.model');

exports.createNote = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const note = new Note({
            title: title.trim(),
            content: content || '<p></p>',
            user: req.user.id,
            lastEditedBy: req.user.id
        });

        await note.save();

        await note.populate('user', 'email');
        await note.populate('sharedWith.user', 'email');

        const noteObj = note.toObject();
        noteObj.isOwner = true;

        res.status(201).json(noteObj);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Error creating note' });
    }
};

exports.getNotes = async (req, res) => {
    try {
        const {
            search,
            filter = 'all',
            sortBy = 'updatedAt',
            sortOrder = 'desc',
            page = 1,
            limit = 6
        } = req.query;

        let conditions = {
            $or: [
                { user: req.user.id },
                { 'sharedWith.user': req.user.id }
            ]
        };

        if (filter === 'my') {
            conditions = { user: req.user.id };
        } else if (filter === 'shared') {
            conditions = { 'sharedWith.user': req.user.id };
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            conditions.$and = [
                {
                    $or: [
                        { title: searchRegex },
                        { content: searchRegex }
                    ]
                }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const totalCount = await Note.countDocuments(conditions);

        const notes = await Note.find(conditions)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'email')
            .populate('sharedWith.user', 'email')
            .populate('lastEditedBy', 'email');

        const formattedNotes = notes.map(note => ({
            ...note.toObject(),
            isOwner: note.user._id.toString() === req.user.id
        }));

        console.log(totalCount, "totalCount");
        console.log(limit, "limit");
        console.log(page, "page");
        console.log(totalCount / parseInt(limit), "totalCount / parseInt(limit)");

        res.json({
            notes: formattedNotes,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Error fetching notes' });
    }
};

exports.getNote = async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.id },
                { 'sharedWith.user': req.user.id }
            ]
        })
            .populate('user', 'email')
            .populate('sharedWith.user', 'email');

        if (!note) {
            return res.status(404).json({ message: 'Note not found or access denied' });
        }

        const noteObj = note.toObject();
        noteObj.isOwner = note.user._id.toString() === req.user.id;

        res.json(noteObj);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ message: 'Error fetching note' });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.id },
                { 'sharedWith.user': req.user.id }
            ]
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or access denied' });
        }

        // Check if user has edit permission
        const isOwner = note.user._id.toString() === req.user.id;
        const sharedUser = note.sharedWith.find(share =>
            share.user.toString() === req.user.id
        );
        const hasEditPermission = isOwner || (sharedUser && sharedUser.permission === 'edit');

        if (!hasEditPermission) {
            return res.status(403).json({ message: 'You do not have permission to edit this note' });
        }

        if (title !== undefined) {
            note.title = title.trim();
        }
        if (content !== undefined) {
            note.content = content || '<p></p>';
        }

        note.lastEditedBy = req.user.id;
        note.lastEditedAt = new Date();

        await note.save();

        await note.populate('user', 'email');
        await note.populate('sharedWith.user', 'email');
        await note.populate('lastEditedBy', 'email');

        const noteObj = note.toObject();
        noteObj.isOwner = note.user._id.toString() === req.user.id;

        res.json(noteObj);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Error updating note' });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Error deleting note' });
    }
};

exports.shareNote = async (req, res) => {
    try {
        const { email, permission } = req.body;

        console.log(email, "email");
        console.log(permission, "permission");

        const currentUser = await User.findById(req.user.id);

        if (currentUser.email === email) {
            return res.status(400).json({
                message: 'You cannot share a note with yourself'
            });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({
                message: 'User not found with this email'
            });
        }

        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!note) {
            return res.status(404).json({
                message: 'Note not found or you do not have permission to share it'
            });
        }

        // Check if note is already shared with this user
        const alreadyShared = note.sharedWith.some(share =>
            share.user.toString() === targetUser._id.toString()
        );

        if (alreadyShared) {
            return res.status(400).json({
                message: 'Note is already shared with this user'
            });
        }

        note.sharedWith.push({
            user: targetUser._id,
            permission: permission || 'edit'
        });
        await note.save();

        res.json({
            message: 'Note shared successfully',
            sharedWith: targetUser.email,
            permission: permission || 'edit'
        });
    } catch (error) {
        console.error('Error sharing note:', error);
        res.status(500).json({ message: 'Error sharing note' });
    }
};

exports.updateSharedUser = async (req, res) => {
    try {
        const { permission } = req.body;
        const { id: noteId, shareId } = req.params;

        if (!permission || !['view', 'edit'].includes(permission)) {
            return res.status(400).json({
                message: 'Valid permission (view or edit) is required'
            });
        }

        const note = await Note.findOne({
            _id: noteId,
            user: req.user.id // Only owner can update sharing
        });

        if (!note) {
            return res.status(404).json({
                message: 'Note not found or you do not have permission to manage sharing'
            });
        }

        // Find and update the shared user
        const sharedUserIndex = note.sharedWith.findIndex(
            share => share._id.toString() === shareId
        );

        if (sharedUserIndex === -1) {
            return res.status(404).json({
                message: 'Shared user not found'
            });
        }

        note.sharedWith[sharedUserIndex].permission = permission;
        await note.save();

        await note.populate('sharedWith.user', 'email');

        res.json({
            message: 'Permission updated successfully',
            sharedUser: note.sharedWith[sharedUserIndex]
        });
    } catch (error) {
        console.error('Error updating shared user:', error);
        res.status(500).json({ message: 'Error updating shared user' });
    }
};

exports.removeSharedUser = async (req, res) => {
    try {
        const { id: noteId, shareId } = req.params;

        const note = await Note.findOne({
            _id: noteId,
            user: req.user.id // Only owner can remove sharing
        });

        if (!note) {
            return res.status(404).json({
                message: 'Note not found or you do not have permission to manage sharing'
            });
        }

        // Remove the shared user
        const originalLength = note.sharedWith.length;
        note.sharedWith = note.sharedWith.filter(
            share => share._id.toString() !== shareId
        );

        if (note.sharedWith.length === originalLength) {
            return res.status(404).json({
                message: 'Shared user not found'
            });
        }

        await note.save();

        res.json({
            message: 'User removed from sharing successfully'
        });
    } catch (error) {
        console.error('Error removing shared user:', error);
        res.status(500).json({ message: 'Error removing shared user' });
    }
};

exports.getNoteStats = async (req, res) => {
    try {
        const totalNotes = await Note.countDocuments({ user: req.user.id });
        const sharedNotes = await Note.countDocuments({
            user: req.user.id,
            sharedWith: { $exists: true, $not: { $size: 0 } }
        });

        res.json({
            totalNotes,
            sharedNotes
        });
    } catch (error) {
        console.error('Error fetching note stats:', error);
        res.status(500).json({ message: 'Error fetching note statistics' });
    }
};
