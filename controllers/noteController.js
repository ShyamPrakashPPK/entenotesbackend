const Note = require('../models/notes.model');
const User = require('../models/user.model');

// Create a new note
exports.createNote = async (req, res) => {
    try {
        const { title, content } = req.body;

        // Validate input
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        // Create note with default content if none provided
        const note = new Note({
            title: title.trim(),
            content: content || '<p></p>',
            user: req.user.id,
            lastEditedBy: req.user.id
        });

        await note.save();

        // Populate user info before sending response
        await note.populate('user', 'email');
        await note.populate('sharedWith', 'email');

        // Add isOwner flag
        const noteObj = note.toObject();
        noteObj.isOwner = true;

        res.status(201).json(noteObj);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Error creating note' });
    }
};

// Get all notes for the authenticated user with advanced search and filters
exports.getNotes = async (req, res) => {
    try {
        const {
            search,             // Search term for title
            filter = 'all',     // Filter type: 'all', 'my', 'shared'
            sortBy = 'updatedAt', // Sort field: 'updatedAt', 'createdAt', 'title'
            sortOrder = 'desc',   // Sort order: 'asc', 'desc'
            page = 1,            // Page number
            limit = 6           // Items per page
        } = req.query;

        // Base query conditions
        let conditions = {
            $or: [
                { user: req.user.id },      // Notes owned by user
                { sharedWith: req.user.id } // Notes shared with user
            ]
        };

        // Apply filter
        if (filter === 'my') {
            conditions = { user: req.user.id };
        } else if (filter === 'shared') {
            conditions = { sharedWith: req.user.id };
        }

        // Apply search
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            conditions.$and = [
                {
                    $or: [
                        { title: searchRegex },
                        { content: searchRegex }  // Search in content too
                    ]
                }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Prepare sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Get total count for pagination
        const totalCount = await Note.countDocuments(conditions);

        // Execute query with all options
        const notes = await Note.find(conditions)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'email')
            .populate('sharedWith', 'email')
            .populate('lastEditedBy', 'email');

        // Format notes with isOwner flag
        const formattedNotes = notes.map(note => ({
            ...note.toObject(),
            isOwner: note.user._id.toString() === req.user.id
        }));

        console.log(totalCount, "totalCount");
        console.log(limit, "limit");
        console.log(page, "page");
        console.log(totalCount / parseInt(limit), "totalCount / parseInt(limit)");

        // Send response with pagination info
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

// Get a single note by ID
exports.getNote = async (req, res) => {
    try {
        // Find note that is either owned by user or shared with user
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.id },
                { sharedWith: req.user.id }
            ]
        })
            .populate('user', 'email')
            .populate('sharedWith', 'email');

        if (!note) {
            return res.status(404).json({ message: 'Note not found or access denied' });
        }

        // Add isOwner flag
        const noteObj = note.toObject();
        noteObj.isOwner = note.user._id.toString() === req.user.id;

        res.json(noteObj);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ message: 'Error fetching note' });
    }
};

// Update a note
exports.updateNote = async (req, res) => {
    try {
        const { title, content } = req.body;

        // Find note that user can edit (either owner or shared)
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.id },
                { sharedWith: req.user.id }
            ]
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or access denied' });
        }

        // Update fields if provided
        if (title !== undefined) {
            note.title = title.trim();
        }
        if (content !== undefined) {
            note.content = content || '<p></p>';
        }

        // Update last editor
        note.lastEditedBy = req.user.id;
        note.lastEditedAt = new Date();

        await note.save();

        // Populate user info before sending response
        await note.populate('user', 'email');
        await note.populate('sharedWith', 'email');
        await note.populate('lastEditedBy', 'email');

        // Add isOwner flag
        const noteObj = note.toObject();
        noteObj.isOwner = note.user._id.toString() === req.user.id;

        res.json(noteObj);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Error updating note' });
    }
};

// Delete a note
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

// Share a note with another user
exports.shareNote = async (req, res) => {
    try {
        const { email } = req.body;

        // Get the current user's email
        const currentUser = await User.findById(req.user.id);

        // Prevent sharing with self
        if (currentUser.email === email) {
            return res.status(400).json({
                message: 'You cannot share a note with yourself'
            });
        }

        // Check if target user exists
        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({
                message: 'User not found with this email'
            });
        }

        // Find the note and check ownership
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!note) {
            return res.status(404).json({
                message: 'Note not found or you do not have permission to share it'
            });
        }

        // Check if already shared with this user
        if (note.sharedWith.includes(targetUser._id.toString())) {
            return res.status(400).json({
                message: 'Note is already shared with this user'
            });
        }

        // Add user to sharedWith array
        note.sharedWith.push(targetUser._id);
        await note.save();

        res.json({
            message: 'Note shared successfully',
            sharedWith: targetUser.email
        });
    } catch (error) {
        console.error('Error sharing note:', error);
        res.status(500).json({ message: 'Error sharing note' });
    }
};

// Get note statistics
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
