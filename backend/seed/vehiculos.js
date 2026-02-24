const Vehiculo = require('../models/Vehiculo');

const vehiculosEjemplo = [
  {
    nombre: "Camión de carga ligera",
    tipo: "Camión",
    capacidad_carga: 1000,
    consumo_combustible: 8.5,
    velocidad_promedio: 60,
    capacidad_tanque: 100,
    tiene_tacografo: true,
    tiempo_descanso_minutos: 45,
    hora_inicio_descanso: "04:30"
  },
  {
    nombre: "Vehículo utilitario",
    tipo: "Camioneta",
    capacidad_carga: 500,
    consumo_combustible: 12.0,
    velocidad_promedio: 70,
    capacidad_tanque: 60,
    tiene_tacografo: false,
    tiempo_descanso_minutos: 0,
    hora_inicio_descanso: "00:00"
  },
  {
    nombre: "Furgon de transporte",
    tipo: "Furgon",
    capacidad_carga: 800,
    consumo_combustible: 10.0,
    velocidad_promedio: 55,
    capacidad_tanque: 80,
    tiene_tacografo: true,
    tiempo_descanso_minutos: 30,
    hora_inicio_descanso: "04:00"
  }
];

async function seedVehiculos() {
  try {
    for (const vehiculo of vehiculosEjemplo) {
      await Vehiculo.findOrCreate({
        where: { nombre: vehiculo.nombre },
        defaults: vehiculo
      });
    }
    console.log('Datos de vehículos insertados correctamente');
  } catch (error) {
    console.error('Error al insertar datos de vehículos:', error);
  }
}

module.exports = { seedVehiculos };
