module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
};
