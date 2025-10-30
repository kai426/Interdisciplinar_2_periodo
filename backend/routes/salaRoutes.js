const express = require("express");
const router = express.Router();
const salaController = require("../controllers/salaController");
const { validarSala } = require("../middleware/validadores");
const { verificarToken, verificarAdmin } = require("../middleware/auth");

// Todas as rotas de sala exigem login
router.use(verificarToken);

router.get("/", salaController.listarSalas);

// Apenas admins podem criar, editar ou excluir salas
router.post("/", [verificarAdmin, validarSala], salaController.criarSala);
router.put("/:id", [verificarAdmin, validarSala], salaController.editarSala);
router.delete("/:id", verificarAdmin, salaController.excluirSala);

module.exports = router;