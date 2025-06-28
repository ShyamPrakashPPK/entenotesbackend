const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.post('/register', [
    body('username').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 5 })
], validate, register);

router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty()
], validate, login);

module.exports = router;
