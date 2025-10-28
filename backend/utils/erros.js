/**
 * Erro para quando um recurso (como uma sala) não está disponível
 * para agendamento no horário solicitado.
 */
class ErroDisponibilidade extends Error {
    constructor(message) {
        super(message);
        this.name = "ErroDisponibilidade";
        this.statusCode = 409; // 409 Conflict (conflito de agendamento)
    }
}

/**
 * Erro para quando os dados de entrada são inválidos 
 * (ex: data de fim antes da data de início).
 */
class ErroValidacao extends Error {
    constructor(message) {
        super(message);
        this.name = "ErroValidacao";
        this.statusCode = 400; // 400 Bad Request
    }
}

module.exports = {
    ErroDisponibilidade,
    ErroValidacao
};