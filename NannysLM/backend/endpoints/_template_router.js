// Template (not exported): use it as reference
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../src/config/database');

// Helper to build insert and update queries dynamically
function buildInsert(table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const params = keys.map(k => data[k]);
  return { sql, params };
}

function buildUpdate(table, data, idField = 'id') {
  const keys = Object.keys(data);
  const set = keys.map(k => `${k} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${set} WHERE ${idField} = ?`;
  const params = keys.map(k => data[k]);
  return { sql, params };
}

module.exports = router;
