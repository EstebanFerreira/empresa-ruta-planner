const express = require('express');
const router = express.Router();
const {
  calcularRuta,
  crearRuta,
  obtenerRutas,
  obtenerRutaPorId,
  actualizarRuta,
  eliminarRuta
} = require('../controllers/rutaController');

router.post('/route', calcularRuta);
router.post('/', crearRuta);
router.get('/', obtenerRutas);
router.get('/:id', obtenerRutaPorId);
router.put('/:id', actualizarRuta);
router.delete('/:id', eliminarRuta);

module.exports = router;
