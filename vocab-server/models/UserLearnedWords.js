const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserLearnedWords = sequelize.define('UserLearnedWords', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
  groupNum: { type: DataTypes.INTEGER, allowNull: false, field: 'group_num' },
  wordIds: { type: DataTypes.JSON, field: 'word_ids' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
}, {
  tableName: 'user_learned_words',
  timestamps: true,
  createdAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'book_id', 'group_num'] }],
});

module.exports = UserLearnedWords;
