// URL da API
const API_URL = "http://localhost:3000/api";

// Pega o formulário e a mensagem de erro
const registroForm = document.getElementById("registroForm");
const mensagemErro = document.getElementById("mensagemErro");

// Adiciona o listener de 'submit'
registroForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Impede o envio tradicional do formulário

    // Pega os valores dos campos
    const primeiro_nome = document.getElementById("primeiro_nome").value;
    const ultimo_nome = document.getElementById("ultimo_nome").value;
    const nascimento = document.getElementById("nascimento").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const confirm_password = document.getElementById("confirm_password").value;
    
    // Pega o gênero selecionado
    const generoInput = document.querySelector('input[name="genero"]:checked');
    const genero = generoInput ? generoInput.value : null;

    // 1. Validação do Frontend
    if (senha !== confirm_password) {
        mostrarErro("As senhas não coincidem.");
        return;
    }

    // 2. Monta o objeto para enviar
    const dadosUsuario = {
        primeiro_nome,
        ultimo_nome,
        nascimento: nascimento || null, // Envia nulo se estiver vazio
        genero,
        email,
        senha
        // O 'tipo' (admin/aluno) será 'aluno' por padrão no backend
    };

    // 3. Envia para a API de registro
    try {
        const response = await fetch(`${API_URL}/usuarios/registrar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dadosUsuario),
        });

        const data = await response.json();

        if (response.ok) {
            // Sucesso!
            mostrarErro("Registro bem-sucedido! Redirecionando...", "sucesso");
            
            // Salva o token recebido
            localStorage.setItem("token", data.token);
            
            // Redireciona para o dashboard em 2 segundos
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 2000);

        } else {
            // Erro vindo do backend (ex: email duplicado)
            mostrarErro(data.message || "Erro ao registrar.");
        }
    } catch (error) {
        console.error("Erro ao registrar:", error);
        mostrarErro("Erro de conexão com o servidor.");
    }
});

// Função auxiliar para mostrar mensagens
function mostrarErro(mensagem, tipo = "erro") {
    if (mensagemErro) {
        mensagemErro.textContent = mensagem;
        mensagemErro.style.display = "block";
        
        // Adiciona classe de sucesso se for o caso
        if (tipo === "sucesso") {
            mensagemErro.style.color = "#2e7d32"; // Verde
            mensagemErro.style.backgroundColor = "#c8e6c9";
        } else {
            mensagemErro.style.color = "#d32f2f"; // Vermelho
            mensagemErro.style.backgroundColor = "#ffcdd2";
        }
    }
}