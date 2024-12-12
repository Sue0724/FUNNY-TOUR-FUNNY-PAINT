// pages/themeColorSet/themeColorSet.js
Page({
  data: {
    colors: [
      '#ADADC7', '#82af8a', '#96CDCD',
      '#ec9bad', '#F3C2AF', '#ffe870',
      '#DBD4C6', '#BECBD3', '#000000'
    ],
    selectedColor: ''
  },

  onLoad() {
    const app = getApp();
    this.setData({
      selectedColor: app.globalData.themeColor
    });
  },

  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    const app = getApp();
    app.globalData.themeColor = color;

    this.setData({
      selectedColor: color
    });

    wx.showToast({
      title: '主题颜色已更改',
      icon: 'success',
      duration: 2000
    });

    this.updateTheme();
  },

  updateTheme() {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.setTheme) {
        page.setTheme();
      }
    });
  },

  // navigateToHome() {
  //   wx.navigateTo({
  //     url: '/pages/index/index'
  //   });
  // }
});
