// pages/my_trips/my_trips.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scrollTop: 0, // 页面滚动位置
    searchQuery: '',      // 搜索输入的内容
    my_trips: [],         // 存放行程列表
    filteredTrips: [],    // 经过搜索过滤的行程列表
    edit_trip_name: '',   // 当前编辑的行程项
    inputTripName: '',    // 输入的行程名称
    default_show: { trip_name: '修改命名后创建新行程demo', },
  },
  onScroll(e) {
    this.setData({
      scrollTop: e.detail.scrollTop, // 获取滚动位置
    });
  },
  // 从数据库查询我创建的行程数据
  getMyTrips() {
    const db = wx.cloud.database(); // 获取云数据库实例
    const app = getApp();           // 获取全局应用实例
    const zhanghao = app.globalData.zhanghao; // 获取当前账号的zhanghao

    db.collection('trips')
      .where({
        zhanghao: zhanghao   // 查询条件
      })
      .field({
        trip_name: true      // 仅返回trip_name字段
      })
      .get()
      .then(res => {
        // 将查询结果中的trip_name集合保存到my_trips
        this.setData({
          my_trips: [this.data.default_show].concat(res.data),
          filteredTrips: [this.data.default_show].concat(res.data)
        });
      })
      .catch(err => {
        console.error('查询失败:', err);
      });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getMyTrips();   // 加载行程数据
  },

  // 搜索输入框内容变化时触发
  onSearchInputChange(e) {
    const searchQuery = e.detail.value;
    this.setData({ searchQuery });
    if (searchQuery === '') {
      this.setData({ filteredTrips: this.data.my_trips });
    }
    else {
      this.filterTrips();
    }
  },

  // 根据搜索内容过滤行程
  filterTrips() {
    const filteredTrips = this.data.my_trips.filter(trip => 
      trip.trip_name.includes(this.data.searchQuery)
    );
    this.setData({ filteredTrips });
  },

  // 显示输入框
  showEditInput(event) {
    const edit_trip_name = event.currentTarget.dataset.tripName;
    this.setData({ edit_trip_name, inputTripName: '' });
  },

  // 更新输入框内容
  onTripNameInputChange(event) {
    this.setData({ inputTripName: event.detail.value });
  },

  // 提交更新 trip_name
  submitTripName() {
    const app = getApp();
    const newTripName = this.data.inputTripName;
    const edit_trip_name = this.data.edit_trip_name;
    const zhanghao = app.globalData.zhanghao;

    if (edit_trip_name === newTripName) {
      return;
    }

    if (zhanghao === '') {
      wx.showToast({
        title: '修改失败，请先登录！',
        icon: 'none',
        duration: 1000
      });
    }

    const db = wx.cloud.database();

    // 更新数据库中的 trip_name 字段
    db.collection('trips')
      .where({
        trip_name: edit_trip_name,
        zhanghao: zhanghao
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          // 找到符合条件的记录，进行更新
          return db.collection('trips')
            .where({
              trip_name: edit_trip_name,
              zhanghao: zhanghao
            })
            .update({
              data: { 
                trip_name: newTripName
              }
            });
        } else {
          // 没有找到符合条件的记录，创建新记录
          return db.collection('trips').add({
            data: {
              trip_name: newTripName,
              zhanghao: zhanghao,
              tripMarkers: "[]",
              collectMarkers: "[]",
              fixedLat: 30.512015580071605,
              fixedLng: 114.40807827869122,
              markerId: 0,
              paths: "[]",
            }
          });
        }
      })
      .then(() => {
        // 更新或创建成功后，更新本地数据并隐藏输入框
        this.getMyTrips();
        this.setData({
          edit_trip_name: '',    // 隐藏输入框
          inputTripName: ''      // 清空输入
        });
      })
      .catch(err => console.error(err));
  },

  // 跳转到地图画布页面
  navigateToMapCanvas(event) {
    const tripName = event.currentTarget.dataset.tripName;
    wx.navigateTo({
      url: `/pages/map/map_index/map_index?trip_name=${tripName}`
    });
  },


  onPageScroll: function (e) {//监听页面滚动
    this.setData({
      scrollTop: e.scrollTop
    })
  },
  
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getMyTrips();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})