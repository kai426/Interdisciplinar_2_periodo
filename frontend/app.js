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
};

// Selecionar sala
async function selecionarSala(sala, cardElement) {
    salaSelecionada = sala;
    document.querySelectorAll(".sala-card").forEach((card) => {
        card.classList.remove("selecionada");
    });
    cardElement.classList.add("selecionada");

    await buscarAgendamentosDaSala(sala.id);
};

// ========== FUNÇÕES DE AGENDAMENTOS ==========

// Renderizar tabela de horários
function renderizarTabelaHorarios(agendamentos) {
    const tabelaHorarios = document.getElementById("tabelaHorarios");
    const corpoTabela = document.getElementById("corpoTabelaHorarios");
    const nenhumaSelecao = document.getElementById("nenhumaSelecao");
    const salaInfo = document.getElementById("salaInfo");
    const nomeSala = document.getElementById("nomeSalaSelecionada");
    
    // 1. Pega o input da data
    const dataSelecionadaInput = document.getElementById("dataHorarios");

    if (salaSelecionada) {
        salaInfo.style.display = "block";
        nomeSala.textContent = salaSelecionada.nome_sala;
        tabelaHorarios.style.display = "table";
        nenhumaSelecao.style.display = "none";

        corpoTabela.innerHTML = "";

        // 2. Pega a data que o USUÁRIO SELECIONOU no calendário
        // (Ex: "2025-10-29T00:00:00")
        const dataSelecionada = new Date(dataSelecionadaInput.value + 'T00:00:00');

        // Gerar horários de exemplo (8h às 18h)
        for (let hora = 8; hora < 18; hora++) {
            const horarioInicio = `${hora.toString().padStart(2, "0")}:00`;
            const horarioFim = `${(hora + 1).toString().padStart(2, "0")}:00`;

            // 3. Cria os slots de início e fim baseados na DATA SELECIONADA
            // (Esta é a parte crucial da correção)
            const inicioSlot = new Date(dataSelecionada);
            inicioSlot.setHours(hora, 0, 0, 0); // Ex: 29/10 @ 12:00

            const fimSlot = new Date(dataSelecionada);
            fimSlot.setHours(hora + 1, 0, 0, 0); // Ex: 29/10 @ 13:00

            // 4. Verifica se algum agendamento (de qualquer dia)
            //    se sobrepõe ao slot DESTE dia
            const agendado = agendamentos.some((agendamento) => {
                
                // Converte as datas do agendamento para HORA LOCAL
                const inicioAgendamento = new Date(agendamento.data_hora_inicio.replace(' ', 'T'));
                const fimAgendamento = new Date(agendamento.data_hora_fim.replace(' ', 'T'));

                // Lógica de sobreposição correta:
                // O agendamento começa ANTES do FIM do slot E
                // O agendamento termina DEPOIS do INÍCIO do slot
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

// Buscar agendamentos de uma sala
async function buscarAgendamentosDaSala(idSala) {
    try {
        const response = await fetch(`${API_URL}/agendamentos/sala/${idSala}`);
        const agendamentos = await response.json();
        console.log("Agendamentos recebidos do backend:", agendamentos);
        renderizarTabelaHorarios(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos da sala:", error);
    }
};

// Buscar agendamentos do usuário
async function buscarAgendamentosUsuario() {
    try {
        const response = await fetch(
            `${API_URL}/agendamentos/usuario/${usuarioLogado.id}`
        );
        const agendamentos = await response.json();
        renderizarAgendamentosUsuario(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos do usuário:", error);
    }
};

// Renderizar agendamentos do usuário
function renderizarAgendamentosUsuario(agendamentos) {
    const corpoAgendamentos = document.getElementById("corpoAgendamentos");
    const nenhumAgendamento = document.getElementById("nenhumAgendamento");

    if (agendamentos.length === 0) {
        nenhumAgendamento.style.display = "block";
        corpoAgendamentos.innerHTML = "";
    } else {
        nenhumAgendamento.style.display = "none";
        corpoAgendamentos.innerHTML = "";

        agendamentos.forEach((agendamento) => {
            const linha = document.createElement("tr");
            const statusClass =
                agendamento.status === "cancelado"
                    ? "status-cancelado"
                    : "status-livre";
            linha.innerHTML = `
        <td>${agendamento.id_sala}</td>
        <td>${new Date(agendamento.data_hora_inicio).toLocaleString("pt-BR")}</td>
        <td>${new Date(agendamento.data_hora_fim).toLocaleString("pt-BR")}</td>
        <td class="${statusClass}">${agendamento.status}</td>
        <td>
          ${agendamento.status === "confirmado"
                    ? `<button class="btn-cancelar" data-id="${agendamento.id}">Cancelar</button>`
                    : ""
                }
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

// Criar agendamento
async function criarAgendamento(dados) {
    try {
        const response = await fetch(`${API_URL}/agendamentos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dados),
        });

        const data = await response.json();

        if (response.ok) {
            mostrarMensagem("Agendamento criado com sucesso!", "sucesso");
            document.getElementById("formReserva").reset();
            
            // ATUALIZA A LISTA "MEUS AGENDAMENTOS"
            buscarAgendamentosUsuario(); 
            
            // =========================================================
            // INÍCIO DA CORREÇÃO
            // =========================================================
            
            // Pega o ID da sala que foi usada no formulário
            const idSalaAgendada = dados.id_sala; 

            // Verifica se a sala agendada é a mesma que está
            // sendo exibida na tabela de horários
            if (salaSelecionada && salaSelecionada.id === idSalaAgendada) {
                // Se for, atualiza a tabela
                buscarAgendamentosDaSala(idSalaAgendada);
            }
            // =========================================================
            // FIM DA CORREÇÃO
            // =========================================================

        } else {
            mostrarMensagem(data.message || "Erro ao criar agendamento", "erro");
        }
    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        mostrarMensagem("Erro ao conectar com o servidor", "erro");
    }
};

// Cancelar agendamento
async function cancelarAgendamento(idAgendamento) {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
        try {
            const response = await fetch(
                `${API_URL}/agendamentos/cancelar/${idAgendamento}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
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

// Mostrar erro
function mostrarErro(mensagem) {
    const mensagemErro = document.getElementById("mensagemErro");
    if (mensagemErro) {
        mensagemErro.textContent = mensagem;
        mensagemErro.style.display = "block";
    }
};

function mostrarMensagem(mensagem, tipo) {
    const mensagemReserva = document.getElementById("mensagemReserva");
    if (mensagemReserva) {
        mensagemReserva.textContent = mensagem;
        mensagemReserva.className = `mensagem ${tipo}`;
        mensagemReserva.style.display = "block";
        setTimeout(() => {
            mensagemReserva.style.display = "none";
        }, 3000);
    }
};

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

            // Pega o input de data e o novo botão
            const dataHorariosInput = document.getElementById("dataHorarios");
            const btnVerificarHorarios = document.getElementById("btnVerificarHorarios");

            // Define a data de hoje como padrão
            if (dataHorariosInput) {
                dataHorariosInput.valueAsDate = new Date();
            }

            // =========================================================
            // LÓGICA DO BOTÃO "VERIFICAR HORÁRIOS"
            // =========================================================
            if (btnVerificarHorarios) {
                btnVerificarHorarios.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Mostra erro se nenhuma sala foi selecionada
                    if (!salaSelecionada) {
                        const msgHorarios = document.getElementById("mensagemHorarios");
                        msgHorarios.textContent = "Por favor, selecione uma sala primeiro.";
                        msgHorarios.className = "mensagem erro";
                        msgHorarios.style.display = "block";
                        setTimeout(() => { msgHorarios.style.display = "none"; }, 3000);
                        return;
                    }

                    // Se uma sala estiver selecionada, busca os agendamentos
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