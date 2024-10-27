// pages/changePwd/changePwd.js
var app = getApp();

Page({
  data: {
    currentPwd: '', // 当前密码
    newPwd: '', // 新密码
    confirmPwd: '', // 确认密码
  },

  // 获取当前密码
  getCurrentPwd(event) {
    this.setData({
      currentPwd: event.detail.value
    });
  },

  // 获取新密码
  getNewPwd(event) {
    this.setData({
      newPwd: event.detail.value
    });
  },

  // 获取确认密码
  getConfirmPwd(event) {
    this.setData({
      confirmPwd: event.detail.value
    });
  },

  // 点击确认修改密码
  confirmChangePwd() {
    const { currentPwd, newPwd, confirmPwd } = this.data;
    const zhanghao = app.globalData.zhanghao; // 获取全局变量中的账号
    const isLoggedIn = app.globalData.isLoggedIn;

    if (!isLoggedIn) {
      wx.showToast({
        title: '未登录，请先登录',
        icon: 'none'
      });
      return;
    }

    if (!currentPwd || !newPwd || !confirmPwd) {
      wx.showToast({
        title: '请填写所有密码字段',
        icon: 'none'
      });
      return;
    }

    if (newPwd !== confirmPwd) {
      wx.showToast({
        title: '新密码和确认密码不匹配',
        icon: 'none'
      });
      return;
    }

    if (newPwd.length < 6){
      wx.showToast({
        title: '密码长度不少于6位数',
        icon: 'none'
      })
    }

    if (newPwd == currentPwd){
      wx.showToast({
        title: '新密码不能和旧密码一样！',
        icon: 'none'
      });
      return;
    }

    // 查询数据库，检查当前密码是否正确
    wx.cloud.database().collection('users').where({
      zhanghao: zhanghao
    }).get({
      success: (res) => {
        if (res.data.length > 0) {
          const user = res.data[0];

          if (currentPwd === user.mima) {
            // 更新密码
            wx.cloud.database().collection('users').where({
              zhanghao: zhanghao
            }).update({
              data: {
                mima: newPwd
              },
              success: () => {
                wx.showToast({
                  title: '密码修改成功',
                  icon: 'success'
                });

                // 重定向回到用户中心
                wx.navigateBack({
                  delta: 1
                });
              },
              fail: (err) => {
                console.error('更新密码失败', err);
                wx.showToast({
                  title: '密码更新失败，请重试',
                  icon: 'none'
                });
              }
            });
          } else {
            wx.showToast({
              title: '输入的旧密码不正确！怀疑你盗号！',
              icon: 'none'
            });
          }
        } else {
          wx.showToast({
            title: '用户不存在',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('查询失败', err);
        wx.showToast({
          title: '查询用户失败，请重试',
          icon: 'none'
        });
      }
    });
  }
});
