const pool = require("../db");

class Usuario {
    static async fazerLogin(email, senha) {
        try {
            const [rows] = await pool.execute(
                "SELECT * FROM usuarios WHERE email = ? AND senha = ?",
                [email, senha]
            );
            return rows[0];
        } catch (error) {
            console.log("Erro ao fazer login:", error);
            throw error;
        }
    }

    static async buscarPorId(id) {
        try {
            const [rows] = await pool.execute(
                "SELECT * FROM usuarios WHERE id = ?",
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error("Erro ao buscar usuário por ID:", error);
            throw error;
        }
    }
}

module.exports = Usuario;