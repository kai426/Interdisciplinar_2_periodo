// Configuração da API
const API_URL = "http://localhost:3000/api";

// Variáveis globais
let usuarioLogado = null;
let salaSelecionada = null;

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

// Fazer login
async function fazerLogin(email, senha) {
    try {
        const response = await fetch(`${API_URL}/usuarios/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, senha }),
        });

        const data = await response.json();

        if (response.ok) {
            usuarioLogado = data.usuario;
            localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
            // Verifica o tipo de usuário para redirecionar
            if (usuarioLogado.tipo === 'admin') {
                window.location.href = "admin.html";
            } else {
                window.location.href = "dashboard.html";
            }
        } else {
            mostrarErro(data.message || "Erro ao fazer login");
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        mostrarErro("Erro ao conectar com o servidor");
    }
};

// Fazer logout
function fazerLogout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
};

// Verificar se o usuário está logado
function verificarLogin() {
    const usuarioArmazenado = localStorage.getItem("usuarioLogado");
    if (!usuarioArmazenado) {
        window.location.href = "index.html";
        return null;
    }
    usuarioLogado = JSON.parse(usuarioArmazenado);
    return usuarioLogado;
};

// ========== FUNÇÕES DE SALAS ==========
async function buscarSalas() {
    try {
        const response = await fetch(`${API_URL}/salas`);
        const salas = await response.json();
        renderizarListaSalas(salas);
        preencherSelectSalas(salas);
    } catch (error) {
        console.error("Erro ao buscar salas:", error);
    }
}

// Renderizar lista de salas
function renderizarListaSalas(salas) {
    const listaSalas = document.getElementById("listaSalas");
    listaSalas.innerHTML = "";

    salas.forEach((sala) => {
        const salaCard = document.createElement("div");
        salaCard.className = "sala-card";
        salaCard.innerHTML = `
      <h3>${sala.nome_sala}</h3>
      <p><strong>Capacidade:</strong> ${sala.capacidade} pessoas</p>
      <p><strong>Descrição:</strong> ${sala.descricao || "Sem descrição"}</p>
    `;
        salaCard.addEventListener("click", (e) => {
            const card = e.target.closest(".sala-card");
            selecionarSala(sala, card);
        });
        listaSalas.appendChild(salaCard);
    });
};

// Preencher select de salas
function preencherSelectSalas(salas) {
    const selectSala = document.getElementById("salaSelecionada");
    if (selectSala) {
        selectSala.innerHTML = '<option value="">Selecione uma sala</option>';
        salas.forEach((sala) => {
            const option = document.createElement("option");
            option.value = sala.id;
            option.textContent = sala.nome_sala;
            selectSala.appendChild(option);
        });
    }
}

// ========== FUNÇÕES AUXILIARES ==========

// Mostrar erro
function mostrarErro(mensagem) {
    const mensagemErro = document.getElementById("mensagemErro");
    if (mensagemErro) {
        mensagemErro.textContent = mensagem;
        mensagemErro.style.display = "block";
    }
}

// ========== EVENT LISTENERS ==========

// Login
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            fazerLogin(email, senha);
        });
    }

    // 2. Lógica do Dashboard (dashboard.html)
    const dashboardElement = document.getElementById("nomeUsuario");
    if (dashboardElement && window.location.pathname.includes('dashboard.html')) {
        const user = verificarLogin();
        if (user) {
            dashboardElement.textContent = user.nome;

            buscarSalas();
            buscarAgendamentosUsuario();

            // Formulário de reserva
            const formReserva = document.getElementById("formReserva");
            if (formReserva) {
                formReserva.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const idSala = document.getElementById("salaSelecionada").value;
                    const dataHoraInicio = document.getElementById("dataHoraInicio").value;
                    const dataHoraFim = document.getElementById("dataHoraFim").value;

                    if (!idSala) {
                        mostrarMensagem("Selecione uma sala", "erro");
                        return;
                    }

                    criarAgendamento({
                        id_usuario: usuarioLogado.id,
                        id_sala: parseInt(idSala),
                        data_hora_inicio: dataHoraInicio,
                        data_hora_fim: dataHoraFim,
                    });
                });
            }
        }

        // Logout
        const btnLogout = document.getElementById("btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", fazerLogout);
        }
    }
});
// 