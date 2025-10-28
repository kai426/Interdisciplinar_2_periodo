const { body, validationResult } = require('express-validator');

// Função para lidar com os erros de validação
const tratarErrosValidacao = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    next();
};

// Validação para a criação/edição de salas
const validarSala = [
    body('nome_sala')
        .notEmpty().withMessage('O nome da sala é obrigatório.')
        .isString().withMessage('O nome da sala deve ser um texto.'),
    body('capacidade')
        .notEmpty().withMessage('A capacidade é obrigatória.')
        .isInt({ min: 1 }).withMessage('A capacidade deve ser um número inteiro positivo.'),
    body('descricao')
        .optional({ checkFalsy: true })
        .isString().withMessage('A descrição deve ser um texto.'),
    tratarErrosValidacao
];

// Validação para a criação de agendamentos
const validarAgendamento = [
    body('id_usuario')
        .notEmpty().withMessage('O ID do usuário é obrigatório.')
        .isInt().withMessage('O ID do usuário deve ser um número.'),
    body('id_sala')
        .notEmpty().withMessage('O ID da sala é obrigatório.')
        .isInt().withMessage('O ID da sala deve ser um número.'),
    body('data_hora_inicio')
        .notEmpty().withMessage('A data de início é obrigatória.')
        .isISO8601().withMessage('A data de início deve estar no formato ISO8601 (datetime-local).'),
    body('data_hora_fim')
        .notEmpty().withMessage('A data de fim é obrigatória.')
        .isISO8601().withMessage('A data de fim deve estar no formato ISO8601 (datetime-local).'),
    tratarErrosValidacao
];

module.exports = { validarSala, validarAgendamento };