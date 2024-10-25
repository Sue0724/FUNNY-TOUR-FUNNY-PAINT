// app.js

App({
  globalData: {
    userInfo: null,
    tripMarkers: "[]", // 初始化为空数组的 JSON 字符串
    fixedLatitude: 0,
    fixedLongitude: 0,
    // 新加的zxy的
    isLoggedIn: false,
    zhanghao: '',
    avatarUrl: 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png', // 设置默认头像
    loginTime: null, // 保存登陆时间    
  },

  onLaunch() {
    wx.cloud.init({
      env: "cloud-3ggj70dl61976054"
    });

    const curretTime = Date.now();
    const loginDuration = 24*60*60*1000; // 保留时间是一小时，单位为毫秒

    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const savedLoginTime = wx.getStorageSync('loginTime');
    const avatarUrl = wx.getStorageSync('avatarUrl');
    const zhanghao = wx.getStorageSync('zhanghao');
    if(isLoggedIn && savedLoginTime){
      // 检查是否在有效登录时间内
      if(curretTime - savedLoginTime < loginDuration){
        this.globalData.isLoggedIn = true;
        this.globalData.loginTime = savedLoginTime;
        this.globalData.avatarUrl = avatarUrl;
        this.globalData.zhanghao = zhanghao;
      }else{
        this.globalData.isLoggedIn = false;
        this.globalData.loginTime = null;
        this.globalData.avatarUrl = 'cloud://cloud-3ggj70dl61976054.636c-cloud-3ggj70dl61976054-1330345883/person.png';
        this.globalData.zhanghao = '';
      }
    } 
  },

  setTripMarkers(value) {
    this.globalData.tripMarkers = value;
  },
  setFixedLatitude(value) {
    this.globalData.fixedLatitude = value;
  },
  setFixedLongitude(value) {
    this.globalData.fixedLongitude = value;
  },
})
