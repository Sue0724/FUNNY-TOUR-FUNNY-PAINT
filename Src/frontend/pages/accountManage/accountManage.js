// accountManage.js
// 账户管理界面，包括修改密码和账户切换
var app = getApp();

Page({

  data: {themeColor: '#82af8a'},

  onLoad(options) {},

  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

  onPullDownRefresh() {},

  onReachBottom() {},

  onShareAppMessage() {},

  //背景颜色
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

  // 修改密码函数
  changePassword() {
    wx.navigateTo({
      url: '../changePwd/changePwd' // 修改密码页面路径
    });
  },

  // 切换账户函数
  switchAccount() {
    wx.showModal({
      title: '确认切换账户',
      content: '您确定要切换账户吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户确认切换账户
          // 清除全局变量
          app.globalData.isLoggedIn = false;
          app.globalData.zhanghao = '';
          app.globalData.avatarUrl = 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png'; // 设置默认头像
          app.globalData.loginTime = null;

          // 清除本地存储，跟退出登录操作一样
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('zhanghao');
          wx.removeStorageSync('avatarUrl');
          wx.removeStorageSync('loginTime');

          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 2000
          });

          // 2秒后跳转到登录页面
          setTimeout(() => {
            wx.redirectTo({
              url: '../login/login' // 登录页面路径
            });
          }, 2000);
        } else {
          // 用户取消切换账户
          console.log('用户取消切换账户');
        }
      }
    });
  }
});
