Component({
    properties: {
      word: Object,
      showBack: Boolean
    },
  
    methods: {
      onFlip() {
        this.triggerEvent('flip');
      },
  
      onMark(e) {
        const type = e.currentTarget.dataset.type;
        this.triggerEvent('mark', { type });
      }
    }
  });