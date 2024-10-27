// login.js
// 用户登录功能界面
// 获取应用实例
var app = getApp();

Page({
  data: {
    zhanghao: '',
    mima: '',
    loadingHidden: true,
  },
  
  // 获取输入的账号
  getZhanghao(event) {
    this.setData({
      zhanghao: event.detail.value
    });
  },

  // 获取输入的密码
  getMima(event) {
    this.setData({
      mima: event.detail.value
    });
  },

  // 点击登陆
  login() {
    let zhanghao = this.data.zhanghao;
    let mima = this.data.mima;
    console.log('账号', zhanghao, '密码', mima);

    if (zhanghao.length == 0) {
      wx.showToast({
        icon: 'none',
        title: '请输入账号！',
      });
      return;
    }

    // 登陆
    wx.cloud.database().collection('users').where({
      zhanghao: zhanghao
    }).get({
      success(res) {
        console.log("获取数据成功", res);

        if (res.data.length == 0) {
          // 用户未注册
          console.log("该用户未注册");
          wx.showToast({
            icon: 'none',
            title: '未注册!',
          });
          return;
        }

        let user = res.data[0];
        console.log("user", user);

        if (mima == user.mima) {
          console.log('登陆成功');
          
          // // 显示加载提示
          // wx.showLoading({
          //   title: '加载中...',
          //   mask: true // 遮罩层
          // });

          wx.showToast({
            title: '登录成功',
          });

          // 保存用户登陆状态到全局
          app.globalData.isLoggedIn = true;
          app.globalData.zhanghao = zhanghao; // 保存账号
          app.globalData.avatarUrl = user.avatar || 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png'; // 保存头像
          app.globalData.loginTime = Date.now();

          // 存储到本地，保留登录时限
          wx.setStorageSync('isLoggedIn', app.globalData.isLoggedIn);
          wx.setStorageSync('loginTime', app.globalData.loginTime);
          wx.setStorageSync('avatarUrl', app.globalData.avatarUrl);
          wx.setStorageSync('zhanghao', app.globalData.zhanghao);
          
          // // 设置延迟，2秒后执行重定向
          // setTimeout(() => {
          //   wx.hideLoading(); // 隐藏加载提示
          //   console.log("准备回到中心界面")
          //   wx.redirectTo({
          //     url: '../center/center',
          //   });
          // }, 2000); // 2000毫秒 = 2秒
          console.log("准备回到中心界面");
          // 2秒后跳转到登录页面
          // 返回 center 页面
          wx.navigateBack({
            delta: 1
          });
          console.log("按照计划你应该已经回到center界面了");
        } else {
          console.log('登陆失败');
          wx.showToast({
            icon: 'none',
            title: '账号或密码不正确',
          });
        }
      },
      fail(res) {
        console.log("获取数据失败", res);
      }
    });
  },

  // 点击 注册
  register: function() {
    wx.navigateTo({
      url: '../signup/signup'
    });
  },
  
  // // 找回密码
  // forget_password: function() {
  //   wx.redirectTo({
  //     url: '../getpassword/getpassword'
  //   });
  // }
});
