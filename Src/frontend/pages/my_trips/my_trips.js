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
    default_show: { trip_name: '创建新行程', },
    themeColor: '#82af8a',
    zhanghao: ''
  },
    //背景颜色
    setTheme() {
      const app = getApp();
      const themeColor = app.globalData.themeColor;
      this.setData({
        themeColor: themeColor,
        gradientStyle: `background: linear-gradient(to bottom, ${themeColor}, #ffffff);`
      });
    },
  onScroll(e) {
    this.setData({
      scrollTop: e.detail.scrollTop, // 获取滚动位置
    });
    this.setTheme();
  },

  // 从数据库查询自己和朋友的行程数据
  getMyAndFriendsTrips() {
    const db = wx.cloud.database(); // 获取云数据库实例
    const app = getApp();           // 获取全局应用实例
    const zhanghao = app.globalData.zhanghao; // 获取当前账号的zhanghao

    if (zhanghao === '') {
      this.setData({
        my_trips: [this.data.default_show],
        filteredTrips: [this.data.default_show]
      });
      return;
    }

    // 查询用户的好友列表
    db.collection('users')
      .where({ zhanghao: zhanghao })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const friends = res.data[0].friends || []; // 获取当前用户的朋友列表

          // 扩展查询条件，包括当前用户和朋友的行程
          return db.collection('trips')
            .where({
              zhanghao: db.command.in([zhanghao, ...friends])  // 查询自己和朋友创建的行程
            })
            .field({
              trip_name: true      // 仅返回trip_name字段
            })
            .get();
        }
      })
      .then(res => {
        // 将查询结果中的trip_name集合保存到my_trips
        if (res) {
          this.setData({
            my_trips: [this.data.default_show].concat(res.data),
            filteredTrips: [this.data.default_show].concat(res.data),
            zhanghao
          });
        }
      })
      .catch(err => {
        console.error('查询失败:', err);
      });
  },

  /**
   * 生命周期函数--监听页面加载
   */

  onLoad(options) {
    this.getMyAndFriendsTrips();   // 加载自己和朋友的行程数据
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
  // 提交更新trip_name
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
      return;
    }

    if (newTripName === '创建新行程') {
      wx.showToast({
        title: '不能使用这个名称，换一个试试吧~',
        icon: 'none',
        duration: 1000
      });
      return;
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
        this.getMyAndFriendsTrips();
        this.setData({
          edit_trip_name: '',    // 隐藏输入框
          inputTripName: ''      // 清空输入
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({
          title: '名称重复了，换一个试试吧~',
          icon: 'none',
          duration: 1000
        });
      });
  },

  // 取消行程名称修改
  submitCancel() {
    this.setData( {edit_trip_name: '', inputTripName: ''} );
  },

  // 跳转到地图画布页面
  navigateToMapCanvas(event) {
    const tripName = event.currentTarget.dataset.tripName;
    wx.navigateTo({
      url: `/pages/map/map_index/map_index?trip_name=${tripName}`
    });
  },

  // 删除行程
  deleteTrip(e) {
    const app = getApp();
    const zhanghao = app.globalData.zhanghao;
    const tripName = e.currentTarget.dataset.tripName;

    const db = wx.cloud.database();

    // 弹出确认框
    wx.showModal({
      title: '确认删除',
      content: `您确定要删除行程"${tripName}"吗？删除后无法恢复！`,
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击了确认删除
          db.collection('trips')
            .where({
              trip_name: tripName,
              zhanghao: zhanghao
            })
            .remove()
            .then(() => {
              this.getMyAndFriendsTrips(); // 更新显示列表
              wx.showToast({
                title: '行程删除成功！',
                icon: 'success',
                duration: 1000
              });
            })
            .catch((err) => {
              console.error('行程删除失败！', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none',
                duration: 1000
              });
            });
        }
      }
    });
  },

  // 监听页面滚动
  onPageScroll(e) {
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
    this.getMyAndFriendsTrips();
    this.setTheme();
    const app = getApp();
    app.setTripMarkers("[]");
    app.setAllMarkers("[]");
    app.setSelfAddedMarkers("[]");
    app.setRecommendMarkers("[]");
    app.setCollectMarkers("[]");
    app.setFixedLatitude(30.512015580071605);
    app.setFixedLongitude(114.40807827869122);
    app.setMarkerId(0);
    app.setPaths("[]");
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