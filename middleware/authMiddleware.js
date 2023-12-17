const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');

const authMiddleware = (req, res, next) => {
    let token = null;
    
    if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    if ((req.headers.authorization).startsWith('Bearer ')) {
        token = (req.headers.authorization).substring('Bearer '.length);
    } else {
        return res.status(401).json({ message: 'Unauthorized: Invalid Authorization header value' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        req.user = decoded;
        next();
    });
};

module.exports = authMiddleware;
