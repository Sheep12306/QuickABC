ocrImage() 
    this.setData({ loading: true, loadingText: '测试提取逻辑...' });
  
    // 👉 直接用假文本测试，不走OCR
    const fakeText = "apple banana cat dog elephant";
    const words = this.extractWords(fakeText);
    
    console.log("✅ 假文本提取结果：", words);
    this.setData({
      loading: false,
      recognizedWords: words
    });
  