const { validationResult } = require('express-validator');
const sendResponse = require('../utils/response');

module.exports = (req, res, next) => {
    console.log(req.body, "req.body");
    const errors = validationResult(req);
    console.log(errors, "errors");
    if (!errors.isEmpty()) {
        return sendResponse(res, 400, 'Validation Error', errors.array());
    }
    next();
};
