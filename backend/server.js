const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();

const usuarioRoutes = require("./routes/usuarioRoutes");
const salaRoutes = require("./routes/salaRoutes");
const agendamentoRoutes = require("./routes/agendamentoRoutes");

const PORT = process.env.PORT || 3000;

app.use(cors()); 

app.use(express.json());

// Rotas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/salas", salaRoutes);
app.use("/api/agendamentos", agendamentoRoutes);

// Endpoint de teste
app.get("/", (req, res) => {
    res.send("API do Sistema de Agendamento de Salas está funcionando!")
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
})
