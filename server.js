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

// Conexão com Neon usando DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- ROTAS DE API EXISTENTES ---

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

app.get('/ativos', async (req, res) => {
  try {
    const motora = await pool.query('SELECT id, nome, latitude, longitude FROM motora WHERE status <> \'offline\'');
    const bonecos = await pool.query('SELECT id, nome, latitude, longitude FROM bonecos WHERE status <> \'offline\'');
    res.json({ motora: motora.rows, bonecos: bonecos.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOVAS ROTAS PARA MOTORA.HTML ---

// Listar corridas do motorista
app.get('/corridas/motora', async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.passageiro_id, p.nome AS passageiro_nome,
             c.origem_lat, c.origem_lng, c.destino_lat, c.destino_lng,
             c.status, c.valor
      FROM corridas c
      LEFT JOIN bonecos p ON c.passageiro_id = p.id
      WHERE c.motorista_id IS NOT NULL
      ORDER BY c.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar corrida como paga
app.post('/corridas/pago/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE corridas SET status=$1 WHERE id=$2', ['pago', id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Terminar corrida
app.post('/corridas/terminar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE corridas SET status=$1 WHERE id=$2', ['concluida', id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
