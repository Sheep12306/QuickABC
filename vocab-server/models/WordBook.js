const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const WordBook = sequelize.define('WordBook', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(128), allowNull: false },
  description: { type: DataTypes.STRING(512), defaultValue: '' },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalWords: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_words' },
}, {
  tableName: 'word_books',
  timestamps: false,
});

module.exports = WordBook;
