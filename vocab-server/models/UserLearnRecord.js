const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserLearnRecord = sequelize.define('UserLearnRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
  learnRecord: { type: DataTypes.JSON, field: 'learn_record' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
}, {
  tableName: 'user_learn_records',
  timestamps: true,
  indexes: [{ unique: true, fields: ['user_id', 'book_id'] }],
});

module.exports = UserLearnRecord;
