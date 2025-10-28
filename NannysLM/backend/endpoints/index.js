const express = require('express');
const router = express.Router();

// Routers de prueba (estas rutas son temporales y pueden eliminarse)
router.use('/users', require('./users'));
router.use('/clients', require('./clients'));
router.use('/nannys', require('./nannys'));
router.use('/services', require('./services'));
router.use('/ratings', require('./ratings'));
router.use('/payments', require('./payments'));
router.use('/bankDetails', require('./bankDetails'));
router.use('/notifications', require('./notifications'));
router.use('/clientFavorites', require('./clientFavorites'));

// Ruta raíz que devuelve las subrutas disponibles (útil para pruebas)
router.get('/', (req, res) => {
	const base = (req.baseUrl || '/api/v1/test').replace(/\/$/, '');
	const routes = [
		`${base}/users`,
		`${base}/clients`,
		`${base}/nannys`,
		`${base}/services`,
		`${base}/ratings`,
		`${base}/payments`,
		`${base}/bankDetails`,
		`${base}/notifications`,
		`${base}/clientFavorites`
	];
	res.json({ success: true, message: 'Rutas de prueba disponibles', routes });
});

module.exports = router;
