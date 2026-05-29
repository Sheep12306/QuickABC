const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Question = sequelize.define('Question', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  scope: { type: DataTypes.INTEGER, allowNull: false },
  question: { type: DataTypes.TEXT },
  options: { type: DataTypes.JSON },
  answer: { type: DataTypes.STRING(512) },
}, {
  tableName: 'questions',
  timestamps: false,
  indexes: [{ fields: ['scope'] }],
});

module.exports = Question;
