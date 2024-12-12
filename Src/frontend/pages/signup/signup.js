// signup.js
// 用户注册页面
Page({
  data: {
    zhanghao: '',
    mima: '',
    mimaAgain: '',
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
  // 获取用户账号
  getZhangHao(event) {
    console.log('获取输入的账号', event.detail.value);
    this.setData({
      zhanghao: event.detail.value
    });
  },

  // 获取密码
  getMiMa(event) {
    console.log('获取输入的密码', event.detail.value);
    this.setData({
      mima: event.detail.value
    });
  },

  // 确认密码
  getMiMaAgain(event) {
    console.log('二次确认密码', event.detail.value);
    this.setData({
      mimaAgain: event.detail.value
    });
  },

  // 注册
  zhuce() {
    let zhanghao = this.data.zhanghao;
    let mima = this.data.mima;
    let mimaAgain = this.data.mimaAgain;

    console.log("点击了注册");
    console.log("zhanghao:", zhanghao);
    console.log("mima:", mima);
    console.log("mimaAgain:", mimaAgain);

    // 检查用户名是否已存在
    wx.cloud.database().collection('users').where({
      zhanghao: zhanghao
    }).get({
      success(res) {
        if (res.data.length > 0) {
          // 用户名已存在
          console.log('用户名已存在');
          wx.showToast({
            icon: 'none',
            title: '用户名已存在，无法注册！',
          });
          return;
        } else {
          // 校验账号
          if (zhanghao.length == 0) {
            wx.showToast({
              icon: 'none',
              title: '账号不能为空',
            });
            return;
          }

          // 校验密码
          if (mima.length < 6) {
            wx.showToast({
              icon: 'none',
              title: '密码至少6位',
            });
            return;
          }

          if (mima !== mimaAgain) {
            wx.showToast({
              icon: 'none',
              title: '两次输入的密码不同！',
            });
            return; // 这里需要加上 return，以便不继续执行注册
          }
        }

        // 注册功能的实现
        wx.cloud.database().collection('users').add({
          data: {
            zhanghao: zhanghao,
            mima: mima
          },
          success(res) {
            console.log('注册成功', res);

            // 显示加载提示
            wx.showLoading({
              title: '加载中...',
              mask: true // 遮罩层
            });

            wx.showToast({
              title: '注册成功',
            });

            // 设置延迟，2秒后执行重定向
            setTimeout(() => {
              wx.hideLoading(); // 隐藏加载提示
              wx.redirectTo({
                url: '../login/login',
              });
            }, 2000); // 2000毫秒 = 2秒
          },
          fail(res) {
            console.log('注册失败', res);
          }
        });
      },
      fail(res) {
        console.log('查询失败', res);
      }
    });
  }
});
