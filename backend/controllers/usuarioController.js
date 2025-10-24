const Usuario = require("../models/Usuario");

exports.login = async (req, res) => {
    const {email, senha} = req.body;

    try {
        const usuario = await Usuario.fazerLogin(email, senha);

        if (usuario) {
            res.status(200).json({message: "Login bem-sucedido", usuario: {id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo}});
        } else {
            res.status(401).json({message: "Credenciais inválidas"});
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({message: "Erro ao fazer login"});
    }
}