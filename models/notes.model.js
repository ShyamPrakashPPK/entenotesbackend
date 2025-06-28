const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        default: '<p></p>'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastEditedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
noteSchema.index({ user: 1 });
noteSchema.index({ sharedWith: 1 });

// Pre-save middleware to update lastEditedAt and ensure content is valid HTML
noteSchema.pre('save', function (next) {
    // Update lastEditedAt if content changed
    if (this.isModified('content')) {
        this.lastEditedAt = new Date();
    }

    // Ensure content is at least an empty paragraph if not set
    if (!this.content) {
        this.content = '<p></p>';
    }

    next();
});

module.exports = mongoose.model('Note', noteSchema);
