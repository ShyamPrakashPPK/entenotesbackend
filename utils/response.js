module.exports = function sendResponse(res, status, message, data = null) {
    res.status(status).json({ status, message, data });
};
