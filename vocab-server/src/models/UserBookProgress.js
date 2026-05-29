const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserBookProgress = sequelize.define('UserBookProgress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
  todayLearned: { type: DataTypes.INTEGER, defaultValue: 0, field: 'today_learned' },
  totalLearned: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_learned' },
  accuracy: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  newWordsCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'new_words_count' },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'review_count' },
}, {
  tableName: 'user_book_progress',
  timestamps: false,
  indexes: [{ unique: true, fields: ['user_id', 'book_id'] }],
});

module.exports = UserBookProgress;
