/**
 * Script para recalcular rating_average y total_ratings de todas las nannys
 * Uso: node recalculate-ratings.js
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'nannyslm_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function executeQuery(query, params = []) {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    connection.release();
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function recalculateRatings() {
  try {
    console.log('\n⭐ Iniciando recalculación de ratings...\n');

    // Obtener todas las nannys que tienen ratings
    const query = `
      SELECT 
        nanny_id,
        AVG(rating) as avg_rating,
        COUNT(*) as total_ratings
      FROM ratings
      GROUP BY nanny_id
    `;

    const result = await executeQuery(query, []);

    if (!result.success) {
      console.error('❌ Error al obtener datos:', result.error);
      process.exit(1);
    }

    // Actualizar cada nanny
    let updated = 0;
    for (const row of result.data) {
      const updateQuery = `
        UPDATE nannys 
        SET rating_average = ?, total_ratings = ?
        WHERE id = ?
      `;
      const updateResult = await executeQuery(updateQuery, [
        parseFloat(row.avg_rating).toFixed(2),
        row.total_ratings,
        row.nanny_id
      ]);
      
      if (updateResult.success) {
        updated++;
        console.log(`✅ Nanny ID ${row.nanny_id}: ${parseFloat(row.avg_rating).toFixed(2)} promedio, ${row.total_ratings} ratings`);
      } else {
        console.error(`❌ Error actualizando nanny ${row.nanny_id}:`, updateResult.error);
      }
    }

    console.log(`\n✅ Recalculación completada: ${updated} nannys actualizadas\n`);
    pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    pool.end();
    process.exit(1);
  }
}

recalculateRatings();
