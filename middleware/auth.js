// ============================================
// Authentication Middleware
// ============================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'safeher-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token invalid but continue anyway
        }
    }
    next();
};

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            phone: user.phone
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken
};