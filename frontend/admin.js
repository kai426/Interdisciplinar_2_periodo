const API_URL = "http://localhost:3000/api";

// Variáveis globais
let usuarioLogado = null;

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

// Logout
function fazerLogout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "index.html";
};

// Verificar se o usuário está logado e é admin
function verificarLoginAdmin() {
    const usuarioArmazenado = localStorage.getItem("usuarioLogado");
    if (!usuarioArmazenado) {
        window.location.href = "index.html";
        return null;
    }

    usuarioLogado = JSON.parse(usuarioArmazenado);
    if (usuarioLogado.tipo !== "admin") {
        window.location.href = "dashboard.html";
        return null;
    }

    return usuarioLogado;
}

// ========== FUNÇÕES DE SALAS (CRUD) ==========
// Buscar todas as salas
async function buscarSalas() {
    try {
        console.log('Buscando salas...');
        const response = await fetch(`${API_URL}/salas`);
        console.log('Resposta:', response);
        const salas = await response.json();
        console.log('Salas recebidas:', salas);
        renderizarListaSalas(salas);
        preencherSelectSalas(salas);
    } catch (error) {
        console.error("Erro ao buscar salas:", error);
    }
}

// Renderizar tabela de salas
function renderizarTabelaSalas(salas) {
    const corpoSalas = document.getElementById("corpoSalas");
    corpoSalas.innerHTML = "";

    salas.forEach((sala) => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${sala.id}</td>
            <td>${sala.nome_sala}</td>
            <td>${sala.capacidade}</td>
            <td>${sala.descricao || "-"}</td>
            <td>
                <button class="btn-editar" data-id="${sala.id}" data-nome="${sala.nome_sala}" data-capacidade="${sala.capacidade}" data-descricao="${sala.descricao || ''}">Editar</button>
                <button class="btn-excluir" data-id="${sala.id}">Excluir</button>
            </td>
        `;
        corpoSalas.appendChild(linha);
    });

    // Adicionar listeners aos botões de ação
    document.querySelectorAll("#corpoSalas .btn-editar").forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const nome = e.target.getAttribute('data-nome');
            const capacidade = e.target.getAttribute('data-capacidade');
            const descricao = e.target.getAttribute('data-descricao');

            // Simplesmente preenche o formulário para edição
            document.getElementById("formSala").setAttribute('data-editing-id', id);
            document.getElementById("nomeSala").value = nome;
            document.getElementById("capacidadeSala").value = capacidade;
            document.getElementById("descricaoSala").value = descricao;
            document.querySelector("#formSala button").textContent = 'Salvar Edição';
        });
    });

    document.querySelectorAll("#corpoSalas .btn-excluir").forEach(button => {
        button.addEventListener('click', (e) => excluirSala(e.target.getAttribute('data-id')));
    });
};

// Criar ou Editar Sala
async function salvarSala(dados) {
    const id = document.getElementById("formSala").getAttribute('data-editing-id');
    const method = id ? "PUT" : "POST";
    const endpoint = id ? `${API_URL}/salas/${id}` : `${API_URL}/salas`;

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dados),
        });

        const data = await response.json();

        if (response.ok) {
            mostrarMensagem(`Sala ${id ? 'editada' : 'criada'} com sucesso!`, "sucesso");
            document.getElementById("formSala").reset();
            document.getElementById("formSala").removeAttribute('data-editing-id');
            document.querySelector("#formSala button").textContent = 'Adicionar Sala';
            buscarSalas();
        } else {
            mostrarMensagem(data.message || `Erro ao ${id ? 'editar' : 'criar'} sala`, "erro");
        }
    } catch (error) {
        console.error(`Erro ao ${id ? 'editar' : 'criar'} sala:`, error);
        mostrarMensagem(`Erro ao ${id ? 'editar' : 'criar'} sala`, "erro");
    }
};

// Excluir sala
async function excluirSala(idSala) {
    if (confirm("Tem certeza que deseja excluir esta sala?")) {
        try {
            const response = await fetch(`${API_URL}/salas/${idSala}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensagem("Sala excluída com sucesso!", "sucesso");
                buscarSalas();
            } else {
                mostrarMensagem(data.message || "Erro ao excluir sala", "erro");
            }
        } catch (error) {
            console.error("Erro ao excluir sala:", error);
            mostrarMensagem("Erro ao conectar com o servidor", "erro");
        }
    }
};

// ========== FUNÇÕES DE AGENDAMENTOS (TODOS) ==========

// Buscar todos os agendamentos
async function buscarAgendamentos() {
    try {
        const response = await fetch(`${API_URL}/agendamentos`);
        const agendamentos = await response.json();
        renderizarTabelaAgendamentos(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
    }
};

// Renderizar tabela de agendamentos
function renderizarTabelaAgendamentos(agendamentos) {
    const corpoAgendamentos = document.getElementById("corpoAgendamentosAdmin");
    corpoAgendamentos.innerHTML = "";

    agendamentos.forEach((agendamento) => {
        const linha = document.createElement("tr");
        const statusClass = agendamento.status === "cancelado" ? "status-cancelado" : "status-livre";
        linha.innerHTML = `
            <td>${agendamento.id}</td>
            <td>${agendamento.nome_usuario}</td>
            <td>${agendamento.nome_sala}</td>
            <td>${new Date(agendamento.data_hora_inicio).toLocaleString("pt-BR")}</td>
            <td>${new Date(agendamento.data_hora_fim).toLocaleString("pt-BR")}</td>
            <td class="${statusClass}">${agendamento.status}</td>
            <td>
                ${agendamento.status === "confirmado" ? `<button class="btn-cancelar" data-id="${agendamento.id}">Cancelar</button>` : ""}
            </td>
        `;
        corpoAgendamentos.appendChild(linha);
    });

    // Adicionar listener aos botões de cancelar
    document.querySelectorAll("#corpoAgendamentosAdmin .btn-cancelar").forEach(button => {
        button.addEventListener('click', (e) => cancelarAgendamento(e.target.getAttribute('data-id')));
    });
};

// Cancelar agendamento (Admin)
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
                buscarAgendamentos();
            } else {
                mostrarMensagem(data.message || "Erro ao cancelar agendamento", "erro");
            }
        } catch (error) {
            console.error("Erro ao cancelar agendamento:", error);
            mostrarMensagem("Erro ao conectar com o servidor", "erro");
        }
    }
}

// ========== FUNÇÕES AUXILIARES ==========

// Mostrar mensagem (para CRUD de Salas e Agendamentos)
function mostrarMensagem(mensagem, tipo) {
    const mensagemSala = document.getElementById("mensagemSala");
    if (mensagemSala) {
        mensagemSala.textContent = mensagem;
        mensagemSala.className = `mensagem ${tipo}`;
        mensagemSala.style.display = "block";
        setTimeout(() => {
            mensagemSala.style.display = "none";
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

            // =========================================================
            // INÍCIO DA LÓGICA DE ATUALIZAÇÃO DA DATA
            // =========================================================
            
            const dataHorariosInput = document.getElementById("dataHorarios");
            if (dataHorariosInput) {
                // Define a data de hoje como padrão
                dataHorariosInput.valueAsDate = new Date();

                // Adiciona um listener para quando a data mudar
                dataHorariosInput.addEventListener('change', () => {
                    if (salaSelecionada) {
                        // Se uma sala já estiver selecionada,
                        // busca novamente os agendamentos para essa sala.
                        buscarAgendamentosDaSala(salaSelecionada.id);
                    }
                });
            }
            // =========================================================
            // FIM DA LÓGICA DE ATUALIZAÇÃO DA DATA
            // =========================================================


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