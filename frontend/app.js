// Configuração da API
const API_URL = "https://api-agendamento-salas.onrender.com";

// Variáveis globais
let usuarioLogado = null; // Agora será preenchido pelo token
let salaSelecionada = null;

// ===============================================
// NOVAS FUNÇÕES DE AUTENTICAÇÃO
// ===============================================

// Helper para pegar o token
function getToken() {
    return localStorage.getItem("token");
}

// Helper para criar os headers com o token
function getAuthHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// Helper para decodificar o token (de forma simples)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null; // Token inválido
    }
}

// Fazer login (Atualizado)
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
            // Salva o TOKEN no localStorage
            localStorage.setItem("token", data.token);
            
            // Decodifica o token para saber para onde redirecionar
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

// Fazer logout (Atualizado)
function fazerLogout() {
    localStorage.removeItem("token"); // Remove o token
    window.location.href = "login.html";
};

// Verificar se o usuário está logado (Atualizado)
function verificarLogin() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return null;
    }
    
    // Decodifica o token para obter os dados do usuário
    usuarioLogado = parseJwt(token);
    
    // Verifica se o token é válido (simples)
    if (!usuarioLogado || (usuarioLogado.exp * 1000) < Date.now()) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return null;
    }

    return usuarioLogado;
};

// ===============================================
// FUNÇÕES DA API (Atualizadas com Headers)
// ===============================================

// ========== FUNÇÕES DE SALAS ==========
async function buscarSalas() {
    try {
        // Adicionado headers de autenticação
        const response = await fetch(`${API_URL}/salas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Falha ao buscar salas');
        const salas = await response.json();
        renderizarListaSalas(salas);
        preencherSelectSalas(salas);
    } catch (error) {
        console.error("Erro ao buscar salas:", error);
        // Se o token for inválido, desloga
        if (error.status === 401 || error.status === 403) fazerLogout();
    }
}

// ... (renderizarListaSalas e preencherSelectSalas não mudam) ...
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

// Selecionar sala
async function selecionarSala(sala, cardElement) {
    salaSelecionada = sala;
    document.querySelectorAll(".sala-card").forEach((card) => {
        card.classList.remove("selecionada");
    });
    cardElement.classList.add("selecionada");

    // Adiciona o nome da sala ao h2
    document.getElementById("nomeSalaSelecionada").textContent = sala.nome_sala;
    document.getElementById("salaInfo").style.display = "block";
    document.getElementById("nenhumaSelecao").style.display = "none";

    // Mostra a tabela (mesmo que vazia)
    document.getElementById("tabelaHorarios").style.display = "table";

    // Agora, força a verificação (ou o usuário clica em "Verificar")
    await buscarAgendamentosDaSala(sala.id);
};

// ========== FUNÇÕES DE AGENDAMENTOS ==========

// ... (renderizarTabelaHorarios não muda) ...
function renderizarTabelaHorarios(agendamentos) {
    const tabelaHorarios = document.getElementById("tabelaHorarios");
    const corpoTabela = document.getElementById("corpoTabelaHorarios");
    const nenhumaSelecao = document.getElementById("nenhumaSelecao");
    const salaInfo = document.getElementById("salaInfo");
    const nomeSala = document.getElementById("nomeSalaSelecionada");
    const dataSelecionadaInput = document.getElementById("dataHorarios");

    if (salaSelecionada) {
        salaInfo.style.display = "block";
        nomeSala.textContent = salaSelecionada.nome_sala;
        tabelaHorarios.style.display = "table";
        nenhumaSelecao.style.display = "none";
        corpoTabela.innerHTML = "";
        const dataSelecionada = new Date(dataSelecionadaInput.value + 'T00:00:00');

        for (let hora = 8; hora < 18; hora++) {
            const horarioInicio = `${hora.toString().padStart(2, "0")}:00`;
            const horarioFim = `${(hora + 1).toString().padStart(2, "0")}:00`;
            const inicioSlot = new Date(dataSelecionada);
            inicioSlot.setHours(hora, 0, 0, 0);
            const fimSlot = new Date(dataSelecionada);
            fimSlot.setHours(hora + 1, 0, 0, 0);

            const agendado = agendamentos.some((agendamento) => {
                const inicioAgendamento = new Date(agendamento.data_hora_inicio.replace(' ', 'T'));
                const fimAgendamento = new Date(agendamento.data_hora_fim.replace(' ', 'T'));
                return (inicioAgendamento < fimSlot) && (fimAgendamento > inicioSlot);
            });

            const status = agendado ? "Ocupado" : "Livre";
            const statusClass = agendado ? "status-ocupado" : "status-livre";

            const linha = document.createElement("tr");
            linha.innerHTML = `
        <td>${horarioInicio} - ${horarioFim}</td>
        <td class="${statusClass}">${status}</td>
      `;
            corpoTabela.appendChild(linha);
        }
    }
}

// Buscar agendamentos de uma sala (Atualizado)
async function buscarAgendamentosDaSala(idSala) {
    try {
        // Adicionado headers de autenticação
        const response = await fetch(`${API_URL}/agendamentos/sala/${idSala}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Falha ao buscar agendamentos da sala');
        const agendamentos = await response.json();
        console.log("Agendamentos recebidos do backend:", agendamentos);
        renderizarTabelaHorarios(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos da sala:", error);
        if (error.status === 401 || error.status === 403) fazerLogout();
    }
};

// Buscar agendamentos do usuário (Atualizado)
async function buscarAgendamentosUsuario() {
    if (!usuarioLogado) return; // Garante que o usuário foi carregado
    try {
        // Adicionado headers de autenticação
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

// ... (renderizarAgendamentosUsuario não muda) ...
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

            // Converte as datas (corrigindo o formato com 'T')
            const dataInicio = new Date(agendamento.data_hora_inicio.replace(' ', 'T')).toLocaleString("pt-BR");
            const dataFimOriginal = new Date(agendamento.data_hora_fim.replace(' ', 'T'));
            const dataFimFormatada = dataFimOriginal.toLocaleString("pt-BR");

            let statusTexto = agendamento.status;
            let statusClass = "";
            let acaoBotao = ""; // Para o botão de cancelar

            if (agendamento.status === "cancelado") {
                statusTexto = "Cancelado";
                statusClass = "status-cancelado";
            } else if (agendamento.status === "confirmado") {
                // Verifica se a data final já passou
                if (dataFimOriginal < agora) {
                    statusTexto = "Realizado";
                    statusClass = "status-realizado";
                    // Nenhum botão de ação
                } else {
                    statusTexto = "Confirmado";
                    statusClass = "status-livre"; // (ou "status-confirmado" se preferir)
                    // Só pode cancelar se o agendamento ainda não aconteceu
                    acaoBotao = `<button class="btn-cancelar" data-id="${agendamento.id}">Cancelar</button>`;
                }
            }
            // =========================================================

            linha.innerHTML = `
        <td>${agendamento.nome_sala}</td>
        <td>${dataInicio}</td>
        <td>${dataFimFormatada}</td>
        <td class="${statusClass}">${statusTexto}</td>
        <td>
          ${acaoBotao}
        </td>
      `;
            corpoAgendamentos.appendChild(linha);
        });

        // Adicionar listener aos botões de cancelar
        document.querySelectorAll(".btn-cancelar").forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                cancelarAgendamento(id);
            });
        });
    }
}


// Criar agendamento (Atualizado)
async function criarAgendamento(dados) {
    try {
        // Adicionado headers de autenticação
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
            // Mostra erros de validação do backend
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

// Cancelar agendamento (Atualizado)
async function cancelarAgendamento(idAgendamento) {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
        try {
            // Adicionado headers de autenticação
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

// ========== FUNÇÕES AUXILIARES ==========

// ... (mostrarErro e mostrarMensagem não mudam) ...
function mostrarErro(mensagem) {
    const mensagemErro = document.getElementById("mensagemErro");
    if (mensagemErro) {
        mensagemErro.textContent = mensagem;
        mensagemErro.style.display = "block";
    }
};

function mostrarMensagem(mensagem, tipo) {
    // Tenta pegar a mensagem da reserva
    let msgElement = document.getElementById("mensagemReserva");
    
    // Se não estiver na página de reserva, tenta pegar a de horários
    if (!msgElement) {
        msgElement = document.getElementById("mensagemHorarios");
    }

    if (msgElement) {
        msgElement.textContent = mensagem;
        msgElement.className = `mensagem ${tipo}`;
        msgElement.style.display = "block";
        setTimeout(() => {
            msgElement.style.display = "none";
        }, 3000);
    }
};


// ========== EVENT LISTENERS ==========
// (Atualizado)
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
        
        // Verifica o login e pega os dados do usuário do token
        const user = verificarLogin();
        
        if (user) {
            dashboardElement.textContent = user.nome;

            // Busca os dados iniciais (agora com token)
            buscarSalas();
            buscarAgendamentosUsuario();

            const dataHorariosInput = document.getElementById("dataHorarios");
            const btnVerificarHorarios = document.getElementById("btnVerificarHorarios");

            if (dataHorariosInput) {
                dataHorariosInput.valueAsDate = new Date();
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
                        id_usuario: usuarioLogado.id, // Pega o ID do usuário logado (do token)
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