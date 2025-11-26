const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- ROTAS ORIGINAIS ---

// Cadastro Motora
app.post('/motora', async (req, res) => {
  const { nome, telefone, senha, email, placa } = req.body;
  const query = `
    INSERT INTO motora 
    (id, nome, telefone, senha, latitude, longitude, status, placa, 
     total_corridas_dia, total_valor_dia, passageiro_id, corrida_id, created_at, email) 
    VALUES (DEFAULT, $1, $2, $3, NULL, NULL, $4, $5, 0, 0, NULL, NULL, NOW(), $6)
  `;
  try {
    await pool.query(query, [nome, telefone, senha, 'offline', placa, email]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cadastro Boneco
app.post('/boneco', async (req, res) => {
  const { nome, telefone, senha, email, placa } = req.body;
  const query = `
    INSERT INTO bonecos 
    (id, nome, telefone, senha, latitude, longitude, status, placa, 
     total_corridas_dia, total_valor_dia, corrida_id, created_at, email) 
    VALUES (DEFAULT, $1, $2, $3, NULL, NULL, $4, $5, 0, 0, NULL, NOW(), $6)
  `;
  try {
    await pool.query(query, [nome, telefone, senha, 'offline', placa, email]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTA COMPLETA PARA CORRIDAS ---
app.post('/corridas/nova', async (req, res) => {
  const { 
    passageiro_id, passageiro_nome,
    origem_lat, origem_lng, 
    destino_lat, destino_lng,
    valor, status
  } = req.body;

  // INSERT com TODOS os 13 campos na ordem correta
  const query = `
    INSERT INTO corridas 
    (id, passageiro_id, motorista_id, origem_lat, origem_lng, 
     destino_lat, destino_lng, status, valor, modo_pagamento, 
     motorista_nome, passageiro_nome, created_at) 
    VALUES (DEFAULT, $1, NULL, $2, $3, $4, $5, $6, $7, NULL, NULL, $8, NOW())
  `;

  try {
    await pool.query(query, [
      passageiro_id, 
      origem_lat, origem_lng,
      destino_lat, destino_lng, 
      status || 'solicitada',
      valor,
      passageiro_nome
    ]);
    
    console.log('✅ Corrida salva na tabela');
    res.json({ ok: true });
    
  } catch (err) {
    console.error('❌ Erro ao salvar corrida:', err.message);
    res.status(500).json({ error: err.message });
  }
});









// Login Motora
app.get('/motora', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM motora');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Bonecos
app.get('/bonecos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bonecos');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mapa Ativos
app.get('/ativos', async (req, res) => {
  try {
    const motora = await pool.query('SELECT * FROM motora WHERE status <> \'offline\'');
    const bonecos = await pool.query('SELECT * FROM bonecos WHERE status <> \'offline\'');
    res.json({ motora: motora.rows, bonecos: bonecos.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
