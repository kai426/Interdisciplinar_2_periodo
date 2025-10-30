const express = require("express");
const router = express.Router();
const agendamentoController = require("../controllers/agendamentoController");
const { validarAgendamento } = require("../middleware/validadores");
const { verificarToken, verificarAdmin } = require("../middleware/auth");

// Todas as rotas de agendamento exigem login
router.use(verificarToken);

// Rotas para Agendamentos
router.get("/sala/:id", agendamentoController.listarAgendamentosSala);
router.get("/usuario/:id", agendamentoController.listarAgendamentosUsuario);
router.post("/", validarAgendamento, agendamentoController.criarAgendamento);
router.put("/cancelar/:id", agendamentoController.cancelarAgendamento);

// Apenas admins podem ver TODOS os agendamentos
router.get("/", verificarAdmin, agendamentoController.listarTodosAgendamentos);

module.exports = router;
