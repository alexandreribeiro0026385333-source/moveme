const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Cadastro Motora
app.post('/motora', async (req, res) => {
  const { nome, telefone, senha } = req.body;
  const query = 'INSERT INTO motora (nome, telefone, senha, status) VALUES ($1, $2, $3, $4)';
  try {
    await pool.query(query, [nome, telefone, senha, 'offline']);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cadastro Boneco
app.post('/boneco', async (req, res) => {
  const { nome, telefone, senha } = req.body;
  const query = 'INSERT INTO bonecos (nome, telefone, senha, status) VALUES ($1, $2, $3, $4)';
  try {
    await pool.query(query, [nome, telefone, senha, 'offline']);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar Motoras e Bonecos (para mapa)
app.get('/ativos', async (req, res) => {
  try {
    const motora = await pool.query('SELECT id, nome, latitude, longitude FROM motora WHERE status <> \'offline\'');
    const bonecos = await pool.query('SELECT id, nome, latitude, longitude FROM bonecos WHERE status <> \'offline\'');
    res.json({ motora: motora.rows, bonecos: bonecos.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server rodando'));
