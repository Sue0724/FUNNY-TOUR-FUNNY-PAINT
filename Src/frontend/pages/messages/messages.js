var app = getApp();

Page({
  data: {
    requests: [], // 存储好友请求
    messages: [], // 存储好友同意与否的消息
    startX: 0, // 记录手指起始位置
    // 用于控制每个请求和消息的状态
    activeRequestIndex: -1,
    activeMessageIndex: -1
  },

  onLoad: function() {
    this.loadFriendRequests();
    this.loadMessages(); // 加载消息
  },

  loadFriendRequests: function() {
    wx.cloud.database().collection('friendsRequests').where({
      to: app.globalData.zhanghao, // 当前用户的zhanghao
      status: 'pending'
    }).get()
    .then(res => {
      this.setData({ requests: res.data });
    })
    .catch(err => {
      console.error("加载请求失败:", err);
    });
  },

  loadMessages: function() {
    console.log("你确实进入了消息加载这个函数中")
    wx.cloud.database().collection('messages').where({
      to: app.globalData.zhanghao // 当前用户的zhanghao
    }).get()
    .then(res => {
      this.setData({ messages: res.data });
    })
    .catch(err => {
      console.error("加载消息失败:", err);
    });
  },

  touchStart: function(e) {
    // 记录开始位置
    this.setData({
      startX: e.touches[0].clientX
    });
  },

  touchMove: function(e) {
    const endX = e.touches[0].clientX;
    const diffX = this.data.startX - endX;
    const index = e.currentTarget.dataset.index;

    if (diffX > 0) {
      // 向左滑动
      this.setData({ activeRequestIndex: index });
    } else {
      // 向右滑动
      this.setData({ activeRequestIndex: -1 });
    }
  },

  touchEnd: function(e) {
    const endX = e.changedTouches[0].clientX;
    const diffX = this.data.startX - endX;
    const index = e.currentTarget.dataset.index;

    // 如果滑动距离小于一定值，则重置
    if (Math.abs(diffX) < 50) {
      this.setData({ activeRequestIndex: -1 });
    }
  },

  acceptRequest: function(e) {
    const fromId = e.currentTarget.dataset.id;

    // 更新好友请求状态
    wx.cloud.database().collection('friendsRequests').where({
      from: fromId,
      to: app.globalData.zhanghao
    }).update({
      data: { status: 'accepted' }
    }).then(() => {
      // 将对方添加到好友列表
      this.updateFriendsList(app.globalData.zhanghao, fromId); // 更新自己的好友列表
      this.updateFriendsList(fromId, app.globalData.zhanghao); // 更新对方的好友列表
      // 通知发送方
      this.notifySender(fromId, 'accepted');
      this.deleteRequest(fromId);
    });
  },

  declineRequest: function(e) {
    const fromId = e.currentTarget.dataset.id;

    // 更新好友请求状态为拒绝
    wx.cloud.database().collection('friendsRequests').where({
      from: fromId,
      to: app.globalData.zhanghao
    }).update({
      data: { status: 'declined' }
    }).then(() => {
      // 发送拒绝通知
      this.notifySender(fromId, 'declined');
      // 删除该请求
      this.deleteRequest(fromId);
    });
  },

  updateFriendsList: function(userId, newFriendId) {
    // 更新指定用户的friends数组
    wx.cloud.database().collection('users').where({
      zhanghao: userId
    }).update({
      data: {
        friends: wx.cloud.database().command.push(newFriendId) // 使用push将新好友添加到数组中
      }
    }).then(() => {
      console.log(`${userId} 已添加 ${newFriendId} 为好友`);
    }).catch(err => {
      console.error("更新好友列表失败:", err);
    });
  },

  notifySender: function(senderId, action) {
    // 发送通知给发送方
    const message = action === 'accepted' ? 
      `${app.globalData.zhanghao}已接受你的好友申请` : 
      `${app.globalData.zhanghao}拒绝了你的好友申请`;

    wx.cloud.database().collection('messages').add({
      data: {
        from: app.globalData.zhanghao,
        to: senderId,
        content: message,
        type: 'friendRequestNotification',
        timestamp: new Date()
      }
    }).then(() => {
      wx.showToast({
        title: action === 'accepted' ? '已接受请求' : '已拒绝请求',
        icon: 'success'
      });
    }).catch(err => {
      console.error("通知发送方失败:", err);
    });
  },

  deleteRequest: function(fromId) {
    // 从数据库中删除已处理的好友请求
    wx.cloud.database().collection('friendsRequests').where({
      from: fromId,
      to: app.globalData.zhanghao
    }).remove()
    .then(() => {
      wx.showToast({
        title: '已删除请求',
        icon: 'success'
      });
      this.loadFriendRequests(); // 重新加载请求
    })
    .catch(err => {
      console.error("删除请求失败:", err);
    });
  },

  deleteMessage: function(e) {
    const messageId = e.currentTarget.dataset.id;
    wx.cloud.database().collection('messages').doc(messageId).remove()
      .then(() => {
        wx.showToast({
          title: '已删除消息',
          icon: 'success'
        });
        this.loadMessages(); // 重新加载消息
      })
      .catch(err => {
        console.error("删除消息失败:", err);
      });
  }
});
