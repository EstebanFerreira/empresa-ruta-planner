const { DataTypes } = require('sequelize');
const sequelize = require('../../database/sequelize');

const Ruta = sequelize.define('Ruta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  distancia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duracion_estimada: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  puntos_ruta: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  id_vehiculo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Vehiculos',
      key: 'id'
    }
  },
  costo_combustible: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  costo_peajes: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  costo_personal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  costo_mantenimiento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  costo_total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  pvp_recomendado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  margen_ganancia: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 20
  },
  tiempo_descanso_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  origen: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destino: {
    type: DataTypes.STRING,
    allowNull: true
  },
  origen_coords: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  destino_coords: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Ruta;
