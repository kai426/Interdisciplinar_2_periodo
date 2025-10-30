const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();

const usuarioRoutes = require("./routes/usuarioRoutes");
const salaRoutes = require("./routes/salaRoutes");
const agendamentoRoutes = require("./routes/agendamentoRoutes");

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

const whitelist = ['https://interdisciplinar-2-periodo.vercel.app/']; 
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            // Permite a URL da whitelist e requisições sem 'origin' (ex: Postman)
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptions));

// Rotas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/salas", salaRoutes);
app.use("/api/agendamentos", agendamentoRoutes);

// Endepoint de teste
app.get("/", (req, res) => {
    res.send("API do Sistema de Agendamento de Salas está funcionando!")
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
})
