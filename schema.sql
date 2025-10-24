CREATE DATABASE agendamento_sala;

USE agendamento_sala;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, 
    tipo ENUM('aluno', 'admin') DEFAULT 'aluno'
);

CREATE TABLE salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_sala VARCHAR(255) NOT NULL,
    capacidade INT NOT NULL,
    descricao TEXT
);

CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_sala INT NOT NULL,
    data_hora_inicio DATETIME NOT NULL,
    data_hora_fim DATETIME NOT NULL,
    status ENUM('confirmado', 'cancelado') DEFAULT 'confirmado',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (id_sala) REFERENCES salas(id)
);