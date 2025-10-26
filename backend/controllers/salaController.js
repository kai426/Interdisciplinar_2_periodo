const Sala = require("../models/Sala");

exports.listarSalas = async (req, res) => {
    try {
        const salas = await Sala.listarTodos();
        res.status(200).json(salas);
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar salas", error: error.message });
    }
};

exports.criarSala = async (req, res) => {
    try {
        const novaSala = await Sala.cadastrar(req.body);
        res.status(201).json({ message: "Sala criada com sucesso", sala: novaSala });
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar sala", error: error.message });
    }
};

exports.editarSala = async (req, res) => {
    try {
        const { id } = req.params;
        const salaAtualizada = await Sala.editar(id, req.body);
        res.status(200).json({ message: "Sala atualizada com sucesso", sala: salaAtualizada });
    } catch (error) {
        res.status(500).json({ message: "Erro ao editar sala", error: error.message });
    }
};

exports.excluirSala = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await Sala.excluir(id);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ message: "Erro ao excluir sala", error: error.message });
    }
};