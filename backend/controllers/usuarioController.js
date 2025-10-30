const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");

// Função para gerar o token JWT
function gerarToken(usuario) {
    return jwt.sign(
        { 
            id: usuario.id, 
            nome: usuario.nome, 
            email: usuario.email, 
            tipo: usuario.tipo 
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' } // Token expira em 8 horas
    );
}

// Controller de Login
exports.login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await Usuario.fazerLogin(email, senha);

        if (usuario) {
            // Se o login for bem-sucedido, gera um token
            const token = gerarToken(usuario);
            // Envia o token para o frontend
            res.status(200).json({ message: "Login bem-sucedido", token: token });
        } else {
            // Se as credenciais estiverem erradas
            res.status(401).json({ message: "Credenciais inválidas" });
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ message: "Erro ao fazer login" });
    }
}

// Controller de Registro (Novo)
exports.registrar = async (req, res) => {
    try {
        const novoUsuario = await Usuario.registrar(req.body);
        
        // Após registrar, faz o login e já retorna um token
        const token = gerarToken(novoUsuario);
        res.status(201).json({ message: "Usuário registrado com sucesso", token: token });

    } catch (error) {
        if (error.message === "Este email já está cadastrado.") {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: "Erro ao registrar usuário", error: error.message });
    }
}