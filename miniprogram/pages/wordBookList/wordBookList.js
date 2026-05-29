Page({
    data: {
      vocabList: [],
      filteredList: [],
      searchKeyword: '',
      showSearch: false,
      showAddModal: false,
      batchMode: false,
      allSelected: false,
      selectedCount: 0,
      selectedIndices: [],
      newWordEn: '',
      newWordPhonetic: '',
      newWordMeaning: '',
      themeColors: [
        { accent: '#43A047', light: '#E8F5E9' },
        { accent: '#00897B', light: '#E0F2F1' },
        { accent: '#F57C00', light: '#FFF3E0' },
        { accent: '#7B1FA2', light: '#F3E5F5' },
        { accent: '#1976D2', light: '#E3F2FD' }
      ],
      themeIdx: 0,
      cardThemes: [
        { bg: 'linear-gradient(175deg, #C8E6C9 0%, #E8F5E9 30%, #F1F8F4 100%)' },
        { bg: 'linear-gradient(175deg, #B2DFDB 0%, #E0F2F1 30%, #F1F8F7 100%)' },
        { bg: 'linear-gradient(175deg, #FFE0B2 0%, #FFF3E0 30%, #FFF8F5 100%)' },
        { bg: 'linear-gradient(175deg, #E1BEE7 0%, #F3E5F5 30%, #F8F4FA 100%)' },
        { bg: 'linear-gradient(175deg, #BBDEFB 0%, #E3F2FD 30%, #F5F8FC 100%)' }
      ]
    },

    onLoad() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      this.loadVocabList();
    },

    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
      this.loadVocabList();
    },

    loadVocabList() {
      try {
        const newWords = wx.getStorageSync('newWords') || [];
        const vocabList = Array.isArray(newWords) ? newWords : [];
        vocabList.sort((a, b) => {
          const tA = a.addedTime ? new Date(a.addedTime).getTime() : 0;
          const tB = b.addedTime ? new Date(b.addedTime).getTime() : 0;
          return tB - tA;
        });
        this.setData({ vocabList, filteredList: vocabList });
      } catch (e) {
        this.setData({ vocabList: [], filteredList: [] });
      }
    },

    // 搜索
    toggleSearch() {
      const show = !this.data.showSearch;
      this.setData({ showSearch: show, searchKeyword: show ? this.data.searchKeyword : '' });
      if (!show) {
        this.setData({ filteredList: this.data.vocabList });
      }
    },

    onSearchInput(e) {
      const keyword = e.detail.value;
      this.setData({ searchKeyword: keyword });
      if (keyword.trim()) {
        const filtered = this.data.vocabList.filter(w =>
          w.en && w.en.toLowerCase().includes(keyword.toLowerCase())
        );
        this.setData({ filteredList: filtered });
      } else {
        this.setData({ filteredList: this.data.vocabList });
      }
    },

    onSearchConfirm() {
      // search already performed in onSearchInput
    },

    // 查看单词详情 - 进入复习
    viewWordDetail(e) {
      if (this.data.batchMode) {
        this.toggleSelectWord(e);
        return;
      }
      const index = e.currentTarget.dataset.index;
      const word = this.data.filteredList[index];
      if (word && word.en) {
        const words = JSON.stringify([word]);
        wx.navigateTo({
          url: `/pages/review/review?bookId=1&group=1&words=${encodeURIComponent(words)}`
        });
      }
    },

    // 标记为已掌握
    markMastered(e) {
      const index = e.currentTarget.dataset.index;
      const word = this.data.filteredList[index];
      const vocabList = this.data.vocabList.filter(w => w.en !== word.en);
      wx.setStorageSync('newWords', vocabList);
      this.setData({ vocabList });
      this.applySearchFilter();
      wx.showToast({ title: '已标记为掌握', icon: 'success' });
    },

    // 删除单个
    deleteWord(e) {
      const that = this;
      const index = e.currentTarget.dataset.index;
      const word = this.data.filteredList[index];
      wx.showModal({
        title: '确认删除',
        content: `确定要删除 "${word.en}" 吗？`,
        success(res) {
          if (res.confirm) {
            const vocabList = that.data.vocabList.filter(w => w.en !== word.en);
            wx.setStorageSync('newWords', vocabList);
            that.setData({ vocabList });
            that.applySearchFilter();
            wx.showToast({ title: '已删除', icon: 'success' });
          }
        }
      });
    },

    applySearchFilter() {
      const keyword = this.data.searchKeyword;
      if (keyword.trim()) {
        const filtered = this.data.vocabList.filter(w =>
          w.en && w.en.toLowerCase().includes(keyword.toLowerCase())
        );
        this.setData({ filteredList: filtered });
      } else {
        this.setData({ filteredList: this.data.vocabList });
      }
    },

    // 批量管理
    batchDelete() {
      if (this.data.vocabList.length === 0) return;
      this.setData({
        batchMode: true,
        selectedIndices: [],
        selectedCount: 0,
        allSelected: false
      });
    },

    toggleSelectWord(e) {
      const index = e.currentTarget.dataset.index;
      let selected = [...this.data.selectedIndices];
      const pos = selected.indexOf(index);
      if (pos > -1) {
        selected.splice(pos, 1);
      } else {
        selected.push(index);
      }
      this.setData({
        selectedIndices: selected,
        selectedCount: selected.length,
        allSelected: selected.length === this.data.filteredList.length
      });
    },

    selectAllWords() {
      if (this.data.allSelected) {
        this.setData({ selectedIndices: [], selectedCount: 0, allSelected: false });
      } else {
        const all = this.data.filteredList.map((_, i) => i);
        this.setData({ selectedIndices: all, selectedCount: all.length, allSelected: true });
      }
    },

    batchDeleteConfirm() {
      const that = this;
      if (this.data.selectedCount === 0) return;
      wx.showModal({
        title: '确认批量删除',
        content: `确定要删除选中的 ${this.data.selectedCount} 个生词吗？`,
        success(res) {
          if (res.confirm) {
            const indices = that.data.selectedIndices.sort((a, b) => b - a);
            const vocabList = [...that.data.vocabList];
            const filtered = that.data.filteredList;
            indices.forEach(i => {
              const word = filtered[i];
              const realIdx = vocabList.findIndex(w => w.en === word.en);
              if (realIdx > -1) vocabList.splice(realIdx, 1);
            });
            wx.setStorageSync('newWords', vocabList);
            that.setData({
              vocabList,
              batchMode: false,
              selectedIndices: [],
              selectedCount: 0
            });
            that.applySearchFilter();
            wx.showToast({ title: '已删除', icon: 'success' });
          }
        }
      });
    },

    exitBatchMode() {
      this.setData({
        batchMode: false,
        selectedIndices: [],
        selectedCount: 0,
        allSelected: false
      });
    },

    // 添加生词
    addNewWord() {
      this.setData({
        showAddModal: true,
        newWordEn: '',
        newWordPhonetic: '',
        newWordMeaning: ''
      });
    },

    hideAddModal() {
      this.setData({ showAddModal: false });
    },

    onEnInput(e) { this.setData({ newWordEn: e.detail.value }); },
    onPhoneticInput(e) { this.setData({ newWordPhonetic: e.detail.value }); },
    onMeaningInput(e) { this.setData({ newWordMeaning: e.detail.value }); },

    confirmAddWord() {
      const { newWordEn, newWordMeaning, newWordPhonetic } = this.data;
      if (!newWordEn.trim()) {
        wx.showToast({ title: '请输入英文单词', icon: 'none' });
        return;
      }
      if (!newWordMeaning.trim()) {
        wx.showToast({ title: '请输入释义', icon: 'none' });
        return;
      }

      const vocabList = this.data.vocabList;
      const exists = vocabList.some(w => w.en === newWordEn.trim());
      if (exists) {
        wx.showToast({ title: '该单词已存在', icon: 'none' });
        return;
      }

      vocabList.unshift({
        en: newWordEn.trim(),
        phonetic: newWordPhonetic.trim(),
        meaning: newWordMeaning.trim(),
        addedTime: new Date().toISOString()
      });

      wx.setStorageSync('newWords', vocabList);
      this.setData({
        vocabList,
        showAddModal: false,
        newWordEn: '',
        newWordPhonetic: '',
        newWordMeaning: ''
      });
      this.applySearchFilter();
      wx.showToast({ title: '添加成功', icon: 'success' });
    }
  });
