const API_URL = "https://api-agendamento-salas.onrender.com";

// Variáveis globais
let usuarioLogado = null;

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

// Logout (Atualizado)
function fazerLogout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
};

// Verificar se o usuário está logado e é admin (Atualizado)
function verificarLoginAdmin() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return null;
    }
    
    usuarioLogado = parseJwt(token);

    // Se o token for inválido, expirado OU o usuário não for admin
    if (!usuarioLogado || (usuarioLogado.exp * 1000) < Date.now() || usuarioLogado.tipo !== "admin") {
        localStorage.removeItem("token");
        window.location.href = "login.html"; // Redireciona para o login
        return null;
    }

    return usuarioLogado;
}

// ===============================================
// FUNÇÕES DA API (Atualizadas com Headers)
// ===============================================

// ========== FUNÇÕES DE SALAS (CRUD) ==========
async function buscarSalas() {
    try {
        const response = await fetch(`${API_URL}/salas`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Falha ao buscar salas');
        const salas = await response.json();
        // No admin.js, precisamos renderizar a TABELA, não os cards
        renderizarTabelaSalas(salas);
    } catch (error) {
        console.error("Erro ao buscar salas:", error);
        if (error.status === 401 || error.status === 403) fazerLogout();
    }
}

// Renderizar tabela de salas (Atualizado - Copiado do seu admin.js original)
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

// Criar ou Editar Sala (Atualizado)
async function salvarSala(dados) {
    const id = document.getElementById("formSala").getAttribute('data-editing-id');
    const method = id ? "PUT" : "POST";
    const endpoint = id ? `${API_URL}/salas/${id}` : `${API_URL}/salas`;

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: getAuthHeaders(),
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
            // Mostra erros de validação
            let msgErro = data.message || `Erro ao ${id ? 'editar' : 'criar'} sala`;
            if (data.errors) {
                msgErro = data.errors.map(e => e.msg).join(' ');
            }
            mostrarMensagem(msgErro, "erro");
        }
    } catch (error) {
        console.error(`Erro ao ${id ? 'editar' : 'criar'} sala:`, error);
        mostrarMensagem(`Erro ao ${id ? 'editar' : 'criar'} sala`, "erro");
    }
};

// Excluir sala (Atualizado)
async function excluirSala(idSala) {
    if (confirm("Tem certeza que deseja excluir esta sala?")) {
        try {
            const response = await fetch(`${API_URL}/salas/${idSala}`, {
                method: "DELETE",
                headers: getAuthHeaders()
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

// Buscar todos os agendamentos (Atualizado)
async function buscarAgendamentos() {
    try {
        const response = await fetch(`${API_URL}/agendamentos`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Falha ao buscar agendamentos');
        const agendamentos = await response.json();
        renderizarTabelaAgendamentos(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        if (error.status === 401 || error.status === 403) fazerLogout();
    }
};

// Renderizar tabela de agendamentos (Atualizado - Copiado do seu admin.js original)
function renderizarTabelaAgendamentos(agendamentos) {
    const corpoAgendamentos = document.getElementById("corpoAgendamentosAdmin");
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
                statusClass = "status-livre"; 
                // Admin pode cancelar agendamentos futuros
                acaoBotao = `<button class="btn-cancelar" data-id="${agendamento.id}">Cancelar</button>`;
            }
        }
        // =========================================================

        linha.innerHTML = `
            <td>${agendamento.id}</td>
            <td>${agendamento.nome_usuario}</td>
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
    document.querySelectorAll("#corpoAgendamentosAdmin .btn-cancelar").forEach(button => {
        button.addEventListener('click', (e) => cancelarAgendamento(e.target.getAttribute('data-id')));
    });
};

// Cancelar agendamento (Admin) (Atualizado)
async function cancelarAgendamento(idAgendamento) {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
        try {
            const response = await fetch(
                `${API_URL}/agendamentos/cancelar/${idAgendamento}`,
                {
                    method: "PUT",
                    headers: getAuthHeaders()
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
// (Copiado do seu admin.js original)
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
// (Atualizado)
document.addEventListener("DOMContentLoaded", () => {
    // Verifica login e obtém dados do usuário
    const user = verificarLoginAdmin();

    if (user) {
        const nomeUsuarioElement = document.getElementById("nomeUsuario");
        if (nomeUsuarioElement) {
            nomeUsuarioElement.textContent = user.nome;
        }

        // Busca dados iniciais (com token)
        buscarSalas();
        buscarAgendamentos();

        // Formulário de sala (Criar/Editar)
        const formSala = document.getElementById("formSala");
        if (formSala) {
            formSala.addEventListener("submit", (e) => {
                e.preventDefault();
                const nomeSala = document.getElementById("nomeSala").value;
                const capacidadeSala = document.getElementById("capacidadeSala").value;
                const descricaoSala = document.getElementById("descricaoSala").value;

                salvarSala({
                    nome_sala: nomeSala,
                    capacidade: parseInt(capacidadeSala),
                    descricao: descricaoSala,
                });
            });
        }

        // Logout
        const btnLogout = document.getElementById("btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", fazerLogout);
        }
    }
});