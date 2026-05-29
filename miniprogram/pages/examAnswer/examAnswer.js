Page({
    data: {
      currentIndex: 0, // 当前题目索引
      selectedOption: "", // 选中的选项
      formatTime: "60:00", // 考试倒计时
      timer: null, // 定时器
      // 模拟题目（实际从数据库获取）
      examQuestions: [],
      selectedIds: [], // 选中的语法范围ID
      perTypeCount: 0 // 每类题目数
    },
  
    onLoad(options) {
      // 获取传递的参数
      const selectedIds = options.selectedIds.split(',').map(Number);
      const perTypeCount = parseInt(options.perTypeCount);
      this.setData({ selectedIds, perTypeCount });
  
      // 模拟从数据库加载题目（实际替换为真实接口）
      this.loadExamQuestions();
  
      // 启动倒计时
      this.startTimer();
    },
  
    // 加载考试题目
    loadExamQuestions() {
      // 模拟根据选中范围生成100题
      const mockQuestions = [];
      for (let i = 0; i < 100; i++) {
        mockQuestions.push({
          question: `语法考题${i+1}：下列选项中语法正确的是？`,
          options: ["选项A", "选项B", "选项C", "选项D"],
          correctAnswer: "选项B"
        });
      }
      this.setData({
        examQuestions: mockQuestions,
        currentQuestion: mockQuestions[0]
      });
    },
  
    // 启动倒计时
    startTimer() {
      let totalSeconds = 60 * 60; // 60分钟
      const timer = setInterval(() => {
        totalSeconds--;
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        this.setData({ formatTime: `${minutes}:${seconds}` });
  
        // 时间到自动交卷
        if (totalSeconds <= 0) {
          clearInterval(timer);
          this.submitExam();
        }
      }, 1000);
      this.setData({ timer });
    },
  
    // 选择选项
    selectOption(e) {
      this.setData({ selectedOption: e.currentTarget.dataset.option });
    },
  
    // 上一题
    prevQuestion() {
      if (this.data.currentIndex <= 0) return;
      const newIndex = this.data.currentIndex - 1;
      this.setData({
        currentIndex: newIndex,
        currentQuestion: this.data.examQuestions[newIndex],
        selectedOption: ""
      });
    },
  
    // 下一题
    nextQuestion() {
      if (this.data.currentIndex >= 99) return;
      const newIndex = this.data.currentIndex + 1;
      this.setData({
        currentIndex: newIndex,
        currentQuestion: this.data.examQuestions[newIndex],
        selectedOption: ""
      });
    },
  
    // 交卷
    submitExam() {
      clearInterval(this.data.timer);
      // 模拟批改试卷（实际项目中对接批改逻辑）
      wx.showModal({
        title: "考试结束",
        content: "你已完成100题模拟考试，正在批改试卷...",
        showCancel: false,
        success: () => {
          // 跳转到成绩页面
          wx.navigateTo({
            url: '/pages/examResult/examResult'
          });
        }
      });
    },
  
    onUnload() {
      // 页面卸载清除定时器
      clearInterval(this.data.timer);
    }
  });