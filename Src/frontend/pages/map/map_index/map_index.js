// pages/map/map_index/map_index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scale: 14,
    enable3d: false,
    showLocation: true,
    showCompass: true,
    showScale: true,
    enableOverlooking: false,
    enableZoom: true,
    enableScroll: true,
    enableRotate: false,
    drawPolygon: false,
    enableSatellite: false,
    enableTraffic: false,
    latitude: 30.512015580071605,
    longitude: 114.40807827869122,
    
    markers: [],
    collectMarkers: [],
    chosenFixedLatitude: 30.512015580071605,
    chosenFixedLongitude: 114.40807827869122,
    trip_name: '',
    markerId: 0,

    ctx: "",           // 画布上下文
    w: 0,              // 画布宽度
    h: 0,              // 画布高度
    paths: [],
    topLeft: {},
    latDiff: 0,
    lngDiff: 0,
    screenXDiff: 0,
    screenYDiff: 0,
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
  // 跳转绘画模式
  navigateToDrawMode() {
    wx.navigateTo({
      url: `/pages/map/map_canvas/map_canvas`
    });
  },

  // 跳转地点选择模式
  navigateToPlaceMode() {
    wx.navigateTo({
      url: `/pages/map/map_choose_places/map_choose_places`
    });
  },

  // 跳转日程模式
  navigateToTripMode() {
    wx.navigateTo({
      url: `/pages/map/trip/trip`
    });
  },

  // 保存地图
  saveMap() {
    // 获取全局变量
    const app = getApp();
    const { tripMarkers, collectMarkers, fixedLatitude, fixedLongitude, markerId, paths, zhanghao } = app.globalData;  // 如果是协作者，需改为修改collaborators
    const trip_name = this.data.trip_name;

    if (zhanghao === '') {
      wx.showToast({
        title: '保存失败，请先登录！',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    // 调用云数据库
    const db = wx.cloud.database();

    // 创建保存的数据对象
    const dataToSave = {
      tripMarkers,
      collectMarkers,
      fixedLatitude,
      fixedLongitude,
      markerId,
      paths
    };

    const jsonString = JSON.stringify(dataToSave);
    // console.log(`dataToSave 的字节量: ${jsonString.length} bytes`);

    if (jsonString.length > 174221) {
      wx.showToast({
        title: '数据量太大了，请删除一些绘画或行程地点再试试哦~',
        icon: 'none',
        duration: 3000
      });
    }

    // 更新数据到数据库
    db.collection('trips')
      .where({
        trip_name: trip_name,
        zhanghao: zhanghao
      })
      .update({
        data: dataToSave,
      })
      .then(() => {
        // 更新成功
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });
      })
      .catch((error) => {
        console.error('更新失败:', error);
        // 更新失败
        wx.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 1000
        });
      });
  },

  // 从数据库中获取行程数据
  getMapData(trip_name) {
    // 获取云数据库实例
    const db = wx.cloud.database();
    const app = getApp();
    const zhanghao = app.globalData.zhanghao;

    // 查询条件
    db.collection('trips').where({
      trip_name: trip_name,
      zhanghao: zhanghao
    }).get({
      success: res => {
        const mapData = res.data[0];
          
        // 将数据赋值给全局变量
        app.setTripMarkers(mapData.tripMarkers);
        app.setCollectMarkers(mapData.collectMarkers);
        app.setFixedLatitude(mapData.fixedLatitude);
        app.setFixedLongitude(mapData.fixedLongitude);
        app.setMarkerId(mapData.markerId);
        app.setPaths(mapData.paths);

        console.log(app.globalData);

        const tripMarkers = JSON.parse(app.globalData.tripMarkers);
        const collectMarkers = JSON.parse(app.globalData.collectMarkers);
        const fixedLat = app.globalData.fixedLatitude;
        const fixedLng = app.globalData.fixedLongitude;
        const paths = JSON.parse(app.globalData.paths);
        const markerId = app.globalData.markerId;

        this.setData({
          markers: tripMarkers,
          collectMarkers: collectMarkers,
          chosenFixedLongitude: fixedLng,
          chosenFixedLatitude: fixedLat,
          latitude: fixedLat,
          longitude: fixedLng,
          paths: paths,
          markerId: markerId
        });

        wx.showToast({
          title: '历史数据已获取',
          icon: 'success',
          duration: 1000
        });
      },
      fail: () => {
        wx.showToast({
          title: '数据获取失败',
          icon: 'none',
          duration: 1000
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 从数据库中获取行程数据
    const trip_name = options.trip_name;
    this.setData({ trip_name });
    this.getMapData(trip_name);

    const mapCtx = wx.createMapContext('map');
    this.setData({ mapCtx: mapCtx });

    // 初始化画布上下文
    wx.createSelectorQuery()
      .select('#myCanvas')   // 选择 Canvas 节点
      .fields({
        node: true,
        size: true,
      })
      .exec(this.init.bind(this));

    await this.setCurrentCoordinate();

    this.renderPaths(this.data.ctx);
  },

  init(res) {
    // 获取 Canvas 节点的宽度和高度（单位是 CSS 像素）
    const width = res[0].width;
    const height = res[0].height;
    this.setData({ w: width, h: height });

    const canvas = res[0].node;
    const ctx = canvas.getContext('2d');

    // 获取屏幕像素比，像素比表示屏幕上一个物理像素和一个 CSS 像素的比例
    // Canvas 的尺寸在物理像素上放大了，但在逻辑上（CSS 像素）保持不变
    const dpr = wx.getSystemInfoSync().pixelRatio;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);  // 根据设备像素比缩放

    this.setData({ ctx: ctx });
  },

  // 渲染全部路径
  renderPaths(ctx) {
    this.data.paths.forEach(path => {
      // 将路径的起点和终点经纬度转换为屏幕坐标
      const start = this.convertLatLngToScreen(path.startLng, path.startLat);
      const end = this.convertLatLngToScreen(path.endLng, path.endLat);
      ctx.strokeStyle = path.strokeStyle;
      ctx.lineWidth = path.lineWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // 绘制路径
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
  },

  // 获取地图左上角经纬度
  getTopLeftLatLng() {
    return new Promise((resolve, reject) => {
      const mapCtx = wx.createMapContext('map');
      
      mapCtx.getRegion({
        success: (res) => {
          const { southwest, northeast } = res;

          // 计算最左上角的经纬度
          const topLeftLat = northeast.latitude;
          const topLeftLng = southwest.longitude;

          // 返回结果
          // console.log({ latitude: topLeftLat, longitude: topLeftLng })
          resolve({ latitude: topLeftLat, longitude: topLeftLng });
        },
        fail: (err) => {
          // 返回错误
          reject(err);
        }
      });
    });
  },

  // 获取地图中心点经纬度
  getMapCenterLatLng() {
    return new Promise((resolve, reject) => {
      const mapCtx = wx.createMapContext('map');

      mapCtx.getCenterLocation({
        success: (res) => {
          const { latitude, longitude } = res;

          // 返回结果
          // console.log({ latitude: latitude, longitude: longitude })
          resolve({ latitude: latitude, longitude: longitude });
        },
        fail: (err) => {
          // 返回错误
          reject(err);
        }
      });
    });
  },

  // 将经纬度转换为屏幕坐标
  convertLatLngToScreen(lng, lat) {
    const resX = (lng - this.data.topLeft.longitude) / this.data.lngDiff * this.data.screenXDiff;
    const resY = (lat - this.data.topLeft.latitude) / this.data.latDiff * this.data.screenYDiff;

    return { x: resX, y: resY };
  },

  async setCurrentCoordinate() {
    try {
      // 获取地图左上角和中心的经纬度
      const [topLeft, center] = await Promise.all([this.getTopLeftLatLng(), this.getMapCenterLatLng()]);

      // 计算地图中心到左上角的经纬度差异
      const latDiff = center.latitude - topLeft.latitude;
      const lngDiff = center.longitude - topLeft.longitude;

      // 计算屏幕中心到左上角的屏幕坐标差异
      const screenXDiff = this.data.w / 2;
      const screenYDiff = this.data.h / 2;

      // 更新数据
      this.setData({
        topLeft: topLeft,
        latDiff: latDiff,
        lngDiff: lngDiff,
        screenXDiff: screenXDiff,
        screenYDiff: screenYDiff
      });
    } catch (err) {
      console.error("Error in setCurrentCoordinate:", err);
    };
  },

  // 地图拖动或缩放，重新绘制路径
  async onMapMove(e) {
    // console.log(e.type);
    if (e.type == "begin") {
      const ctx = this.data.ctx;
      ctx.clearRect(0, 0, this.data.w, this.data.h);  // 清空画布
    }
    else if (e.type == "end") {
      if (!this.data.hideDrawing) {
        await this.setCurrentCoordinate();
        this.renderPaths(this.data.ctx);
      }
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    // 传参
    const app = getApp();
    const tripMarkers = JSON.parse(app.globalData.tripMarkers);
    const collectMarkers = JSON.parse(app.globalData.collectMarkers);
    const fixedLat = app.globalData.fixedLatitude;
    const fixedLng = app.globalData.fixedLongitude;
    const paths = JSON.parse(app.globalData.paths);
    const markerId = app.globalData.markerId;
    this.setData({
      markers: tripMarkers,
      collectMarkers: collectMarkers,
      chosenFixedLongitude: fixedLng,
      chosenFixedLatitude: fixedLat,
      latitude: fixedLat,
      longitude: fixedLng,
      paths: paths,
      markerId: markerId
    });

    await this.setCurrentCoordinate();
    
    this.renderPaths(this.data.ctx);
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