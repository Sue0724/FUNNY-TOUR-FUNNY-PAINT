// app.js

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null,
    tripMarkers: "[]", // 初始化为空数组的 JSON 字符串
    fixedLatitude: 0,
    fixedLongitude: 0
  },
  setTripMarkers(value) {
    this.globalData.tripMarkers = value;
  },
  setFixedLatitude(value) {
    this.globalData.fixedLatitude = value;
  },
  setFixedLongitude(value) {
    this.globalData.fixedLongitude = value;
  },
})
