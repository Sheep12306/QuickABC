const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Word = sequelize.define('Word', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
  word: { type: DataTypes.STRING(128), allowNull: false },
  phonetic: { type: DataTypes.STRING(128), defaultValue: '' },
  part: { type: DataTypes.STRING(16), defaultValue: '' },
  meaning: { type: DataTypes.STRING(512), defaultValue: '' },
}, {
  tableName: 'words',
  timestamps: false,
  indexes: [{ fields: ['book_id'] }],
});

module.exports = Word;
