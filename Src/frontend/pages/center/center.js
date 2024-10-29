var app = getApp();
Page({
  data: {
    zhanghao: '', // 存储用户昵称
    isLoggedIn: false, // 登录状态
    avatarUrl: '', // 头像
  },

  onLoad: function() {
    this.updateUserInfo(); // 页面加载时更新用户信息
  },

  onShow: function() {
    this.updateUserInfo(); // 每次页面显示时更新用户信息
  },

  updateUserInfo: function() {
    const isLoggedIn = app.globalData.isLoggedIn; // 从全局变量获取登录状态
    const zhanghao = app.globalData.zhanghao; // 从全局变量获取账号
    const avatarUrl = app.globalData.avatarUrl;
    console.log("回到主界面，头像url是",app.globalData.avatarUrl);
    
    if (isLoggedIn && zhanghao) {
      // 查询数据库获取用户信息
      wx.cloud.database().collection('users').where({
        zhanghao: zhanghao // 使用账号定位用户
      }).get({
        success: (res) => {
          if (res.data.length > 0) {
            this.setData({
              isLoggedIn: true,
              zhanghao: zhanghao, // 存储账号
              avatarUrl: avatarUrl || 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png' // 获取用户的头像 URL
            });
          } else {
            // 用户未找到，设置默认头像
            this.setDefaultUserInfo(zhanghao);
          }
        },
        fail: () => {
          // 查询失败时设置默认头像
          this.setDefaultUserInfo(zhanghao);
        }
      });
    } else {
      // 未登录状态
      this.setDefaultUserInfo('');
    }
  },

  setDefaultUserInfo: function(zhanghao) {
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      zhanghao: zhanghao,
      avatarUrl: app.globalData.avatarUrl
    });
  },

  tapAvatar: function () {
    if (app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '../changeAvatar/changeAvatar', // 更换头像的页面路径
      });
    } else {
      wx.navigateTo({
        url: '../login/login',
      });
    }
  },

  confirmLogout: function() {
    wx.showModal({
      title: '确认退出',
      content: '你确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.Logout();
        }
      }
    });
  },

  Logout: function() {
    const isLoggedIn = app.globalData.isLoggedIn;
    if(isLoggedIn){
      // 清除全局变量
      app.globalData.isLoggedIn = false;
      app.globalData.zhanghao = '';
      app.globalData.avatarUrl = 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png'; // 设置默认头像
      app.globalData.loginTime = null;
  
      // 清除本地存储
      wx.removeStorageSync('isLoggedIn');
      wx.removeStorageSync('zhanghao');
      wx.removeStorageSync('avatarUrl');
      wx.removeStorageSync('loginTime');
  
      // 更新页面数据
      this.setDefaultUserInfo(''); // 设置默认用户信息
  
      // 提示用户已登出
      wx.showToast({
        title: '已登出',
        icon: 'none'
      });
  
      // 重定向到登录界面
      wx.redirectTo({
        url: '../center/center', // 导航到登录界面
      });      
    }else{
      // 提示用户未登录
      wx.showToast({
        title: '您还没有登陆呢！',
        icon: 'none'
      });
    }
  },

  // 导航到账户管理界面
  accountManage: function() {
    wx.navigateTo({
      url: '../accountManage/accountManage',
    });
  },

  // 导航到我的好友界面
  myFriends: function(){
    wx.navigateTo({
      url: '../myFriends/myFriends',
    });
  }
});
