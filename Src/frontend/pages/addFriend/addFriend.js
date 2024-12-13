var app = getApp();

Page({
  data: {
    inputId: '',
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
  onInput: function(e) {
    this.setData({
      inputId: e.detail.value // 更新输入值
    });
  },

  addFriend: function() {
    const { inputId } = this.data;
    console.log("inputId is", inputId);

    // 先在数据库中查找该用户
    wx.cloud.database().collection('users').where({
      zhanghao: inputId // 查询条件
    }).get()
    .then(res => {
      // if (res.data.length > 0) {
      if (res.data.length > 0){
        // 用户存在，检查是否已是好友
        this.checkIfAlreadyFriend(inputId);
      } else {
        wx.showToast({
          title: '用户不存在',
          icon: 'none'
        });
      }
    })
    .catch(err => {
      console.error("查询失败:", err);
    });
  },

  checkIfAlreadyFriend: function(targetId) {
    // 检查当前用户的好友列表
    wx.cloud.database().collection('users').where({
      zhanghao: app.globalData.zhanghao
    }).get()
    .then(res => {
      if (res.data.length > 0) {
        const friends = res.data[0].friends || [];

        // 检查是否已是好友
        if (friends.includes(targetId)) {
          wx.showToast({
            title: '已是好友，无法添加',
            icon: 'none'
          });
        } else {
          // 检查是否有未处理的请求
          this.checkPendingRequest(targetId);
        }
      } else {
        console.error("未找到用户:", app.globalData.zhanghao);
      }
    })
    .catch(err => {
      console.error("检查好友失败:", err);
    });
  },

  checkPendingRequest: function(targetId) {
    // 检查是否已存在未处理的好友请求
    wx.cloud.database().collection('friendsRequests').where({
      from: app.globalData.zhanghao,
      to: targetId,
      status: 'pending'
    }).get()
    .then(res => {
      if (res.data.length > 0) {
        wx.showToast({
          title: '好友请求已发送，请耐心等待',
          icon: 'none'
        });
      } else {
        // 如果没有未处理的请求，发送好友请求
        this.sendFriendRequest(targetId);
      }
    })
    .catch(err => {
      console.error("检查未处理的请求失败:", err);
    });
  },

  sendFriendRequest: function(targetId) {
    // 发送添加好友的消息到目标用户
    wx.cloud.database().collection('friendsRequests').add({
      data: {
        from: app.globalData.zhanghao, // 当前用户的zhanghao
        to: targetId,
        status: 'pending', // 请求状态
        createdAt: new Date()
      }
    })
    .then(() => {
      wx.showToast({
        title: '好友请求已发送',
        icon: 'success'
      });
      // 清空输入框
      this.setData({ inputId: '' });
    })
    .catch(err => {
      console.error("发送请求失败:", err);
    });
  }
});
