// logs.js

Page({
  data: {
    logs: []
  },
  onLoad() {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return {
          date: new Date(log),
          timeStamp: log
        }
      })
    })
  }
})
