// pages/giveComments/giveComments.js
Page({

  data: {
    themeColor: '#82af8a'
  },

  onLoad() {
    this.setTheme();
  },

  setTheme() {
    const app = getApp();
    const themeColor = app.globalData.themeColor;
    this.setData({
      themeColor: themeColor,
      gradientStyle: `background: linear-gradient(to bottom, ${themeColor}, #ffffff);`
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})