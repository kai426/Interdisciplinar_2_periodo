const Agendamento = require("../models/Agendamento");

exports.listarAgendamentosSala = async (req, res) => {
    try {
        const { id } = req.params;
        const agendamentos = await Agendamento.listarPorSala(id);
        res.status(200).json(agendamentos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar agendamentos da sala", error: error.message });
    }
};

exports.listarAgendamentosUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const agendamentos = await Agendamento.listarPorUsuario(id);
        res.status(200).json(agendamentos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar agendamentos do usuário", error: error.message });
    }
};

exports.listarTodosAgendamentos = async (req, res) => {
    try {
        const agendamentos = await Agendamento.listarTodos();
        res.status(200).json(agendamentos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar todos os agendamentos", error: error.message });
    }
};

exports.criarAgendamento = async (req, res) => {
    try {
        const novoAgendamento = await Agendamento.salvar(req.body);
        res.status(201).json({ message: "Agendamento criado com sucesso", agendamento: novoAgendamento });
    } catch (error) {
        if (error.message === "Horário indisponível para esta sala.") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Erro ao criar agendamento", error: error.message });
    }
};

exports.cancelarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await Agendamento.cancelar(id);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ message: "Erro ao cancelar agendamento", error: error.message });
    }
};
