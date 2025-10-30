const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar se o usuário está autenticado
 */
exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // O token vem no formato "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 401 Unauthorized
        return res.status(401).json({ message: "Token não fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) {
            // 403 Forbidden (token inválido ou expirado)
            return res.status(403).json({ message: "Token inválido." });
        }
        
        // Adiciona o payload do usuário (id, nome, tipo) ao objeto 'req'
        req.usuario = usuario;
        next(); // Passa para a próxima função (o controller)
    });
};

/**
 * Middleware para verificar se o usuário é Admin
 */
exports.verificarAdmin = (req, res, next) => {
    // Este middleware deve rodar *DEPOIS* do verificarToken
    if (req.usuario && req.usuario.tipo === 'admin') {
        next();
    } else {
        // 403 Forbidden
        return res.status(403).json({ message: "Acesso restrito a administradores." });
    }
};