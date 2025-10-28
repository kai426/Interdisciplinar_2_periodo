const express = require("express");
const router = express.Router();
const salaController = require("../controllers/salaController");
const { validarSala } = require("../middleware/validadores");

router.get("/", salaController.listarSalas);
router.post("/", validarSala, salaController.criarSala);
router.put("/:id", validarSala, salaController.editarSala);
router.delete("/:id", salaController.excluirSala);

module.exports = router;