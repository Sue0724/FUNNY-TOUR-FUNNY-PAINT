// pages/map/map_choose_places/map_choose_places.js
const app = getApp();

Page({
  data: {
    showMarkers: true, // 需要保证在showMarkers=false时不放置点，可以设置为只有绘画模式下才能隐藏
    showPlaceList: false, // 是否显示地点列表

    mapCtx: "",
    latitude: 30.512015580071605, // 中心纬度
    longitude: 114.40807827869122, // 中心经度
    chosenFixedLatitude: 30.512015580071605, // 行程中心纬度
    chosenFixedLongitude: 114.40807827869122, // 行程中心经度
    searchQuery: '地点',

    subKey: 'ZFJBZ-NDACQ-5X45Z-4HUVI-G2NZH-IDFMV',
    scale: 14,
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

    markerId: -1,
    selectedMarkerId: -1,
    selectedType: 'allMarkers',
    markersIcons: {
      selfAddedMarkers: '../../../images/marker/pin_dark.png',
      recommendMarkers: '../../../images/marker/bubble_dark.png',
      tripCollectedMarkers: '../../../images/marker/collect_dark.png',
      tripPlanMarkers: '../../../images/marker/add_dark.png',
      allMarkers: '../../../images/marker/all.png'
    },
    searchIcon: '../../../images/search/search_dark.png',

    allMarkers: [], // 全部地点
    selfAddedMarkers: [],  // 自选地点
    recommendMarkers: [],  // 推荐地点
    tripCollectedMarkers: [],  // 当前日程包含的收藏地点
    tripPlanMarkers: [],  // 当前行程添加的地点
    markers: [],
    markers_backup: [],

    showDialog: false,
    currentMarker: null,
    actions: [
      { text: '查看详情', value: 'showDetail' },
      { text: '加入行程', value: 'add' },
      { text: '收藏地点', value: 'collect' },
      { text: '外部导航', value: 'outerNavigate' },
    ],
  },

  // 设定日程中心
  async chooseCenter() {
    const that = this;
    wx.chooseLocation({
      success(res) {
        const {latitude, longitude, name} = res;

        const newMarker = {
          id: 0,
          name: name,
          iconPath: '../../../images/marker/center.png',
          latitude: latitude,
          longitude: longitude,
          category: "行程中心",
          distance: 0,
          width: 50,
          height: 50,
          callout: {
            content: name.length > 8 ? name.substring(0, 8) + '...' : name,
            display: "BYCLICK",
            padding: 5,
            borderRadius: 5,
            bgColor: "#ffffff",
            color: "#000000",
            fontSize: 12
          }
        };

        // 删除 id 为 0 的 marker
        const updatedMarkers = that.data.markers.filter(marker => marker.id !== 0);
        const updatedAllMarkers = that.data.allMarkers.filter(marker => marker.id !== 0);

        const newId = Math.max(that.data.markerId, 0);
        if (newId > 0) {
          // 重新计算距离
          updatedAllMarkers.forEach(marker => {
            marker.distance = Math.round(that.getDistance(marker.latitude, marker.longitude, latitude, longitude));
          });
          that.data.selfAddedMarkers.forEach(marker => {
            marker.distance = Math.round(that.getDistance(marker.latitude, marker.longitude, latitude, longitude));
          });
          that.data.recommendMarkers.forEach(marker => {
            marker.distance = Math.round(that.getDistance(marker.latitude, marker.longitude, latitude, longitude));
          });
          that.data.tripCollectedMarkers.forEach(marker => {
            marker.distance = Math.round(that.getDistance(marker.latitude, marker.longitude, latitude, longitude));
          });
          that.data.tripPlanMarkers.forEach(marker => {
            marker.distance = Math.round(that.getDistance(marker.latitude, marker.longitude, latitude, longitude));
          });
        }

        // 更新纬度和经度
        that.setData({
          chosenFixedLatitude: latitude,
          chosenFixedLongitude: longitude,
          latitude: latitude,
          longitude: longitude,
          markerId: newId,
          markers: [newMarker].concat(updatedMarkers),
          allMarkers: [newMarker].concat(updatedAllMarkers)
        });
      }
    });
  },

  // 自选地点
  choosePlace() {
    const that = this;
    wx.chooseLocation({
      success(res) {
        console.log(res);
        const {latitude, longitude, name} = res;
        const newId = that.data.markerId + 1;
        const distance = that.getDistance(latitude, longitude, that.data.chosenFixedLatitude, that.data.chosenFixedLongitude); // 计算距离

        const newMarker = {
          id: newId,
          name: name,
          iconPath: '../../../images/marker/pin.png',
          latitude: latitude,
          longitude: longitude,
          distance: Math.round(distance),
          width: 30,
          height: 30,
          callout: {
            content: name.length > 8 ? name.substring(0, 8) + '...' : name,
            display: "BYCLICK",
            padding: 5,
            borderRadius: 5,
            bgColor: "#ffffff",
            color: "#000000",
            fontSize: 12
          }
        };

        // 更新纬度和经度
        that.setData({
          latitude: latitude,
          longitude: longitude,
          markerId: newId,
          markers: [newMarker].concat(that.data.markers),
          allMarkers: [newMarker].concat(that.data.allMarkers),
          selfAddedMarkers: [newMarker].concat(that.data.selfAddedMarkers)
        });
      }
    });
  },

  // 监听搜索框输入并保存到 searchQuery 中
  onSearchInput(event) {
    this.setData({
      searchQuery: event.detail.value
    });
  },

  // 处理搜索按钮点击事件（搜索周边）
  onSearchNearbySubmit() {
    // 更换图标
    this.setData({
      searchIcon: '../../../images/search/search.png',
    });

    if (this.data.searchQuery) {
      this.onSearchNearby();
    }

    // 更换图标
    this.setData({
      searchIcon: '../../../images/search/search_dark.png',
    });
  },

  // 切换是否显示地点标记
  toggleShowMarkers() {
    this.setData({
      showMarkers: !this.data.showMarkers,
    })

    if (this.data.showMarkers) {
      this.setData({
        markers: this.data.markers_backup
      });
    }
    else {
      this.setData({ 
        markers_backup: this.data.markers,
        markers: [],
        currentMarker: null,
      });
    }
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
        [`markersIcons.${this.data.selectedType}`]: this.getDarkIcon(this.data.selectedType),
        [`markersIcons.allMarkers`]: this.getLightIcon('allMarkers'),
        selectedType: 'allMarkers',
        markers: this.data.allMarkers,
        selectedMarkerId : -1
      });
      const mapCtx = wx.createMapContext('map');
      mapCtx.moveToLocation({
        latitude: this.data.chosenFixedLatitude,  // 恢复为固定的纬度
        longitude: this.data.chosenFixedLongitude // 恢复为固定的经度
      });
    }
  },

  // 计算两个经纬度之间的距离（单位：米）
  getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // 地球半径，单位为米
    const rad = Math.PI / 180;
    const φ1 = lat1 * rad;
    const φ2 = lat2 * rad;
    const Δφ = (lat2 - lat1) * rad;
    const Δλ = (lng2 - lng1) * rad;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 距离，单位为米
  },

  onLoad: function () {
    const mapCtx = wx.createMapContext('map');
    this.setData({ mapCtx: mapCtx });

    const app = getApp();
    const tripMarkers = JSON.parse(app.globalData.tripMarkers || '[]'); // 确保解析
    const fixedLat = app.globalData.fixedLatitude;
    const fixedLng = app.globalData.fixedLongitude;

    this.setData({
      markers: tripMarkers,
      tripPlanMarkers: tripMarkers,
      chosenFixedLongitude: fixedLng,
      chosenFixedLatitude: fixedLat,
      latitude: fixedLat,
      longitude: fixedLng
    });
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
    const app = getApp();
    // 如果需要在页面显示时更新数据，可以在这里获取最新的全局变量
    const markers = JSON.parse(app.globalData.tripMarkers || '[]');
    const fixedLatitude = app.globalData.fixedLatitude;
    const fixedLongitude = app.globalData.fixedLongitude;

    // 进行相应的更新
    this.setData({
      tripMarkers: markers,
      setFixedLatitude: fixedLatitude,
      setFixedLongitude: fixedLongitude,
    });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    const app = getApp();
    // 将 tripMarkers 转换为 JSON 字符串并存储
    app.setTripMarkers(JSON.stringify(this.data.tripPlanMarkers));
    app.setFixedLatitude(this.data.chosenFixedLatitude);
    app.setFixedLongitude(this.data.chosenFixedLongitude);
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

  },

  // 切换不同类别的地点
  switchMarkers(e) {
    const type = e.currentTarget.dataset.type;
    const preType = this.data.selectedType;
    let selectedMarkers = [];
    
    switch(type) {
      case 'allMarkers':
        selectedMarkers = this.data.allMarkers;
        break;
      case 'selfAddedMarkers':
        selectedMarkers = this.data.selfAddedMarkers;
        break;
      case 'recommendMarkers':
        selectedMarkers = this.data.recommendMarkers;
        break;
      case 'tripCollectedMarkers':
        selectedMarkers = this.data.tripCollectedMarkers;
        break;
      case 'tripPlanMarkers':
        selectedMarkers = this.data.tripPlanMarkers;
        break;
    }
    
    this.setData({
      [`markersIcons.${preType}`]: this.getDarkIcon(preType),
      [`markersIcons.${type}`]: this.getLightIcon(type),
      selectedType: type,
      markers: selectedMarkers
    });
  },

  getLightIcon(type) {
    const icons = {
      selfAddedMarkers: '../../../images/marker/pin.png',
      recommendMarkers: '../../../images/marker/bubble.png',
      tripCollectedMarkers: '../../../images/marker/collect.png',
      tripPlanMarkers: '../../../images/marker/add.png',
      allMarkers: '../../../images/marker/all.png'
    };
    return icons[type];
  },

  getDarkIcon(type) {
    const icons = {
      selfAddedMarkers: '../../../images/marker/pin_dark.png',
      recommendMarkers: '../../../images/marker/bubble_dark.png',
      tripCollectedMarkers: '../../../images/marker/collect_dark.png',
      tripPlanMarkers: '../../../images/marker/add_dark.png',
      allMarkers: '../../../images/marker/all_dark.png'
    };
    return icons[type];
  },

  // 处理地图点击（地图选点）
  onTapMap(e) {
    if (this.data.showPlaceList){
      this.toggleShowPlaceList();
    }

    const latitude = e.detail.latitude;
    const longitude = e.detail.longitude;
    const newId = this.data.markerId + 1;

    const key = this.data.subKey;
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=${key}&get_poi=0`;

    wx.request({
      url: url,
      method: 'GET',
      success: res => {
        const distance = this.getDistance(latitude, longitude, this.data.chosenFixedLatitude, this.data.chosenFixedLongitude); // 计算距离
        const address = res.data.result.formatted_addresses.recommend;

        const newMarker = {
          id: newId,
          name: address,
          iconPath: '../../../images/marker/pin.png',
          latitude: latitude,
          longitude: longitude,
          distance: Math.round(distance),
          width: 30,
          height: 30,
          callout: {
            content: address.length > 8 ? address.substring(0, 8) + '...' : address,
            display: "BYCLICK",
            padding: 5,
            borderRadius: 5,
            bgColor: "#ffffff",
            color: "#000000",
            fontSize: 12
          }
        };

        this.setData({
          markerId: newId,
          selfAddedMarkers: [newMarker].concat(this.data.selfAddedMarkers),
          markers: [newMarker].concat(this.data.markers),
          allMarkers: [newMarker].concat(this.data.allMarkers)
        });
      },
      fail: err => {
        console.error(err);
      }
    });
  },

  // 处理poi点击
	onTapPoi (e) {
    if (this.data.showPlaceList){
      this.toggleShowPlaceList();
    }

		const name = e.detail.name;
		const latitude = e.detail.latitude;
		const longitude = e.detail.longitude;
    const newId = this.data.markerId + 1;

    const distance = this.getDistance(latitude, longitude, this.data.chosenFixedLatitude, this.data.chosenFixedLongitude); // 计算距离

    const newMarker = {
      id: newId,
      name: name,
      iconPath: '../../../images/marker/pin.png',
      latitude: latitude,
      longitude: longitude,
      distance: Math.round(distance),
      width: 30,
      height: 30,
      callout: {
        content: name.length <= 8 ? name : name.substring(0, 8) + '...',
        display: "BYCLICK",
        padding: 5,
        borderRadius: 5,
        bgColor: "#ffffff",
        color: "#000000",
        fontSize: 12
      }
    };

		this.setData({
			markerId: newId,
      selfAddedMarkers: [newMarker].concat(this.data.selfAddedMarkers),
      markers: [newMarker].concat(this.data.markers),
      allMarkers: [newMarker].concat(this.data.allMarkers)
		});
	},

  // 周边搜索功能
  searchNearbyWithQuery(lat, lng, keyword) {
    const latitude = this.data.chosenFixedLatitude;
    const longitude = this.data.chosenFixedLongitude;

    const radius = 1000; // 搜索半径，单位米
    const key = this.data.subKey;
    const encodedKeyword = encodeURI(keyword); // URL编码关键字
    const url = `https://apis.map.qq.com/ws/place/v1/search?boundary=nearby(${lat},${lng},${radius})&keyword=${encodedKeyword}&page_size=10&page_index=1&key=${key}`;
    // const url = `https://apis.map.qq.com/ws/place/v1/explore?boundary=nearby(${latitude},${longitude},${radius})&policy=${policy}&page_size=${page_size}&page_index=${page_index}&key=${key}`;

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        if (res.data.status === 0) {
          const searchResults = res.data.data;

          // 先保存当前的 markerId
          let currentMarkerId = this.data.markerId;

          const newMarkers = searchResults.map(place => {
            const distance = this.getDistance(latitude, longitude, place.location.lat, place.location.lng); // 计算距离

            return {
              id: ++currentMarkerId,
              name: place.title,
              category: place.category,
              latitude: place.location.lat,
              longitude: place.location.lng,
              distance: Math.round(distance),
              iconPath: '../../../images/marker/bubble.png',
              width: 30,
              height: 30,
              callout: {
                content: place.title.length <= 8 ? place.title : place.title.substring(0, 8) + '...',
                display: "BYCLICK",
                padding: 5,
                borderRadius: 5,
                bgColor: "#ffffff",
                color: "#000000",
                fontSize: 12
              }
            };
          });

          newMarkers.sort((a, b) => b.id - a.id);

          this.setData({
            markerId: currentMarkerId,
            recommendMarkers: newMarkers.concat(this.data.recommendMarkers),
            markers: newMarkers.concat(this.data.markers),
            allMarkers: newMarkers.concat(this.data.allMarkers)
          });
        } else {
          console.error('搜索失败:', res.data.message);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
      }
    });
  },

  // 调用周边搜索功能
  onSearchNearby() {
    if (this.data.showPlaceList){
      this.toggleShowPlaceList();
    }

    const lat = this.data.chosenFixedLatitude;
    const lng = this.data.chosenFixedLongitude;
    const keyword = this.data.searchQuery;
    this.searchNearbyWithQuery(lat, lng, keyword);
  },

  // 地点点击事件
  onPlaceTap(e) {
    const id = e.currentTarget.dataset.id; // 获取点击的 marker 的 id
    const marker = this.data.markers.find(item => item.id === id); // 查找对应的 marker
    console.log(this.data.markers);
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

  // 处理点击标注
  onMarkerTap(e) {
    const marker = this.data.markers.find(item => item.id == e.markerId);
    marker && this.setData({
      currentMarker: marker
    });
    this.onShowDialog();
  },

  // 处理操作菜单对话框操作点击
  onActionTap(e) {
    const { value } = e.detail;
    switch (value) {
      case 'collect':
        this.collectPlace();
        break;
      case 'add':
        this.addPlace();
        break;
      case 'outerNavigate':
        this.outerNavigate();
        break;
      case 'showDetail':
        this.showDetail();
        break;
    }
    this.setData({ showDialog: false });
  },

  // 收藏地点
  collectPlace() {
    this.setData({
      tripCollectedMarkers: [this.data.currentMarker].concat(this.data.tripCollectedMarkers)
    });
  },

  // 加入行程
  addPlace() {
    this.setData({
      tripPlanMarkers: [this.data.currentMarker].concat(this.data.tripPlanMarkers)
    });
  },

  // 跳转外部导航
  outerNavigate() {
    const latitude = this.data.currentMarker.latitude;
    const longitude = this.data.currentMarker.longitude;
    wx.openLocation({
      latitude,
      longitude,
      scale: 18
    });
  },

  // 查看地点详情（跳转大众点评小程序）
  showDetail() {
    const markerName = this.data.currentMarker.name;
    wx.navigateTo({
      url: `/pages/map_choose_places/place_detail/place_detail?name=${encodeURIComponent(markerName)}` // 构建跳转 URL，并编码参数
    });
  },

  // 显示对话框
  onShowDialog() {
    this.setData({ showDialog: true });
  },

  // 隐藏对话框
  onHideDialog() {
    this.setData({ showDialog: false });
  },
})