const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * @deprecated 此表数据已合并到 users 表中 (level, check_in_days, vocab_count 等字段)。
 * 保留模型以兼容历史数据查询。
 */
const UserStudyData = sequelize.define('UserStudyData', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(64), allowNull: false },
  checkInDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'check_in_days' },
  vocabCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'vocab_count' },
  level: { type: DataTypes.INTEGER, defaultValue: 1 },
  createTime: { type: DataTypes.DATE, field: 'create_time' },
  updateTime: { type: DataTypes.DATE, field: 'update_time' },
}, {
  tableName: 'user_study_data',
  timestamps: false,
});

module.exports = UserStudyData;
