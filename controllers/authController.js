const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');
const sendResponse = require('../utils/response');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return sendResponse(res, 400, 'Email already registered');
            }
            return sendResponse(res, 400, 'Username already taken');
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashed });

        sendResponse(res, 201, 'User registered successfully', { id: user._id });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.name === 'ValidationError') {
            return sendResponse(res, 400, 'Invalid input data');
        }
        sendResponse(res, 500, 'Registration failed. Please try again later.');
    }
};

exports.login = async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    console.log(email, password, "email and password");
    try {
        const user = await User.findOne({ email });
        console.log(user, "user");
        if (!user) return sendResponse(res, 404, 'User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch, "isMatch");
        if (!isMatch) return sendResponse(res, 401, 'Invalid credentials');
        console.log(jwtSecret, "jwtSecret");
        console.log(jwtExpiresIn, "jwtExpiresIn");
        console.log(user._id, "user._id");
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: jwtExpiresIn });
        console.log(token, "token");
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email
        };
        sendResponse(res, 200, 'Login successful', { token, user: userData });
    } catch (err) {
        sendResponse(res, 500, 'Login error');
    }
};
