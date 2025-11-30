// Configuração da API
const API_URL = "https://interdisciplinar2periodo-production.up.railway.app/api";

// Variáveis globais
let usuarioLogado = null;
let salaSelecionada = null;
let todasAsSalas = []; // Nova variável para armazenar as salas e permitir filtragem

// ===============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ===============================================

function getToken() {
    return localStorage.getItem("token");
}

function getAuthHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

async function fazerLogin(email, senha) {
    try {
        const response = await fetch(`${API_URL}/usuarios/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            const usuario = parseJwt(data.token);
            if (usuario.tipo === 'admin') {
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

function fazerLogout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
};

function verificarLogin() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return null;
    }
    
    usuarioLogado = parseJwt(token);
    
    if (!usuarioLogado || (usuarioLogado.exp * 1000) < Date.now()) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return null;
    }

    return usuarioLogado;
};

// ===============================================
// FUNÇÕES DE SALAS E FILTROS
// ===============================================

async function buscarSalas() {
    try {
        const response = await fetch(`${API_URL}/salas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Falha ao buscar salas');
        
        // Salva na variável global para usar no filtro depois
        todasAsSalas = await response.json();
        
        renderizarListaSalas(todasAsSalas);
        preencherSelectSalas(todasAsSalas);
    } catch (error) {
        console.error("Erro ao buscar salas:", error);
        if (error.status === 401 || error.status === 403) fazerLogout();
    }
}

// Nova função para filtrar as salas visualmente
function filtrarSalas() {
    const filtroElement = document.getElementById("filtroCategoria");
    if (!filtroElement) return;

    const categoriaSelecionada = filtroElement.value;
    
    if (categoriaSelecionada === "todas") {
        renderizarListaSalas(todasAsSalas);
    } else {
        const salasFiltradas = todasAsSalas.filter(sala => sala.categoria === categoriaSelecionada);
        renderizarListaSalas(salasFiltradas);
    }
}

function renderizarListaSalas(salas) {
    const listaSalas = document.getElementById("listaSalas");
    if (!listaSalas) return;
    
    listaSalas.innerHTML = "";

    if (salas.length === 0) {
        listaSalas.innerHTML = "<p>Nenhuma sala encontrada nesta categoria.</p>";
        return;
    }

    salas.forEach((sala) => {
        const salaCard = document.createElement("div");
        salaCard.className = "sala-card";
        
        // Adicionamos a etiqueta de categoria no topo do card
        salaCard.innerHTML = `
            <span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 12px; font-size: 10px; float: right; font-weight: 600;">
                ${sala.categoria || 'Geral'}
            </span>
            <h3 style="margin-top: 5px;">${sala.nome_sala}</h3>
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
};

async function selecionarSala(sala, cardElement) {
    salaSelecionada = sala;
    document.querySelectorAll(".sala-card").forEach((card) => {
        card.classList.remove("selecionada");
    });
    if (cardElement) cardElement.classList.add("selecionada");

    document.getElementById("nomeSalaSelecionada").textContent = sala.nome_sala;
    document.getElementById("salaInfo").style.display = "block";
    document.getElementById("nenhumaSelecao").style.display = "none";
    document.getElementById("tabelaHorarios").style.display = "table";

    // Atualiza o select de reserva automaticamente
    const selectSala = document.getElementById("salaSelecionada");
    if (selectSala) selectSala.value = sala.id;

    await buscarAgendamentosDaSala(sala.id);
};

// ===============================================
// FUNÇÕES DE AGENDAMENTOS
// ===============================================

function renderizarTabelaHorarios(agendamentos) {
    const tabelaHorarios = document.getElementById("tabelaHorarios");
    const corpoTabela = document.getElementById("corpoTabelaHorarios");
    const dataSelecionadaInput = document.getElementById("dataHorarios");

    if (salaSelecionada) {
        corpoTabela.innerHTML = "";
        // Pega a data selecionada ou usa hoje se estiver vazio
        const dataVal = dataSelecionadaInput.value ? dataSelecionadaInput.value : new Date().toISOString().split('T')[0];
        const dataSelecionada = new Date(dataVal + 'T00:00:00');

        for (let hora = 8; hora < 22; hora++) {
            const horarioInicioStr = `${hora.toString().padStart(2, "0")}:00`;
            const horarioFimStr = `${(hora + 1).toString().padStart(2, "0")}:00`;
            
            const inicioSlot = new Date(dataSelecionada);
            inicioSlot.setHours(hora, 0, 0, 0);
            
            const fimSlot = new Date(dataSelecionada);
            fimSlot.setHours(hora + 1, 0, 0, 0);

            const agendado = agendamentos.some((agendamento) => {
                const inicioAgendamento = new Date(agendamento.data_hora_inicio.replace(' ', 'T'));
                const fimAgendamento = new Date(agendamento.data_hora_fim.replace(' ', 'T'));
                // Verifica sobreposição de horários
                return (inicioAgendamento < fimSlot) && (fimAgendamento > inicioSlot);
            });

            const status = agendado ? "Ocupado" : "Livre";
            const statusClass = agendado ? "status-ocupado" : "status-livre";

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${horarioInicioStr} - ${horarioFimStr}</td>
                <td class="${statusClass}">${status}</td>
            `;
            corpoTabela.appendChild(linha);
        }
    }
}

async function buscarAgendamentosDaSala(idSala) {
    try {
        const response = await fetch(`${API_URL}/agendamentos/sala/${idSala}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Falha ao buscar agendamentos da sala');
        const agendamentos = await response.json();
        renderizarTabelaHorarios(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos da sala:", error);
        if (error.status === 401 || error.status === 403) fazerLogout();
    }
};

async function buscarAgendamentosUsuario() {
    if (!usuarioLogado) return;
    try {
        const response = await fetch(
            `${API_URL}/agendamentos/usuario/${usuarioLogado.id}`, {
                headers: getAuthHeaders()
            }
        );
        if (!response.ok) throw new Error('Falha ao buscar agendamentos do usuário');
        const agendamentos = await response.json();
        renderizarAgendamentosUsuario(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos do usuário:", error);
        if (error.status === 401 || error.status === 403) fazerLogout();
    }
};

function renderizarAgendamentosUsuario(agendamentos) {
    const corpoAgendamentos = document.getElementById("corpoAgendamentos");
    const nenhumAgendamento = document.getElementById("nenhumAgendamento");

    if (agendamentos.length === 0) {
        nenhumAgendamento.style.display = "block";
        corpoAgendamentos.innerHTML = "";
    } else {
        nenhumAgendamento.style.display = "none";
        corpoAgendamentos.innerHTML = "";

        const agora = new Date();

        agendamentos.forEach((agendamento) => {
            const linha = document.createElement("tr");

            const dataInicio = new Date(agendamento.data_hora_inicio.replace(' ', 'T')).toLocaleString("pt-BR");
            const dataFimOriginal = new Date(agendamento.data_hora_fim.replace(' ', 'T'));
            const dataFimFormatada = dataFimOriginal.toLocaleString("pt-BR");

            let statusTexto = agendamento.status;
            let statusClass = "";
            let acaoBotao = "";

            if (agendamento.status === "cancelado") {
                statusTexto = "Cancelado";
                statusClass = "status-cancelado";
            } else if (agendamento.status === "confirmado") {
                if (dataFimOriginal < agora) {
                    statusTexto = "Realizado";
                    statusClass = "status-realizado";
                } else {
                    statusTexto = "Confirmado";
                    statusClass = "status-livre";
                    acaoBotao = `<button class="btn-cancelar" data-id="${agendamento.id}">Cancelar</button>`;
                }
            }

            linha.innerHTML = `
                <td>${agendamento.nome_sala}</td>
                <td>${dataInicio}</td>
                <td>${dataFimFormatada}</td>
                <td class="${statusClass}">${statusTexto}</td>
                <td>${acaoBotao}</td>
            `;
            corpoAgendamentos.appendChild(linha);
        });

        document.querySelectorAll(".btn-cancelar").forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                cancelarAgendamento(id);
            });
        });
    }
}

async function criarAgendamento(dados) {
    try {
        const response = await fetch(`${API_URL}/agendamentos`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(dados),
        });

        const data = await response.json();

        if (response.ok) {
            mostrarMensagem("Agendamento criado com sucesso!", "sucesso");
            document.getElementById("formReserva").reset();
            buscarAgendamentosUsuario();
            
            const idSalaAgendada = dados.id_sala;
            if (salaSelecionada && salaSelecionada.id === idSalaAgendada) {
                buscarAgendamentosDaSala(idSalaAgendada);
            }
        } else {
            let msgErro = data.message || "Erro ao criar agendamento";
            if (data.errors) {
                msgErro = data.errors.map(e => e.msg).join(' ');
            }
            mostrarMensagem(msgErro, "erro");
        }
    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        mostrarMensagem("Erro ao conectar com o servidor", "erro");
    }
};

async function cancelarAgendamento(idAgendamento) {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
        try {
            const response = await fetch(
                `${API_URL}/agendamentos/cancelar/${idAgendamento}`,
                {
                    method: "PUT",
                    headers: getAuthHeaders(),
                }
            );

            const data = await response.json();

            if (response.ok) {
                mostrarMensagem("Agendamento cancelado com sucesso!", "sucesso");
                buscarAgendamentosUsuario();
                if (salaSelecionada) {
                    buscarAgendamentosDaSala(salaSelecionada.id);
                }
            } else {
                mostrarMensagem(data.message || "Erro ao cancelar agendamento", "erro");
            }
        } catch (error) {
            console.error("Erro ao cancelar agendamento:", error);
            mostrarMensagem("Erro ao conectar com o servidor", "erro");
        }
    }
};

// ===============================================
// FUNÇÕES AUXILIARES E EVENT LISTENERS
// ===============================================

function mostrarErro(mensagem) {
    const mensagemErro = document.getElementById("mensagemErro");
    if (mensagemErro) {
        mensagemErro.textContent = mensagem;
        mensagemErro.style.display = "block";
    }
};

function mostrarMensagem(mensagem, tipo) {
    let msgElement = document.getElementById("mensagemReserva");
    if (!msgElement) msgElement = document.getElementById("mensagemHorarios");

    if (msgElement) {
        msgElement.textContent = mensagem;
        msgElement.className = `mensagem ${tipo}`;
        msgElement.style.display = "block";
        setTimeout(() => {
            msgElement.style.display = "none";
        }, 3000);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Lógica do Login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            fazerLogin(email, senha);
        });
    }

    // 2. Lógica do Dashboard
    const dashboardElement = document.getElementById("nomeUsuario");
    if (dashboardElement && window.location.pathname.includes('dashboard.html')) {
        
        const user = verificarLogin();
        
        if (user) {
            dashboardElement.textContent = user.nome;

            buscarSalas();
            buscarAgendamentosUsuario();

            const dataHorariosInput = document.getElementById("dataHorarios");
            const btnVerificarHorarios = document.getElementById("btnVerificarHorarios");

            if (dataHorariosInput) {
                dataHorariosInput.valueAsDate = new Date();
                // Recarrega a tabela se mudar a data (opcional, UX melhor)
                dataHorariosInput.addEventListener('change', () => {
                    if (salaSelecionada) buscarAgendamentosDaSala(salaSelecionada.id);
                });
            }

            if (btnVerificarHorarios) {
                btnVerificarHorarios.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!salaSelecionada) {
                        mostrarMensagem("Por favor, selecione uma sala primeiro.", "erro");
                        return;
                    }
                    buscarAgendamentosDaSala(salaSelecionada.id);
                });
            }

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

        const btnLogout = document.getElementById("btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", fazerLogout);
        }
    }
});

// Disponibiliza a função de filtro no escopo global para o onchange do HTML
window.filtrarSalas = filtrarSalas;