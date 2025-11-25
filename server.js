const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve todos os arquivos da raiz (HTML, CSS, JS)
app.use(express.static(__dirname));

// Conexão com Neon usando variáveis de ambiente
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// --- ROTAS DE API ---

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

// Start do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
