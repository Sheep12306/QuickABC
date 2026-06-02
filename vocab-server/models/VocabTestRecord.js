const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const VocabTestRecord = sequelize.define('VocabTestRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  score: { type: DataTypes.INTEGER, allowNull: false },
  estimatedVocab: { type: DataTypes.INTEGER, defaultValue: 0, field: 'estimated_vocab' },
  bookResults: { type: DataTypes.TEXT, field: 'book_results' },
  testTime: { type: DataTypes.STRING(32), allowNull: false, field: 'test_time' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
}, {
  tableName: 'vocab_test_records',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['user_id'] }],
});

module.exports = VocabTestRecord;
