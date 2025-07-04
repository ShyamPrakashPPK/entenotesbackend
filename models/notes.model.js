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
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        permission: {
            type: String,
            enum: ['view', 'edit'],
            default: 'edit'
        }
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

noteSchema.index({ user: 1 });
noteSchema.index({ sharedWith: 1 });

noteSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        this.lastEditedAt = new Date();
    }
    if (!this.content) {
        this.content = '<p></p>';
    }

    next();
});

module.exports = mongoose.model('Note', noteSchema);
