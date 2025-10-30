const pool = require("../db");
const bcrypt = require("bcrypt");

class Usuario {
    
    /**
     * Cria um novo usuário com senha hasheada
     */
    static async registrar(dados) {
        const { primeiro_nome, ultimo_nome, nascimento, genero, email, senha, tipo = 'aluno' } = dados;

        // Gera o hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashSenha = await bcrypt.hash(senha, salt);

        try {
            // Atualiza o SQL INSERT
            const [result] = await pool.execute(
                "INSERT INTO usuarios (primeiro_nome, ultimo_nome, nascimento, genero, email, senha, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [primeiro_nome, ultimo_nome, nascimento, genero, email, hashSenha, tipo]
            );
            
            // Retorna os dados essenciais
            return { id: result.insertId, nome: primeiro_nome, email, tipo };
        } catch (error) {
            console.log("Erro ao registrar usuário:", error);
            // Trata erro de email duplicado
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error("Este email já está cadastrado.");
            }
            throw error;
        }
    }

    /**
     * Verifica as credenciais de login
     */
    static async fazerLogin(email, senha) {
        try {
            // 1. Busca o usuário pelo email
            const [rows] = await pool.execute(
                "SELECT * FROM usuarios WHERE email = ?",
                [email]
            );
            const usuario = rows[0];

            // 2. Se o usuário não existe, retorna nulo
            if (!usuario) {
                return null;
            }

            // 3. Compara a senha enviada com o hash salvo no banco
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

            // 4. Se a senha for correta, retorna o usuário
            if (senhaCorreta) {
                // Importante: Passa 'primeiro_nome' como 'nome' para o resto da aplicação
                const { id, primeiro_nome, email, tipo } = usuario;
                return { id, nome: primeiro_nome, email, tipo };
            }
            
            // 5. Se a senha estiver incorreta, retorna nulo
            return null;

        } catch (error) {
            console.log("Erro ao fazer login:", error);
            throw error;
        }
    }

    static async buscarPorId(id) {
        try {
            const [rows] = await pool.execute(
                "SELECT id, primeiro_nome, ultimo_nome, email, tipo FROM usuarios WHERE id = ?",
                [id]
            );
            // Renomeia 'primeiro_nome' para 'nome' para consistência
            const { primeiro_nome, ...rest } = rows[0];
            return { nome: primeiro_nome, ...rest };
        } catch (error) {
            console.error("Erro ao buscar usuário por ID:", error);
            throw error;
        }
    }
}

module.exports = Usuario;