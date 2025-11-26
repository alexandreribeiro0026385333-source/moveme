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

// --- ROTAS DE CADASTRO ---
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

// --- ROTAS DE LOGIN ---
app.get('/motora', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM motora');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bonecos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bonecos');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE MAPA ---
app.get('/ativos', async (req, res) => {
  try {
    const motora = await pool.query('SELECT * FROM motora WHERE status <> \'offline\'');
    const bonecos = await pool.query('SELECT * FROM bonecos WHERE status <> \'offline\'');
    res.json({ motora: motora.rows, bonecos: bonecos.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE CORRIDAS (SISTEMA NOVO) ---

// Passageiro cria nova corrida
app.post('/corridas/nova', async (req, res) => {
  const { passageiro_id, passageiro_nome, origem_lat, origem_lng, destino_lat, destino_lng, valor, modo_pagamento } = req.body;
  const query = `
    INSERT INTO corridas 
    (passageiro_id, passageiro_nome, origem_lat, origem_lng, destino_lat, destino_lng, valor, modo_pagamento, status) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'disponivel')
  `;
  try {
    await pool.query(query, [passageiro_id, passageiro_nome, origem_lat, origem_lng, destino_lat, destino_lng, valor, modo_pagamento]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar corridas disponíveis para motoristas
app.get('/corridas/disponiveis', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM corridas WHERE status = 'disponivel'`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Motorista aceita corrida
app.post('/corridas/aceitar/:id', async (req, res) => {
  const { id } = req.params;
  const { motorista_id, motorista_nome } = req.body;
  try {
    await pool.query('UPDATE corridas SET motorista_id=$1, motorista_nome=$2, status=$3 WHERE id=$4', 
      [motorista_id, motorista_nome, 'andamento', id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar corridas do passageiro
app.get('/corridas/passageiro/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM corridas WHERE passageiro_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS LEGADAS (mantenha para compatibilidade) ---
app.get('/corridas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM corridas');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/corridas/pago/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE corridas SET status=$1 WHERE id=$2', ['pago', id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/corridas/terminar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE corridas SET status=$1 WHERE id=$2', ['concluida', id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
