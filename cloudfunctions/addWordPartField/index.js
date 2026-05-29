// cloudfunctions/addWordPartField/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'cloud1-1gfs1z6a4027d442' // 替换为你的云开发环境ID
})

const db = cloud.database()
const wordsCollection = db.collection('words') // 你的单词集合名

exports.main = async (event, context) => {
  try {
    // ========== 核心：词性匹配规则（英文简称） ==========
    const getPartByWord = (word) => {
      // 可根据你的单词库扩展更多规则，这里提供基础示例
      const lowerWord = word.toLowerCase();
      
      // 动词（常见动词后缀/特征）
      if (/^(play|run|eat|sleep|jump|walk|talk|see|hear|do|make|take)$/.test(lowerWord) || 
          /(ate|ed|ing|ize)$/.test(lowerWord)) {
        return 'v';
      }
      // 名词（常见名词后缀/特征）
      else if (/^(apple|book|water|time|school|teacher|student|city|country)$/.test(lowerWord) || 
               /(tion|sion|ment|ness|ity|er|or|ist)$/.test(lowerWord)) {
        return 'n';
      }
      // 形容词（常见形容词后缀）
      else if (/^(happy|sad|big|small|fast|slow|new|old|good|bad)$/.test(lowerWord) || 
               /(ful|less|able|ible|ous|y|ive)$/.test(lowerWord)) {
        return 'adj';
      }
      // 副词
      else if (/^(quickly|slowly|happily|sadly|very|too|so)$/.test(lowerWord) || 
               /ly$/.test(lowerWord)) {
        return 'adv';
      }
      // 介词
      else if (/^(in|on|at|by|with|for|to|from|into)$/.test(lowerWord)) {
        return 'prep';
      }
      // 代词
      else if (/^(he|she|it|we|they|i|you|me|him|her)$/.test(lowerWord)) {
        return 'pron';
      }
      // 连词
      else if (/^(and|but|or|so|because|if|when)$/.test(lowerWord)) {
        return 'conj';
      }
      // 数词
      else if (/^(one|two|three|four|five|first|second|third)$/.test(lowerWord)) {
        return 'num';
      }
      // 感叹词
      else if (/^(oh|wow|ah|oops|hey)$/.test(lowerWord)) {
        return 'int';
      }
      // 未知词性
      else {
        return 'unk';
      }
    };

    // ========== 批量更新逻辑 ==========
    let offset = 0;
    const batchSize = 100; // 分页处理，避免超时
    let hasMore = true;
    let totalUpdated = 0;

    while (hasMore) {
      // 查询当前页单词
      const queryRes = await wordsCollection
        .skip(offset)
        .limit(batchSize)
        .get();

      if (queryRes.data.length === 0) {
        hasMore = false;
        break;
      }

      // 批量更新（跳过已存在part字段的单词）
      const updateTasks = [];
      queryRes.data.forEach(word => {
        if (word.part) return; // 已有词性，跳过

        const part = getPartByWord(word.word); // 获取英文简称词性
        updateTasks.push(
          wordsCollection.doc(word._id).update({
            data: {
              part: part, // 小写英文简称
              updateTime: db.serverDate() // 记录更新时间
            }
          })
        );
      });

      // 执行更新
      if (updateTasks.length > 0) {
        await Promise.all(updateTasks);
        totalUpdated += updateTasks.length;
        console.log(`已更新 ${updateTasks.length} 个单词，累计：${totalUpdated}`);
      }

      offset += batchSize;
    }

    return {
      code: 200,
      msg: `批量更新完成，共新增 ${totalUpdated} 个单词的part字段`,
      data: { totalUpdated }
    };

  } catch (err) {
    console.error('批量更新失败：', err);
    return {
      code: 500,
      msg: '更新失败：' + err.message,
      error: err
    };
  }
};