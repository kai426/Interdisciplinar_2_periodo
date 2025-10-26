const express = require("express");
const cors = require("cors");
const app = express();

const usuarioRoutes = require("./routes/usuarioRoutes");
const salaRoutes = require("./routes/salaRoutes");

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());

// Rotas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/salas", salaRoutes);

// Endepoint de teste
app.get("/", (req, res) => {
    res.send("API do Sistema de Agendamento de Salas está funcionando!")
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
})
