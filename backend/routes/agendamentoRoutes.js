const express = require("express");
const router = express.Router();
const agendamentoController = require("../controllers/agendamentoController");

// Rotas para Agendamentos
router.get("/sala/:id", agendamentoController.listarAgendamentosSala);
router.get("/usuario/:id", agendamentoController.listarAgendamentosUsuario);
router.get("/", agendamentoController.listarTodosAgendamentos); // Admin
router.post("/", agendamentoController.criarAgendamento);
router.put("/cancelar/:id", agendamentoController.cancelarAgendamento);

module.exports = router;
