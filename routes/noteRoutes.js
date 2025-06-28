const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');

// Protected routes (require authentication)
router.use(auth);

// Get note statistics
router.get('/stats', noteController.getNoteStats);

// CRUD operations
router.post('/', noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

// Sharing routes
router.post('/:id/share', noteController.shareNote);

module.exports = router;
