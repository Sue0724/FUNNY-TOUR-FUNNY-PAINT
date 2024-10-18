// pages/canvas/canvas.js
const app = getApp();

Page({
  data: {
    isDrawing: false,  // 当前是否正在绘画
    drawMode: false,   // 绘画编辑模式是否开启
    ctx: "",           // 画布上下文
    w: 0,              // 画布宽度
    h: 0,              // 画布高度
    lastX: 0,          // 上一次绘画时的 X 坐标
    lastY: 0,          // 上一次绘画时的 Y 坐标
    paths: [],         // 用于存储所有绘制路径的数组
    topLeft: 0,
    latDiff: 0,
    lngDiff: 0,
    screenXDiff: 0,
    screenYDiff: 0,
    lastLatLng: {},

    set_point: {
      longitude: '',
      latitude: '',
      address: ''
    },
    subKey: 'ZFJBZ-NDACQ-5X45Z-4HUVI-G2NZH-IDFMV',
    enable3d: false,
    showLocation: true,
    showCompass: false,
    enableOverlooking: false,
    enableZoom: true,
    enableScroll: true,
    enableRotate: false,
    drawPolygon: false,
    enableSatellite: false,
    enableTraffic: false,
    latitude: '30.512066262970436',
    longitude: '114.40805769497365',
    markers: [{
      'id': 1,
      'name': '立功路',
      'latitude': 30.875376759784945,
      'longitude': 120.12579917907715,
      'iconPath': '../../images/location.png',
      'width': 32,
      'height': 32
    },{
      'id': 2,
      'name': '曲园路',
      'latitude': 30.876813260148158,
      'longitude': 120.13030529022217,
      'iconPath': '../../images/location.png',
      'width': 32,
      'height': 32
    }],
    circles: [],
    polylines: [],
    polygons: [],
    showDialog: false,
    currentMarker: null,
    features: []
  },

  // 切换绘画模式
  toggleDrawMode() {
    this.setData({
      drawMode: !this.data.drawMode // 切换绘画模式的布尔值
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

  // 获取地图中心点经纬度的封装函数
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

  // 将屏幕坐标转换为经纬度
  convertScreenToLatLng(x, y) {
    const resLat = this.data.topLeft.latitude + y * this.data.latDiff / this.data.screenYDiff;
    const resLng = this.data.topLeft.longitude + x * this.data.lngDiff / this.data.screenXDiff;

    return { latitude: resLat, longitude: resLng }
  },

  // 将经纬度转换为屏幕坐标
  convertLatLngToScreen(lng, lat) {
    const resX = (lng - this.data.topLeft.longitude) / this.data.lngDiff * this.data.screenXDiff;
    const resY = (lat - this.data.topLeft.latitude) / this.data.latDiff * this.data.screenYDiff;

    return { x: resX, y: resY };
  },

  onLoad: async function () {
    // 初始化画布上下文
    wx.createSelectorQuery()
      .select('#myCanvas')   // 选择 Canvas 节点
      .fields({
        node: true,
        size: true,
      })
      .exec(this.init.bind(this));
    
      await this.setCurrentCoordinate();
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
      this.data.ctx.clearRect(0, 0, this.data.w, this.data.h);  // 清空画布
    }
    else if (e.type == "end") {
      await this.setCurrentCoordinate();
      this.renderPaths(this.data.ctx);
    }
  },

  // 渲染路径
  renderPaths(ctx) {
    ctx.strokeStyle = "#1b76c0";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    this.data.paths.forEach(path => {
      // 将路径的起点和终点经纬度转换为屏幕坐标
      const start = this.convertLatLngToScreen(path.startLng, path.startLat);
      const end = this.convertLatLngToScreen(path.endLng, path.endLat);

      // 绘制路径
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
  },

  // 用户触摸画布开始时触发（开始绘制）
  touchStart: function (e) {
    const x = e.touches[0].x;
    const y = e.touches[0].y;

    // 将屏幕坐标转换为经纬度并保存
    const latLng = this.convertScreenToLatLng(x, y);
    this.setData({
      isDrawing: true,
      lastLatLng: latLng,  // 保存起点的经纬度
    });
  },

  // 用户在画布上滑动手指时触发（绘制过程）
  touchMove: function (e) {
    const x = e.touches[0].x;  // 获取当前触摸点的 X 坐标
    const y = e.touches[0].y;  // 获取当前触摸点的 Y 坐标

    const latLng = this.convertScreenToLatLng(x, y);
    const newPath = {
      startLat: this.data.lastLatLng.latitude,
      startLng: this.data.lastLatLng.longitude,
      endLat: latLng.latitude,
      endLng: latLng.longitude
    };

    // 保存路径并更新
    const newPaths = this.data.paths.concat(newPath);
    this.setData({
      paths: newPaths,
      lastLatLng: latLng // 更新最后的经纬度
    }, () => {
      // 渲染绘制路径
      this.renderPaths(this.data.ctx);
    });
  },

  // 用户触摸结束时触发（结束绘制）
  touchEnd: function () {
    this.setData({
      isDrawing: false  // 停止绘画，但不关闭绘画模式
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