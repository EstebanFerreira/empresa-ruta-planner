const express = require('express');
const router = express.Router();
const {
  crearRuta,
  obtenerRutas,
  obtenerRutaPorId,
  actualizarRuta,
  eliminarRuta
} = require('../controllers/rutaController');

router.post('/', crearRuta);
router.get('/', obtenerRutas);
router.get('/:id', obtenerRutaPorId);
router.put('/:id', actualizarRuta);
router.delete('/:id', eliminarRuta);

module.exports = router;
