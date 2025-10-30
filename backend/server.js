const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();

const usuarioRoutes = require("./routes/usuarioRoutes");
const salaRoutes = require("./routes/salaRoutes");
const agendamentoRoutes = require("./routes/agendamentoRoutes");

const PORT = process.env.PORT || 3000;

const whitelist = ['https://interdisciplinar-2-periodo.vercel.app']; 

const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições da whitelist E requisições sem 'origin' (ex: Postman)
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200 // Para compatibilidade
};

app.use(cors(corsOptions));

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