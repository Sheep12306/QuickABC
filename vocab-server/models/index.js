const User = require('./User');
const WordBook = require('./WordBook');
const Word = require('./Word');
const UserBookProgress = require('./UserBookProgress');
const UserLearnedWords = require('./UserLearnedWords');
const UserLearnRecord = require('./UserLearnRecord');
const UserStudyData = require('./UserStudyData');
const VocabTestRecord = require('./VocabTestRecord');
const WrongWord = require('./WrongWord');
const WordStudyRecord = require('./WordStudyRecord');
const Question = require('./Question');

// User associations
User.hasMany(UserBookProgress, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(UserLearnedWords, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(UserLearnRecord, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(WordStudyRecord, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(VocabTestRecord, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(WrongWord, { foreignKey: 'user_id', sourceKey: 'id' });

UserBookProgress.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
UserLearnedWords.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
UserLearnRecord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
WordStudyRecord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
VocabTestRecord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
WrongWord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

// WordBook associations
WordBook.hasMany(Word, { foreignKey: 'book_id', sourceKey: 'id' });
Word.belongsTo(WordBook, { foreignKey: 'book_id', targetKey: 'id' });

WordBook.hasMany(UserBookProgress, { foreignKey: 'book_id', sourceKey: 'id' });
UserBookProgress.belongsTo(WordBook, { foreignKey: 'book_id', targetKey: 'id' });

module.exports = {
  User,
  WordBook,
  Word,
  UserBookProgress,
  UserLearnedWords,
  UserLearnRecord,
  UserStudyData,
  VocabTestRecord,
  WrongWord,
  WordStudyRecord,
  Question,
};
