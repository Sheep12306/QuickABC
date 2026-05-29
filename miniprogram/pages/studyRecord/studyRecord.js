Page({
    data: {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      calendarDays: [],
      selectedDate: '',
      selectedWordNum: 0,
      checkInData: {},
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
      this.loadCheckInData();
      this.initCalendar();
    },

    onShow() {
      this.setData({ themeIdx: getApp().globalData.cardThemeIndex || 0 });
    },

    loadCheckInData() {
      try {
        const checkInData = {};
        // Read daily learned words from storage across all book IDs and dates
        for (let i = 0; i < 60; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          // Check common book IDs
          for (const bookId of ['primary_school', '1', 1]) {
            const key = `dailyLearnedWords_${bookId}_${dateStr}`;
            const words = wx.getStorageSync(key) || [];
            if (words.length > 0) {
              checkInData[dateStr] = (checkInData[dateStr] || 0) + words.length;
            }
          }
        }
        this.setData({ checkInData });
      } catch (e) {
        // keep empty
      }
    },

    initCalendar() {
      const { currentYear, currentMonth, checkInData } = this.data;
      const calendarDays = [];
      const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
      const totalDays = new Date(currentYear, currentMonth, 0).getDate();
      const lastMonthTotalDays = new Date(currentYear, currentMonth - 1, 0).getDate();

      for (let i = firstDay - 1; i >= 0; i--) {
        const day = lastMonthTotalDays - i;
        const m = currentMonth - 1 < 1 ? 12 : currentMonth - 1;
        const y = currentMonth - 1 < 1 ? currentYear - 1 : currentYear;
        const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarDays.push({ day, date, isCurrentMonth: false, isCheckIn: !!checkInData[date], wordNum: checkInData[date] || 0 });
      }

      for (let day = 1; day <= totalDays; day++) {
        const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarDays.push({ day, date, isCurrentMonth: true, isCheckIn: !!checkInData[date], wordNum: checkInData[date] || 0 });
      }

      const remainDays = 42 - calendarDays.length;
      for (let day = 1; day <= remainDays; day++) {
        const m = currentMonth + 1 > 12 ? 1 : currentMonth + 1;
        const y = currentMonth + 1 > 12 ? currentYear + 1 : currentYear;
        const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarDays.push({ day, date, isCurrentMonth: false, isCheckIn: !!checkInData[date], wordNum: checkInData[date] || 0 });
      }

      this.setData({ calendarDays });
    },

    prevMonth() {
      let { currentYear, currentMonth } = this.data;
      currentMonth--;
      if (currentMonth < 1) { currentMonth = 12; currentYear--; }
      this.setData({ currentYear, currentMonth, selectedDate: '', selectedWordNum: 0 }, () => this.initCalendar());
    },

    nextMonth() {
      let { currentYear, currentMonth } = this.data;
      currentMonth++;
      if (currentMonth > 12) { currentMonth = 1; currentYear++; }
      this.setData({ currentYear, currentMonth, selectedDate: '', selectedWordNum: 0 }, () => this.initCalendar());
    },

    selectDate(e) {
      const { date, wordnum } = e.currentTarget.dataset;
      this.setData({ selectedDate: date, selectedWordNum: wordnum || 0 });
    },

    goBack() {
      wx.navigateBack();
    }
  });
