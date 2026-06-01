-- 清理死表：已从代码中移除，需手动删除数据库中残留的表
-- 在 DataGrip 中执行：USE vocab_db; 然后运行以下语句

DROP TABLE IF EXISTS user_book_progress;
DROP TABLE IF EXISTS user_study_data;
DROP TABLE IF EXISTS word_study_records;
