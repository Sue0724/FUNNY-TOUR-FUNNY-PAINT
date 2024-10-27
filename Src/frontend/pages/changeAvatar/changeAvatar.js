// changeAvatar.js
var app = getApp();

Page({
  data: {
    avatarUrl: '', // 存储头像 URL
  },

  // 选择图片并上传
  chooseImage() {
    wx.chooseMedia({
      count: 1, // 最多选择1张图片
      mediaType: ['image'], // 只选择图片
      sourceType: ['album', 'camera'], // 可从相册或相机选择
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath; // 获取选择的文件路径
        this.uploadImage(filePath);
      },
      fail: (err) => {
        console.error('选择图片失败', err);
      }
    });
  },

  // 上传图片到云存储
  uploadImage(filePath) {
    const cloudPath = `avatars/${Date.now()}-${Math.random() * 1000}.png`; // 生成唯一文件名
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        console.log('上传成功', res.fileID);
        this.setData({
          avatarUrl: res.fileID // 获取到头像 URL
        });

        // 更新数据库中的用户头像 URL
        const zhanghao = app.globalData.zhanghao; // 获取账号
        wx.cloud.database().collection('users').where({
          zhanghao: zhanghao // 使用账号定位用户
        }).update({
          data: {
            avatar: res.fileID // 更新头像 URL
          },
          success: () => {
            wx.showToast({
              title: '头像更换成功',
            });

            // 更新全局头像 URL
            app.globalData.avatarUrl = res.fileID;

            // 返回 center 页面
            wx.navigateBack({
              delta: 1
            });
          },
          fail: (err) => {
            console.error('更新头像失败', err);
          }
        });
      },
      fail: (err) => {
        console.error('上传失败', err);
      }
    });
  },

  onLoad() {
    const isLoggedIn = app.globalData.isLoggedIn;
    const zhanghao = app.globalData.zhanghao;

    if (isLoggedIn && zhanghao) {
      // 查询数据库获取用户信息
      wx.cloud.database().collection('users').where({
        zhanghao: zhanghao // 使用账号定位用户
      }).get({
        success: (res) => {
          if (res.data.length > 0) {
            const userInfo = res.data[0]; // 获取用户信息
            this.setData({
              avatarUrl: userInfo.avatar || 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png' // 获取用户的头像 URL，若不存在则设置默认头像
            });
          } else {
            // 用户未找到，设置默认头像
            this.setData({
              avatarUrl: 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png' // 设置默认头像的 URL
            });
          }
        },
        fail: (err) => {
          console.error('查询用户信息失败', err);
          // 查询失败时设置默认头像
          this.setData({
            avatarUrl: 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png' // 设置默认头像的 URL
          });
        }
      });
    } else {
      // 未登录，设置默认头像
      this.setData({
        avatarUrl: 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png' // 设置默认头像的 URL
      });
    }
  }
});
