Page({
    data: {
      // 原有语法范围列表
      grammarScopes: [
        { id: 1, name: "基础语法", checked: false },
        { id: 2, name: "介词专项", checked: false },
        { id: 3, name: "时态应用", checked: false },
        { id: 4, name: "从句基础", checked: false },
        { id: 5, name: "非谓语动词", checked: false },
        { id: 6, name: "复合句练习", checked: false }
      ],
      // 新增细分分类
      newGrammarScopes: [
        { id: 7, name: "名词单复数变化", checked: false },
        { id: 8, name: "比较级最高级", checked: false },
        { id: 9, name: "不规则动词表", checked: false },
        { id: 10, name: "冠词用法", checked: false },
        { id: 11, name: "主谓一致", checked: false },
        { id: 12, name: "情态动词", checked: false }
      ],
      selectedCount: 0,  // 已选类别数
      perTypeCount: 0    // 每类题目数
    },
  
    onLoad() {
      // 初始化计算（兜底）
      this.calcCount();
    },
  
    // checkbox-group统一处理勾选事件
    onGroupCheck(e) {
      const selectedIds = e.detail.value; // 获取所有选中的ID（字符串数组）
      const { grammarScopes, newGrammarScopes } = this.data;
      
      // 更新原有分类勾选状态
      const updatedOldScopes = grammarScopes.map(item => {
        return {
          ...item,
          checked: selectedIds.includes(item.id + '')
        };
      });
  
      // 更新新增分类勾选状态
      const updatedNewScopes = newGrammarScopes.map(item => {
        return {
          ...item,
          checked: selectedIds.includes(item.id + '')
        };
      });
      
      // 更新数据并重新计算数量
      this.setData({ 
        grammarScopes: updatedOldScopes,
        newGrammarScopes: updatedNewScopes
      }, () => {
        this.calcCount();
      });
    },
  
    // 计算选中数量（包含原有+新增分类）
    calcCount() {
      const { grammarScopes, newGrammarScopes } = this.data;
      // 合并原有+新增分类，统计所有选中项
      const allScopes = [...grammarScopes, ...newGrammarScopes];
      const selectedCount = allScopes.filter(item => item.checked).length;
      // 计算每类题目数
      const perTypeCount = selectedCount > 0 ? Math.floor(100 / selectedCount) : 0;
      
      // 强制更新数据
      this.setData({
        selectedCount: selectedCount,
        perTypeCount: perTypeCount
      });
      
      console.log("选中数量：", selectedCount);
      console.log("每类题目数：", perTypeCount);
    },
  
    // 开始考试
    startExam() {
      const { selectedCount, grammarScopes, newGrammarScopes } = this.data;
      
      // 最终校验
      if (selectedCount === 0) {
        wx.showToast({ title: "请至少选择1类语法范围", icon: "none" });
        return;
      }
  
      // 合并原有+新增分类，筛选选中的ID
      const allScopes = [...grammarScopes, ...newGrammarScopes];
      const selectedIds = allScopes
        .filter(item => item.checked)
        .map(item => item.id);
  
      wx.showLoading({ title: '加载考题中...' });
      
      setTimeout(() => {
        wx.hideLoading();
        // 弹出提示验证方法触发
        wx.showToast({ title: `已选${selectedCount}类，跳转中...`, icon: "none" });
        
        // 跳转考试页面
        wx.navigateTo({
          url: `/pages/examAnswer/examAnswer?selectedIds=${selectedIds.join(',')}&perTypeCount=${Math.floor(100/selectedCount)}`,
          // 跳转失败兜底提示
          fail: (err) => {
            wx.showToast({ 
              title: `跳转失败：${err.errMsg}`, 
              icon: "none",
              duration: 3000
            });
            console.error("跳转错误：", err);
          }
        });
      }, 1000);
    },
  
    // 返回上一页（保留方法，即使移除返回键也不影响代码运行）
    goBack() {
      wx.navigateBack();
    }
  });