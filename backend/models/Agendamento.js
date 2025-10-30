const pool = require("../db");
const { ErroDisponibilidade, ErroValidacao } = require("../utils/erros");

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

      // Se encontrou algum agendamento conflitante, lança o erro customizado
      if (rows.length > 0) {
        throw new ErroDisponibilidade(
          "Sala indisponível para o horário selecionado."
        );
      }

      // Se não encontrou, retorna true (disponível)
      return true;
    } catch (error) {
      console.error("Erro ao verificar disponibilidade de agendamento:", error);
      // Se o erro for o que acabamos de lançar, repassa ele
      if (error instanceof ErroDisponibilidade) {
        throw error;
      }
      // Se for outro erro (ex: falha no DB), lança um erro genérico
      throw new Error("Erro ao verificar disponibilidade de agendamento.");
    }
  }

  static async salvar(dados) {
    const { id_usuario, id_sala, data_hora_inicio, data_hora_fim } = dados;

    // Adicionar validação de datas
    if (new Date(data_hora_fim) <= new Date(data_hora_inicio)) {
      throw new ErroValidacao(
        "A data/hora de fim deve ser posterior à data/hora de início."
      );
    }

    // A função verificarDisponibilidade agora retorna true ou lança um erro.
    // Se lançar um erro, a execução do 'salvar' para aqui e vai para o 'catch' do controller.
    await Agendamento.verificarDisponibilidade(
      id_sala,
      data_hora_inicio,
      data_hora_fim
    );

    // Se não lançou erro, a sala está disponível.
    // O bloco 'if (!disponivel)' não é mais necessário.

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
      await pool.execute(
        "UPDATE agendamentos SET status = 'cancelado' WHERE id = ?",
        [id]
      );
      return { message: "Agendamento cancelado com sucesso." };
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      throw error;
    }
  }

  static async listarPorUsuario(id_usuario) {
    try {
      const [rows] = await pool.execute(
        "SELECT agendamentos.*, salas.nome_sala " +
          "FROM agendamentos " +
          "JOIN salas ON agendamentos.id_sala = salas.id " +
          "WHERE agendamentos.id_usuario = ?",
        [id_usuario]
      );
      return rows;
    } catch (error) {
      console.error("Erro ao listar agendamentos por usuário:", error);
      throw error;
    }
  }

  static async listarPorSala(id_sala) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM agendamentos WHERE id_sala = ? AND status = 'confirmado'",
        [id_sala]
      );
      return rows;
    } catch (error) {
      console.error("Erro ao listar agendamentos por sala:", error);
      throw error;
    }
  }

  static async listarTodos() {
    try {
      const [rows] = await pool.execute(
        "SELECT agendamentos.*, CONCAT(usuarios.primeiro_nome, ' ', usuarios.ultimo_nome) as nome_usuario, salas.nome_sala " +
          "FROM agendamentos " +
          "JOIN usuarios ON agendamentos.id_usuario = usuarios.id " +
          "JOIN salas ON agendamentos.id_sala = salas.id"
      );
      return rows;
    } catch (error) {
      console.error("Erro ao listar todos os agendamentos:", error);
      throw error;
    }
  }
}

module.exports = Agendamento;
