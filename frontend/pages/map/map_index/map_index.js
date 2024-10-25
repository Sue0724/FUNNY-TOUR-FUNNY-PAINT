// pages/map/map_index/map_index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scale: 14,
    enable3d: false,
    showLocation: true,
    showCompass: true,
    showScale: true,
    enableOverlooking: false,
    enableZoom: true,
    enableScroll: true,
    enableRotate: true,
    drawPolygon: false,
    enableSatellite: false,
    enableTraffic: false,
    latitude: 30.512015580071605,
    longitude: 114.40807827869122,
    
    markers: [],
    chosenFixedLatitude: 30.512015580071605,
    chosenFixedLongitude: 114.40807827869122,
  },

  // 跳转绘画模式
  navigateToDrawMode() {
    wx.navigateTo({
      url: `/pages/map/map_canvas/map_canvas`
    });
  },

  // 跳转地点选择模式
  navigateToPlaceMode() {
    wx.navigateTo({
      url: `/pages/map/map_choose_places/map_choose_places`
    });
  },

  // 跳转行程模式
  navigateToTripMode() {
    wx.navigateTo({
      url: `/pages/map/trip/trip`
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const mapCtx = wx.createMapContext('map');
    this.setData({ mapCtx: mapCtx });
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
    // 传参
    const app = getApp();
    const fixedLat = app.globalData.chosenFixedLatitude;
    const fixedLng = app.globalData.chosenFixedLongitude;
    this.setData({
      chosenFixedLongitude: fixedLng,
      chosenFixedLatitude: fixedLat,
      latitude: fixedLat,
      longitude: fixedLng
    });
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