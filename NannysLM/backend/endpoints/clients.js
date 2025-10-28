const express = require('express');
const router = express.Router();
const { executeQuery } = require('../src/config/database');

const TABLE = 'clients';

function buildInsert(table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  return { sql: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, params: keys.map(k => data[k]) };
}

function buildUpdate(table, data, idField = 'id') {
  const keys = Object.keys(data);
  const set = keys.map(k => `${k} = ?`).join(', ');
  return { sql: `UPDATE ${table} SET ${set} WHERE ${idField} = ?`, params: keys.map(k => data[k]) };
}

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const q = `SELECT * FROM ${TABLE} LIMIT ?`;
    const result = await executeQuery(q, [limit]);
    const rows = result?.data ?? result?.rows ?? result ?? [];
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const q = `SELECT * FROM ${TABLE} WHERE id = ?`;
    const result = await executeQuery(q, [req.params.id]);
    const rows = result?.data ?? result?.rows ?? result ?? [];
    if (Array.isArray(rows) && rows.length) return res.json({ success: true, data: rows[0] });
    return res.status(404).json({ success: false, message: 'Not found' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    if (Object.keys(data).length === 0) return res.status(400).json({ success: false, message: 'No data provided' });
    const { sql, params } = buildInsert(TABLE, data);
    const result = await executeQuery(sql, params);
    const insertId = result?.data?.insertId ?? result?.insertId ?? null;
    return res.status(201).json({ success: true, insertId });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = req.body || {};
    if (Object.keys(data).length === 0) return res.status(400).json({ success: false, message: 'No data provided' });
    const { sql, params } = buildUpdate(TABLE, data, 'id');
    params.push(req.params.id);
    const result = await executeQuery(sql, params);
    const affectedRows = result?.data?.affectedRows ?? result?.affectedRows ?? 0;
    return res.json({ success: true, affectedRows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const q = `DELETE FROM ${TABLE} WHERE id = ?`;
    const result = await executeQuery(q, [req.params.id]);
    const affectedRows = result?.data?.affectedRows ?? result?.affectedRows ?? 0;
    return res.json({ success: true, affectedRows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
