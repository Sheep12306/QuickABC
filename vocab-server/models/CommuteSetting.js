const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const CommuteSetting = sequelize.define('CommuteSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  mode: { type: DataTypes.STRING(16), defaultValue: 'normal' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
}, {
  tableName: 'commute_settings',
  timestamps: true,
  indexes: [{ unique: true, fields: ['user_id'] }],
});

module.exports = CommuteSetting;
