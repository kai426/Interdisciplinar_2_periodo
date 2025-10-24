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
            window.location.href = "dashboard.html";
        } else {
            mostrarErro(data.message || "Erro ao fazer login");
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        mostrarErro("Erro ao conectar com o servidor");
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
}

// ========== EVENT LISTENERS ==========

// Login
document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    fazerLogin(email, senha);
});