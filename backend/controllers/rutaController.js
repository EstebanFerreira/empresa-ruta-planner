const axios = require('axios');
const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');

function haversine(coord1, coord2) {
  const R = 6371000;
  const lat1 = coord1[1] * Math.PI / 180;
  const lat2 = coord2[1] * Math.PI / 180;
  const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const calcularRuta = async (req, res) => {
  try {
    const { start_coords, end_coords, vehicle_profile } = req.body;
    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'ORS_API_KEY no configurada en el servidor' });
    }

    const profile = vehicle_profile || 'driving-car';
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;

    const orsResponse = await axios.post(url, {
      coordinates: [
        [start_coords.lon, start_coords.lat],
        [end_coords.lon, end_coords.lat]
      ],
      extra_info: ['tollways']
    }, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const feature = orsResponse.data.features[0];
    const summary = feature.properties.summary;
    const distance_m = summary.distance;
    const duration_s = summary.duration;
    const geometry = feature.geometry;

    let toll_distance_m = 0;
    const extras = feature.properties.extras;
    if (extras && extras.tollways && extras.tollways.values) {
      const coords = geometry.coordinates;
      extras.tollways.values.forEach(([start, end, value]) => {
        if (value === 1) {
          for (let i = start; i < end && i + 1 < coords.length; i++) {
            toll_distance_m += haversine(coords[i], coords[i + 1]);
          }
        }
      });
    }

    res.json({ distance_m, duration_s, geometry, toll_distance_m });
  } catch (error) {
    const msg = error.response ? JSON.stringify(error.response.data) : error.message;
    res.status(500).json({ error: msg });
  }
};

const crearRuta = async (req, res) => {
  try {
    const {
      nombre, distancia, duracion_estimada, puntos_ruta,
      id_vehiculo, costo_combustible, costo_peajes,
      costo_personal, costo_mantenimiento, margen_ganancia,
      origen, destino, origen_coords, destino_coords
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
      tiempo_descanso_total,
      origen: origen || null,
      destino: destino || null,
      origen_coords: origen_coords || null,
      destino_coords: destino_coords || null
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
      costo_personal, costo_mantenimiento, margen_ganancia,
      origen, destino, origen_coords, destino_coords
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
      tiempo_descanso_total,
      origen: origen || null,
      destino: destino || null,
      origen_coords: origen_coords || null,
      destino_coords: destino_coords || null
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
  calcularRuta,
  crearRuta,
  obtenerRutas,
  obtenerRutaPorId,
  actualizarRuta,
  eliminarRuta
};
