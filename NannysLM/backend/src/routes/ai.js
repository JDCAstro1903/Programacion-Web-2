const express = require('express');
const router = express.Router();
const { getNannyTips } = require('../controllers/AiTipsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/v1/ai/nanny-tips
 * @desc    Obtener consejos de IA para nannys
 * @access  Private (Nannys)
 */
router.get('/nanny-tips', authenticateToken, getNannyTips);

module.exports = router;
