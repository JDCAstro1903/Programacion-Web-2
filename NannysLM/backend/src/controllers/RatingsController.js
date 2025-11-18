const pool = require('../config/database');

/**
 * Obtener todas las calificaciones de una nanny
 */
const getRatingsByNanny = async (req, res) => {
  try {
    const { nannyId } = req.query;

    if (!nannyId) {
      return res.status(400).json({
        success: false,
        message: 'nannyId es requerido'
      });
    }

    console.log(`⭐ Obteniendo ratings para nanny ${nannyId}`);

    const [ratings] = await pool.query(
      `SELECT 
        r.id,
        r.service_id,
        r.client_id,
        r.nanny_id,
        r.rating,
        r.review,
        r.punctuality_rating,
        r.communication_rating,
        r.care_quality_rating,
        r.would_recommend,
        r.created_at,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        s.title as service_title,
        s.start_date,
        s.end_date
      FROM ratings r
      JOIN clients c ON r.client_id = c.user_id
      JOIN services s ON r.service_id = s.id
      WHERE r.nanny_id = ?
      ORDER BY r.created_at DESC`,
      [nannyId]
    );

    console.log(`✅ Se obtuvieron ${ratings.length} ratings para nanny ${nannyId}`);

    return res.status(200).json({
      success: true,
      message: 'Calificaciones obtenidas correctamente',
      data: ratings,
      count: ratings.length
    });

  } catch (error) {
    console.error('❌ Error al obtener ratings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener una calificación específica
 */
const getRatingById = async (req, res) => {
  try {
    const { ratingId } = req.params;

    console.log(`⭐ Obteniendo rating ${ratingId}`);

    const [ratings] = await pool.query(
      `SELECT 
        r.id,
        r.service_id,
        r.client_id,
        r.nanny_id,
        r.rating,
        r.review,
        r.punctuality_rating,
        r.communication_rating,
        r.care_quality_rating,
        r.would_recommend,
        r.created_at,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        s.title as service_title
      FROM ratings r
      JOIN clients c ON r.client_id = c.user_id
      JOIN services s ON r.service_id = s.id
      WHERE r.id = ?`,
      [ratingId]
    );

    if (ratings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    console.log(`✅ Rating ${ratingId} obtenido correctamente`);

    return res.status(200).json({
      success: true,
      message: 'Calificación obtenida correctamente',
      data: ratings[0]
    });

  } catch (error) {
    console.error('❌ Error al obtener rating:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Crear una nueva calificación
 */
const createRating = async (req, res) => {
  try {
    const {
      service_id,
      client_id,
      nanny_id,
      rating,
      review,
      punctuality_rating,
      communication_rating,
      care_quality_rating,
      would_recommend
    } = req.body;

    // Validar datos requeridos
    if (!service_id || !client_id || !nanny_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // Validar rango de rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'El rating debe estar entre 1 y 5'
      });
    }

    console.log(`⭐ Creando nueva rating para servicio ${service_id}`);

    // Insertar la calificación
    const [result] = await pool.query(
      `INSERT INTO ratings 
      (service_id, client_id, nanny_id, rating, review, punctuality_rating, communication_rating, care_quality_rating, would_recommend)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        service_id,
        client_id,
        nanny_id,
        rating,
        review || null,
        punctuality_rating || null,
        communication_rating || null,
        care_quality_rating || null,
        would_recommend !== undefined ? would_recommend : 1
      ]
    );

    // Actualizar el promedio de rating de la nanny
    const [nannyRatings] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
       FROM ratings
       WHERE nanny_id = ?`,
      [nanny_id]
    );

    if (nannyRatings.length > 0) {
      await pool.query(
        `UPDATE nannys SET rating_average = ?, total_ratings = ? WHERE id = ?`,
        [nannyRatings[0].avg_rating, nannyRatings[0].total_ratings, nanny_id]
      );
    }

    console.log(`✅ Rating creada correctamente con ID ${result.insertId}`);

    return res.status(201).json({
      success: true,
      message: 'Calificación creada correctamente',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('❌ Error al crear rating:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getRatingsByNanny,
  getRatingById,
  createRating
};
