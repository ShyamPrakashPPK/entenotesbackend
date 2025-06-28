const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const sendResponse = require('../utils/response');

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return sendResponse(res, 401, 'Token required');

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch {
        sendResponse(res, 401, 'Invalid token');
    }
};
