const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);

const words = JSON.parse(fs.readFileSync(path.join(__dirname, 'gaokao3500_parsed.json'), 'utf-8'));

async function importWords() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const [rows] = await sequelize.query('SELECT id, name FROM word_books WHERE id = 11');
    if (rows.length === 0) {
      await sequelize.query(
        "INSERT INTO word_books (id, name, description, total_words) VALUES (11, '高考英语3500', '高中英语3500核心词汇', ?)",
        { replacements: [words.length] }
      );
      console.log('Created book: 高考英语3500');
    } else {
      await sequelize.query('UPDATE word_books SET total_words = ? WHERE id = 11',
        { replacements: [words.length] }
      );
      console.log('Updated book: ' + rows[0].name + ', total_words: ' + words.length);
    }

    await sequelize.query('DELETE FROM words WHERE book_id = 11');
    console.log('Cleared old words');

    let count = 0;
    for (const w of words) {
      await sequelize.query(
        'INSERT INTO words (book_id, word, phonetic, part, meaning) VALUES (?, ?, ?, ?, ?)',
        { replacements: [11, w.word, w.phonetic, w.part, w.meaning] }
      );
      count++;
      if (count % 500 === 0) console.log('Imported ' + count + '/' + words.length);
    }

    console.log('Done! Imported ' + count + ' words to book_id=11');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

importWords();
