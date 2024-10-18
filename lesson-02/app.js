// app.js
const moment = require('moment');

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    moment.locale("zh-cn");
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null,
    "api": {
      "business_api": "https://water.ispongecity.com/api/business",
      "monitor_api": "https://water.ispongecity.com/api/monitor",
      "user_api": "https://water.ispongecity.com/api/user",
      "map_api": "https://water.ispongecity.com/api/map"
    }
  }
})
