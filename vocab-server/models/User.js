const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  nickname: { type: DataTypes.STRING(64), defaultValue: '' },
  avatar: { type: DataTypes.TEXT, defaultValue: '' },
  level: { type: DataTypes.INTEGER, defaultValue: 1 },
  checkInDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'check_in_days' },
  vocabCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'vocab_count' },
  grade: { type: DataTypes.STRING(32), defaultValue: '' },
  phone: { type: DataTypes.STRING(20), defaultValue: '' },
  school: { type: DataTypes.STRING(128), defaultValue: '' },
  lastVocabScore: { type: DataTypes.INTEGER, defaultValue: 0, field: 'last_vocab_score' },
  lastVocabTestTime: { type: DataTypes.STRING(32), defaultValue: '', field: 'last_vocab_test_time' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
