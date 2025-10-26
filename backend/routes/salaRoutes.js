const express = require("express");
const router = express.Router();
const salaController = require("../controllers/salaController");

router.get("/", salaController.listarSalas);
router.post("/", salaController.criarSala);
router.put("/:id", salaController.editarSala);
router.delete("/:id", salaController.excluirSala);

module.exports = router;