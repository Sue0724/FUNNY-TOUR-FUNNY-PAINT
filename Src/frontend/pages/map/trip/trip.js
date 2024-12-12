// pages/map/trip/trip.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mapCtx: "",
    latitude: 30.512015580071605, // 中心纬度
    longitude: 114.40807827869122, // 中心经度
    chosenFixedLatitude: 30.512015580071605, // 行程中心纬度
    chosenFixedLongitude: 114.40807827869122, // 行程中心经度

    subKey: 'ZFJBZ-NDACQ-5X45Z-4HUVI-G2NZH-IDFMV',
    scale: 14,
    markers: [],
    defaultScale: 14,   // 默认地图缩放等级
    selectedScale: 20,  // 地点点击后的缩放等级
    enable3d: false,
    showLocation: true,
    showCompass: true,
    showScale: true,
    enableOverlooking: false,
    enableZoom: true,
    enableScroll: true,
    enableRotate: true,
    drawPolygon: false,
    enableSatellite: false,
    enableTraffic: false,

    showPlaceList: false, // 是否显示地点列表
    selectedMarkerId: -1,
    editId: -1,
    editId2: -1,
    newDayValue: '',     // 输入框的日程值
    newDaySeqValue: '',
    showDialog: false,
    currentMarker: null,
    actions: [
      { text: '修改所属日程', value: 'editDay' },
      { text: '修改游览顺序', value: 'editDaySeq' },
      { text: '删除日程地点', value: 'delete' },
      { text: '设为导航起点', value: 'setStart' },
      { text: '设为导航终点', value: 'setEnd' },
    ],

    startMarker: null,
    endMarker: null,
    polylines: [],
    distance: 0,
    duration: 0,
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
  // 切换是否显示地点列表
  toggleShowPlaceList() {
    this.setData({
      showPlaceList: !this.data.showPlaceList,
    });

    if (!this.data.showPlaceList) {
      // 隐藏地点列表时，恢复默认地图缩放和中心点，恢复默认图标
      this.setData({
        scale: this.data.defaultScale,
        latitude: this.data.chosenFixedLatitude,
        longitude: this.data.chosenFixedLongitude,
        selectedMarkerId : -1
      });
      const mapCtx = wx.createMapContext('map');
      mapCtx.moveToLocation({
        latitude: this.data.chosenFixedLatitude,  // 恢复为固定的纬度
        longitude: this.data.chosenFixedLongitude // 恢复为固定的经度
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 传参
    const app = getApp();
    const tripMarkers = JSON.parse(app.globalData.tripMarkers);
    const fixedLat = app.globalData.fixedLatitude;
    const fixedLng = app.globalData.fixedLongitude;
    this.setData({
      markers: tripMarkers,
      chosenFixedLongitude: fixedLng,
      chosenFixedLatitude: fixedLat,
      latitude: fixedLat,
      longitude: fixedLng,
    });
  },

  // 地点点击事件
  onPlaceTap(e) {
    const id = e.currentTarget.dataset.id; // 获取点击的 marker 的 id
    const marker = this.data.markers.find(item => item.id === id); // 查找对应的 marker
    const latitude = marker.latitude;
    const longitude = marker.longitude;

    const mapCtx = wx.createMapContext('map');
    this.setData({
      selectedMarkerId: id,
      scale: this.data.selectedScale,
      latitude: latitude,
      longitude: longitude
    });
    mapCtx.moveToLocation({
      latitude: latitude,
      longitude: longitude,
    });
  },

  // 处理操作菜单对话框操作点击
  onActionTap(e) {
    const { value } = e.detail;
    switch (value) {
      case 'editDay':
        this.editDay();
        break;
      case 'delete':
        this.delete();
        break;
      case 'setStart':
        this.setStart();
        break;
      case 'setEnd':
        this.setEnd();
        break;
      case 'editDaySeq':
        this.editDaySeq();
        break;
    }
    this.setData({ showDialog: false });
  },

  // 监听输入框的变化
  onDayInputChange(e) {
    this.setData({ newDayValue: e.detail.value });
  },

  // 提交输入并更新 day 属性
  submitDay() {
    const { markers, currentMarker } = this.data;
    const newDayValue = parseInt(this.data.newDayValue);
    const updatedMarkers = markers.map(marker => {
      if (marker.id === currentMarker.id) {
        return { ...marker, day: newDayValue };
      }
      return marker;
    }).sort((a, b) => {
      if (a.day === b.day) {
        return a.daySeq - b.daySeq; // 如果 day 相同，按 daySeq 排序
      }
      return a.day - b.day; // 否则按 day 排序
    });

    this.setData({
      markers: updatedMarkers,
      newDayValue: '',    // 清空输入值
      editId: -1,  // 隐藏输入框
    });
  },

  // 编辑所属日程
  editDay() {
    this.setData({ editId: this.data.currentMarker.id});
  },

  // 监听输入框的变化
  onDaySeqInputChange(e) {
    this.setData({ newDaySeqValue: e.detail.value });
  },

  // 提交输入并更新 daySeq 属性
  submitDaySeq() {
    const { markers, currentMarker } = this.data;
    const newDaySeqValue = parseInt(this.data.newDaySeqValue);
    const updatedMarkers = markers.map(marker => {
      if (marker.id === currentMarker.id) {
        return { ...marker, daySeq: newDaySeqValue };
      }
      return marker;
    }).sort((a, b) => {
      if (a.day === b.day) {
        return a.daySeq - b.daySeq; // 如果 day 相同，按 daySeq 排序
      }
      return a.day - b.day; // 否则按 day 排序
    });

    this.setData({
      markers: updatedMarkers,
      newDaySeqValue: '',    // 清空输入值
      editId2: -1,  // 隐藏输入框
    });
  },

  // 编辑游览顺序
  editDaySeq() {
    this.setData({ editId2: this.data.currentMarker.id});
  },

  // 删除日程地点
  delete() {
    const { markers, currentMarker } = this.data;
    const updatedMarkers = markers.filter(marker => marker.id !== currentMarker.id);
    this.setData({ markers: updatedMarkers, currentMarker: null, selectedMarkerId: -1 });
  },

  // 设为导航起点
  setStart() {
    this.setData({ startMarker: this.data.currentMarker });
  },

  // 设为导航终点
  setEnd() {
    this.setData({ endMarker: this.data.currentMarker });
  },

  // 步行
  navigateWalking() {
    this.navigate('walking');
  },

  // 自行车
  navigateBicycling() {
    this.navigate('bicycling');
  },

  // 电动车
  navigateEbicycling() {
    this.navigate('ebicycling');
  },
  
  // 驾车
  navigateDriving() {
    this.navigate('driving');
  },

  // 显示两点步行路线规划
  navigate(type) {
    const { startMarker, endMarker, subKey } = this.data;
    if (!startMarker || !endMarker) {
      wx.showToast({
        title: '请先选择起点和终点',
        icon: 'none'
      });
      return;
    }

    const url = `https://apis.map.qq.com/ws/direction/v1/${type}/?from=${startMarker.latitude},${startMarker.longitude}&to=${endMarker.latitude},${endMarker.longitude}&key=${subKey}`;

    wx.request({
      url,
      success: (res) => {
        if (res.data.status === 0) {
          const route = res.data.result.routes[0];
          const distance = route.distance;
          const duration = route.duration;
          
          // 解压 polyline
          const decodedPolyline = this.decodePolyline(route.polyline);
          const polylines = [{
            points: decodedPolyline,
            color: "#FF0000DD",
            width: 4
          }];

          // 更新地图显示
          this.setData({
            polylines,
            distance,
            duration
          });
        } else {
          wx.showToast({
            title: res.data.message || '获取路线失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
      }
    });
  },

  decodePolyline(coors) {  
    // 创建一个存放解压后坐标的数组
    const decodedCoords = [];
    
    // 将前两个坐标直接添加
    decodedCoords.push({latitude: coors[0], longitude: coors[1]});
  
    // 解压其余坐标
    for (let i = 2; i < coors.length - 1; i += 2) {
      // 计算新的坐标
      coors[i] = coors[i - 2] + coors[i] / 1000000;
      coors[i + 1] = coors[i - 1] + coors[i + 1] / 1000000;
      decodedCoords.push({latitude: coors[i], longitude: coors[i + 1]});
    }
  
    return decodedCoords;
  },  

  // 处理点击标注
  onMarkerTap(e) {
    const marker = this.data.markers.find(item => item.id == e.markerId);
    marker && this.setData({
      currentMarker: marker
    });
    this.onShowDialog();
  },

  // 显示对话框
  onShowDialog() {
    this.setData({ showDialog: true });
  },

  // 隐藏对话框
  onHideDialog() {
    this.setData({ showDialog: false });
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
    const app = getApp();
    // 将 tripMarkers 转换为 JSON 字符串并存储
    app.setTripMarkers(JSON.stringify(this.data.markers));
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