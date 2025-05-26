const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  timestamps: true,
  tableName: 'templates'
});

module.exports = Template;
