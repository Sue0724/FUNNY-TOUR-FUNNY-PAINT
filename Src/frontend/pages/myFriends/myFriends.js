var app = getApp();

Page({
  data: {
    showSidebar: false, 
    friendList: [] ,// 存储好友列表
    themeColor: '#82af8a'
  },
  
  onLoad: function() {
    this.loadFriends();
    this.setTheme();
  },
  //设置颜色
  setTheme() {
    const app = getApp();
    const themeColor = app.globalData.themeColor;
    this.setData({
      themeColor: themeColor,
      gradientStyle: `background: linear-gradient(to bottom, ${themeColor}, #ffffff);`
    });
  },

  toggleSidebar: function() {
    this.setData({
      showSidebar: !this.data.showSidebar // 切换边栏显示状态
    });
  },
  
  loadFriends: function() {
    wx.cloud.database().collection('users').where({
      zhanghao: app.globalData.zhanghao
    }).get()
    .then(res => {
      if (res.data.length > 0) {
        const friendsList = res.data[0].friends || []; // 如果没有，默认为空数组
        this.setData({ friendList: friendsList.length > 0 ? friendsList : [] }); // 确保 friendList 不为 null
      } else {
        console.error("未找到用户:", app.globalData.zhanghao);
        this.setData({ friendList: [] }); // 确保 friendList 为一个空数组
      }
    }).catch(err => {
      console.error("查询用户失败:", err);
      this.setData({ friendList: [] }); // 确保 friendList 为一个空数组
    });
  },  
  
  deleteFriend: function(e) {
    const friendId = e.currentTarget.dataset.id; // 获取要删除的好友 ID
    
    // 删除当前用户的好友
    const currentUserUpdate = wx.cloud.database().collection('users').where({
      zhanghao: app.globalData.zhanghao
    }).update({
      data: {
        friends: wx.cloud.database().command.pull(friendId) // 从好友列表中移除
      }
    });
  
    // 删除好友的好友列表中的当前用户
    const friendUserUpdate = wx.cloud.database().collection('users').where({
      zhanghao: friendId
    }).update({
      data: {
        friends: wx.cloud.database().command.pull(app.globalData.zhanghao) // 从好友列表中移除当前用户
      }
    });
  
    // 同时执行两个更新操作
    Promise.all([currentUserUpdate, friendUserUpdate])
      .then(() => {
        wx.showToast({
          title: '已删除好友',
          icon: 'success'
        });
        this.loadFriends(); // 重新加载好友列表
      })
      .catch(err => {
        console.error("删除好友失败:", err);
      });
  },
  
  addFriend: function() {
    wx.navigateTo({
      url: '../addFriend/addFriend' // 跳转到添加好友页面
    });
    this.setData({
      showSidebar: false // 关闭边栏
    });
  },
// 打开侧边栏
openSidebar() {
  this.setData({
    isSidebarOpen: true
  });
},

// 关闭侧边栏
closeSidebar() {
  this.setData({
    isSidebarOpen: false
  });
},
  navigateToMessages: function() {
    wx.navigateTo({
      url: '../messages/messages'
    });
    this.setData({
      showSidebar: false // 关闭边栏
    });
  }
  
});
