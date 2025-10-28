const express = require("express");
const router = express.Router();
const agendamentoController = require("../controllers/agendamentoController");
const { validarAgendamento } = require("../middleware/validadores");

// Rotas para Agendamentos
router.get("/sala/:id", agendamentoController.listarAgendamentosSala);
router.get("/usuario/:id", agendamentoController.listarAgendamentosUsuario);
router.get("/", agendamentoController.listarTodosAgendamentos); // Admin
router.post("/", validarAgendamento, agendamentoController.criarAgendamento);
router.put("/cancelar/:id", agendamentoController.cancelarAgendamento);

module.exports = router;
