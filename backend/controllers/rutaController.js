const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');

const crearRuta = async (req, res) => {
  try {
    const {
      nombre, distancia, duracion_estimada, puntos_ruta,
      id_vehiculo, costo_combustible, costo_peajes,
      costo_personal, costo_mantenimiento, margen_ganancia
    } = req.body;

    let vehiculoInfo = null;
    if (id_vehiculo) {
      vehiculoInfo = await Vehiculo.findByPk(id_vehiculo);
    }

    let tiempo_descanso_total = 0;
    if (vehiculoInfo && vehiculoInfo.tiene_tacografo) {
      const horas_conduccion = duracion_estimada / 60;
      const descansos_necesarios = Math.floor(horas_conduccion / 4.5);
      tiempo_descanso_total = descansos_necesarios * vehiculoInfo.tiempo_descanso_minutos;
    }

    const costo_total = parseFloat(costo_combustible) +
                       parseFloat(costo_peajes) +
                       parseFloat(costo_personal) +
                       parseFloat(costo_mantenimiento);

    const pvp_recomendado = costo_total * (1 + (margen_ganancia / 100));

    const nuevaRuta = await Ruta.create({
      nombre,
      distancia,
      duracion_estimada,
      puntos_ruta,
      id_vehiculo,
      costo_combustible,
      costo_peajes,
      costo_personal,
      costo_mantenimiento,
      costo_total,
      pvp_recomendado,
      margen_ganancia,
      tiempo_descanso_total
    });

    res.status(201).json(nuevaRuta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerRutas = async (req, res) => {
  try {
    const rutas = await Ruta.findAll({
      include: [{ model: Vehiculo, as: 'vehiculo' }]
    });
    res.json(rutas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerRutaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const ruta = await Ruta.findByPk(id, {
      include: [{ model: Vehiculo, as: 'vehiculo' }]
    });
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    res.json(ruta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, distancia, duracion_estimada, puntos_ruta,
      id_vehiculo, costo_combustible, costo_peajes,
      costo_personal, costo_mantenimiento, margen_ganancia
    } = req.body;

    let vehiculoInfo = null;
    if (id_vehiculo) {
      vehiculoInfo = await Vehiculo.findByPk(id_vehiculo);
    }

    let tiempo_descanso_total = 0;
    if (vehiculoInfo && vehiculoInfo.tiene_tacografo) {
      const horas_conduccion = duracion_estimada / 60;
      const descansos_necesarios = Math.floor(horas_conduccion / 4.5);
      tiempo_descanso_total = descansos_necesarios * vehiculoInfo.tiempo_descanso_minutos;
    }

    const costo_total = parseFloat(costo_combustible) +
                       parseFloat(costo_peajes) +
                       parseFloat(costo_personal) +
                       parseFloat(costo_mantenimiento);

    const pvp_recomendado = costo_total * (1 + (margen_ganancia / 100));

    await Ruta.update({
      nombre,
      distancia,
      duracion_estimada,
      puntos_ruta,
      id_vehiculo,
      costo_combustible,
      costo_peajes,
      costo_personal,
      costo_mantenimiento,
      costo_total,
      pvp_recomendado,
      margen_ganancia,
      tiempo_descanso_total
    }, { where: { id } });

    res.json({ message: 'Ruta actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    await Ruta.destroy({ where: { id } });
    res.json({ message: 'Ruta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearRuta,
  obtenerRutas,
  obtenerRutaPorId,
  actualizarRuta,
  eliminarRuta
};
