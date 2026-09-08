const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const CommuteRecord = sequelize.define('CommuteRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  date: { type: DataTypes.STRING(10), allowNull: false },
  wordCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'word_count' },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
}, {
  tableName: 'commute_records',
  timestamps: true,
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'date'] }],
});

module.exports = CommuteRecord;
