const { DataTypes } = require('sequelize');
const sequelize = require('../../database/sequelize');

const Vehiculo = sequelize.define('Vehiculo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacidad_carga: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  consumo_combustible: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  velocidad_promedio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  capacidad_tanque: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tiene_tacografo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tiempo_descanso_minutos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  hora_inicio_descanso: {
    type: DataTypes.STRING,
    defaultValue: '00:00'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Vehiculo;
