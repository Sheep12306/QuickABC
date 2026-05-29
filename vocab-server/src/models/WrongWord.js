const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const WrongWord = sequelize.define('WrongWord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  wordData: { type: DataTypes.JSON, field: 'word_data' },
  isMastered: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_mastered' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
}, {
  tableName: 'wrong_words',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['user_id'] }],
});

module.exports = WrongWord;
