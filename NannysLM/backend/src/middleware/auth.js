const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar tokens JWT en las rutas protegidas
 */
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Token no proporcionado.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido.'
        });
    }
};

/**
 * Middleware para verificar roles de usuario
 */
const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado.'
            });
        }
        
        if (roles.includes(req.user.user_type)) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso.'
            });
        }
    };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token inválido, pero continuamos sin usuario
            req.user = null;
        }
    }
    
    next();
};

module.exports = {
    verifyToken,
    verifyRole,
    optionalAuth
};