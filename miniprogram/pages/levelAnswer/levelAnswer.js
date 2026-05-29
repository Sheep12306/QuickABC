Page({
    data: {
      levelId: 0,
      levelTitle: "",
      currentIndex: 0, // 当前题目索引
      prevIndex: 0, // 上一题索引（用于动画）
      totalCount: 10, // 每题关卡10题
      currentQuestion: {}, // 当前题目
      selectedOption: "", // 选择题选中答案
      fillAnswer: "", // 填空题答案
      canProceed: false, // 是否可进入下一题
      // 各关卡题目库
      levelQuestions: {
        1: [
          { type: "choice", question: "She ___ to school every day.", options: ["go", "goes", "went"], correctAnswer: "goes" },
          { type: "fill", question: "I am good ___ English.", correctAnswer: "at" },
          { type: "choice", question: "This is ___ apple.", options: ["a", "an", "the"], correctAnswer: "an" },
          // 补充剩余7题...
          { type: "choice", question: "He ___ TV last night.", options: ["watch", "watches", "watched"], correctAnswer: "watched" },
          { type: "fill", question: "She is interested ___ reading.", correctAnswer: "in" },
          { type: "choice", question: "There ___ a book on the desk.", options: ["is", "are", "am"], correctAnswer: "is" },
          { type: "fill", question: "I go to school ___ foot.", correctAnswer: "on" },
          { type: "choice", question: "They ___ playing football now.", options: ["is", "are", "was"], correctAnswer: "are" },
          { type: "fill", question: "He arrived ___ Beijing yesterday.", correctAnswer: "in" },
          { type: "choice", question: "I ___ finish my homework yet.", options: ["haven't", "hasn't", "don't"], correctAnswer: "haven't" }
        ],
        2: [
          { type: "choice", question: "I get up ___ 7 o'clock.", options: ["in", "on", "at"], correctAnswer: "at" },
          { type: "fill", question: "She is waiting ___ the bus.", correctAnswer: "for" },
          // 补充剩余8题...
          { type: "choice", question: "We go to park ___ Sunday.", options: ["in", "on", "at"], correctAnswer: "on" },
          { type: "fill", question: "It's cold ___ winter.", correctAnswer: "in" },
          { type: "choice", question: "He is angry ___ me.", options: ["with", "at", "to"], correctAnswer: "with" },
          { type: "fill", question: "I'm looking forward ___ seeing you.", correctAnswer: "to" },
          { type: "choice", question: "She is afraid ___ dogs.", options: ["to", "of", "with"], correctAnswer: "of" },
          { type: "fill", question: "He succeeded ___ hard work.", correctAnswer: "by" },
          { type: "choice", question: "I agree ___ your opinion.", options: ["with", "to", "on"], correctAnswer: "with" },
          { type: "fill", question: "She is proud ___ her son.", correctAnswer: "of" },
          { type: "choice", question: "He is different ___ his brother.", options: ["from", "with", "to"], correctAnswer: "from" },
          { type: "fill", question: "I'm tired ___ waiting.", correctAnswer: "of" }
        ],
        3: [
          { type: "choice", question: "I ___ English for 5 years.", options: ["learn", "learned", "have learned"], correctAnswer: "have learned" },
          { type: "fill", question: "By the time he arrived, we ___ dinner.", correctAnswer: "had had" },
          // 补充剩余8题...
          { type: "choice", question: "She ___ to Paris next week.", options: ["will go", "goes", "went"], correctAnswer: "will go" },
          { type: "fill", question: "I ___ TV when he came in.", correctAnswer: "was watching" },
          { type: "choice", question: "If it rains, we ___ out.", options: ["won't go", "didn't go", "don't go"], correctAnswer: "won't go" },
          { type: "fill", question: "He ___ here since 2020.", correctAnswer: "has been" },
          { type: "choice", question: "They ___ the bridge by next year.", options: ["will finish", "have finished", "finished"], correctAnswer: "will finish" },
          { type: "fill", question: "I ___ my homework before I went out.", correctAnswer: "had finished" },
          { type: "choice", question: "She ___ a book now.", options: ["reads", "is reading", "read"], correctAnswer: "is reading" },
          { type: "fill", question: "We ___ this movie twice.", correctAnswer: "have seen" },
          { type: "choice", question: "He ___ to school yesterday.", options: ["doesn't go", "didn't go", "hasn't gone"], correctAnswer: "didn't go" },
          { type: "fill", question: "I ___ you as soon as I arrive.", correctAnswer: "will call" }
        ]
      }
    },
  
    onLoad(options) {
      const levelId = parseInt(options.levelId);
      // 设置关卡信息
      const levelTitles = {
        1: "基础语法入门",
        2: "介词专项练习",
        3: "时态应用进阶"
      };
      
      this.setData({
        levelId,
        levelTitle: levelTitles[levelId] || `语法闯关${levelId}`,
        currentQuestion: this.data.levelQuestions[levelId][0]
      });
    },
  
    // 选择题选择选项
    selectOption(e) {
      const option = e.currentTarget.dataset.option;
      this.setData({
        selectedOption: option,
        canProceed: true
      });
    },
  
    // 填空题输入答案
    inputFillAnswer(e) {
      const value = e.detail.value.trim();
      this.setData({
        fillAnswer: value,
        canProceed: value.length > 0
      });
    },
  
    // 上一题
    prevQuestion() {
      if (this.data.currentIndex <= 0) return;
      const newIndex = this.data.currentIndex - 1;
      this.setData({
        prevIndex: this.data.currentIndex,
        currentIndex: newIndex,
        currentQuestion: this.data.levelQuestions[this.data.levelId][newIndex],
        selectedOption: "",
        fillAnswer: "",
        canProceed: false
      });
    },
  
    // 下一题
    nextQuestion() {
      if (!this.data.canProceed || this.data.currentIndex >= this.data.totalCount - 1) return;
      const newIndex = this.data.currentIndex + 1;
      this.setData({
        prevIndex: this.data.currentIndex,
        currentIndex: newIndex,
        currentQuestion: this.data.levelQuestions[this.data.levelId][newIndex],
        selectedOption: "",
        fillAnswer: "",
        canProceed: false
      });
    },
  
    // 提交关卡
    submitLevel() {
      if (!this.data.canProceed) return;
      
      // 简单统计正确率（实际可存储每道题答案）
      wx.showModal({
        title: "闯关完成",
        content: `第${this.data.levelId}关已完成！\n恭喜你完成10道语法题挑战`,
        showCancel: false,
        success: () => {
          wx.navigateBack(); // 返回发现页
        }
      });
    },
  
    // 返回发现页
    goBack() {
      wx.navigateBack();
    }
  });