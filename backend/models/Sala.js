const pool = require("../db");
const { ErroValidacao } = require("../utils/erros");

class Sala {
    static async cadastrar(dados) {
        const { nome_sala, capacidade, descricao } = dados;

        try {
            const [result] = await pool.execute(
                "INSERT INTO salas (nome_sala, capacidade, descricao) VALUES (?, ?, ?)",
                [nome_sala, capacidade, descricao]
            );
            return { id: result.insertId, ...dados };
        } catch (error) {
            console.log("Erro ao cadastrar sala:", error);
            throw error;
        }
    }

    static async editar(id, dados) {
        const { nome_sala, capacidade, descricao } = dados;
        try {
            await pool.execute(
                "UPDATE salas SET nome_sala = ?, capacidade = ?, descricao = ? WHERE id = ?",
                [nome_sala, capacidade, descricao, id]
            );
            return { id, ...dados };
        } catch (error) {
            console.error("Erro ao editar sala:", error);
            throw error;
        }
    }

    static async excluir(id) {
        try {
            const [agendamentos] = await pool.execute(
                "SELECT id FROM agendamentos WHERE id_sala = ?",
                [id]
            );

            if (agendamentos.length > 0) {
                throw new ErroValidacao("Esta sala não pode ser excluída, pois possui agendamentos associados.");
            }

            await pool.execute("DELETE FROM salas WHERE id = ?", [id]);

            return { message: "Sala excluida com sucesso." };
        } catch (error) {
            console.error("Erro ao excluir sala:", error);
            throw error;
        }
    }

    static async listarTodos() {
        try {
            const [rows] = await pool.execute("SELECT * FROM salas");
            return rows;
        } catch (error) {
            console.error("Erro ao listar salas:", error);
            throw error;
        }
    }
};

module.exports = Sala;