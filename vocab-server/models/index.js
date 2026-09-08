const User = require('./User');
const WordBook = require('./WordBook');
const Word = require('./Word');
const UserLearnedWords = require('./UserLearnedWords');
const UserLearnRecord = require('./UserLearnRecord');
const VocabTestRecord = require('./VocabTestRecord');
const WrongWord = require('./WrongWord');
const Question = require('./Question');
const CommuteSetting = require('./CommuteSetting');
const CommuteRecord = require('./CommuteRecord');

// User associations
User.hasMany(UserLearnedWords, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(UserLearnRecord, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(VocabTestRecord, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(WrongWord, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(CommuteSetting, { foreignKey: 'user_id', sourceKey: 'id' });
User.hasMany(CommuteRecord, { foreignKey: 'user_id', sourceKey: 'id' });

UserLearnedWords.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
UserLearnRecord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
VocabTestRecord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
WrongWord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
CommuteSetting.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
CommuteRecord.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

// WordBook associations
WordBook.hasMany(Word, { foreignKey: 'book_id', sourceKey: 'id' });
Word.belongsTo(WordBook, { foreignKey: 'book_id', targetKey: 'id' });

module.exports = {
  User,
  WordBook,
  Word,
  UserLearnedWords,
  UserLearnRecord,
  VocabTestRecord,
  WrongWord,
  Question,
  CommuteSetting,
  CommuteRecord,
};
