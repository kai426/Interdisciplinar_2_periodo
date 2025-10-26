const pool = require("../db");

class Agendamento {
    static async verificarDisponibilidade(id_sala, inicio, fim) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM agendamentos
         WHERE id_sala = ?
         AND status = 'confirmado'
         AND (
             (data_hora_inicio < ? AND data_hora_fim > ?)
             OR (data_hora_inicio >= ? AND data_hora_inicio < ?)
             OR (data_hora_fim > ? AND data_hora_fim <= ?)
         )`,
                [id_sala, fim, inicio, inicio, fim, inicio, fim]
            );

            return rows.length === 0;
        } catch (error) {
            console.error("Erro ao verificar disponibilidade de agendamento:", error);
            throw error;
        }
    }

    static async salvar(dados) {
        const { id_usuario, id_sala, data_hora_inicio, data_hora_fim } = dados;

        const disponivel = await Agendamento.verificarDisponibilidade(
            id_sala,
            data_hora_inicio,
            data_hora_fim
        );

        if (!disponivel) {
            throw new Error("Sala indisponível para o horário selecionado.");
        }

        try {
            const [result] = await pool.execute(
                "INSERT INTO agendamentos (id_usuario, id_sala, data_hora_inicio, data_hora_fim) VALUES (?, ?, ?, ?)",
                [id_usuario, id_sala, data_hora_inicio, data_hora_fim]
            );
            return { id: result.insertId, ...dados };
        } catch (error) {
            console.error("Erro ao salvar agendamento:", error);
            throw error;
        }
    }

    static async cancelar(id) {
        try {
            await pool.execute("UPDATE agendamentos SET status = 'cancelado' WHERE id = ?", [id]);
            return { message: "Agendamento cancelado com sucesso." };
        } catch (error) {
            console.error("Erro ao cancelar agendamento:", error);
            throw error;
        }
    }

    static async listarPorUsuario(id_usuario) {
        try {
            const [rows] = await pool.execute("SELECT * FROM agendamentos WHERE id_usuario = ?", [id_usuario]);
            return rows;
        } catch (error) {
            console.error("Erro ao listar agendamentos por usuário:", error);
            throw error;
        }
    }

    static async listarPorSala(id_sala) {
        try {
            const [rows] = await pool.execute("SELECT * FROM agendamentos WHERE id_sala = ? AND status = 'confirmado'", [id_sala]);
            return rows;
        } catch (error) {
            console.error("Erro ao listar agendamentos por sala:", error);
            throw error;
        }
    }

    static async listarTodos() {
        try {
            const [rows] = await pool.execute("SELECT agendamentos.*, usuarios.nome as nome_usuario, salas.nome_sala FROM agendamentos JOIN usuarios ON agendamentos.id_usuario = usuarios.id JOIN salas ON agendamentos.id_sala = salas.id");
            return rows;
        } catch (error) {
            console.error("Erro ao listar todos os agendamentos:", error);
            throw error;
        }
    }
};

module.exports = Agendamento;