const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const WordStudyRecord = sequelize.define('WordStudyRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
  wordId: { type: DataTypes.INTEGER, allowNull: false, field: 'word_id' },
  groupNum: { type: DataTypes.INTEGER, defaultValue: 0, field: 'group_num' },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  studyTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'study_time' },
}, {
  tableName: 'word_study_records',
  timestamps: false,
  indexes: [{ fields: ['user_id', 'book_id', 'word_id'] }],
});

module.exports = WordStudyRecord;
