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

// NO SERVER.JS - Rota que falta  
app.put('/corridas/:id/status', async (req, res) => {
  try {
    await pool.query(
      'UPDATE corridas SET status = $1 WHERE id = $2',
      [req.body.status, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NO SERVER.JS - Adicionar esta rota:

// PUT atualizar motorista completo
app.put('/motora/:id', async (req, res) => {
  const { status, corrida_id, passageiro_id, total_corridas_dia, total_valor_dia, latitude, longitude } = req.body;
  
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }
  if (corrida_id !== undefined) {
    updates.push(`corrida_id = $${paramCount}`);
    values.push(corrida_id);
    paramCount++;
  }
  if (passageiro_id !== undefined) {
    updates.push(`passageiro_id = $${paramCount}`);
    values.push(passageiro_id);
    paramCount++;
  }
  if (total_corridas_dia !== undefined) {
    updates.push(`total_corridas_dia = $${paramCount}`);
    values.push(total_corridas_dia);
    paramCount++;
  }
  if (total_valor_dia !== undefined) {
    updates.push(`total_valor_dia = $${paramCount}`);
    values.push(total_valor_dia);
    paramCount++;
  }
  if (latitude !== undefined) {
    updates.push(`latitude = $${paramCount}`);
    values.push(latitude);
    paramCount++;
  }
  if (longitude !== undefined) {
    updates.push(`longitude = $${paramCount}`);
    values.push(longitude);
    paramCount++;
  }

  values.push(req.params.id);

  try {
    await pool.query(
      `UPDATE motora SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );
    res.json({ ok: true });
  } catch (err) {
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


// NO SERVER.JS - Adicionar estas rotas:

// GET todas as corridas
app.get('/corridas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM corridas ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET corridas por passageiro_id
app.get('/corridas/passageiro/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM corridas WHERE passageiro_id = $1 ORDER BY id DESC', 
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET corridas por motorista_id  
app.get('/corridas/motorista/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM corridas WHERE motorista_id = $1 ORDER BY id DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET corridas por status
app.get('/corridas/status/:status', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM corridas WHERE status = $1 ORDER BY id DESC',
      [req.params.status]
    );
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
