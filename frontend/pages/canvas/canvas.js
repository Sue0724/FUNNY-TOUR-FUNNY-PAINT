// pages/canvas/canvas.js
const app = getApp();

Page({
  data: {
    isDrawing: false,  // 当前是否正在绘画
    drawMode: false,   // 绘画编辑模式是否开启
    hideDrawing: false, // 是否隐藏绘画

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
    lastScreenXY: {},
    currentTool: 'brush', // 默认工具为画笔

    showNearbyPlaces: false,
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
    latitude: 0, // 中心纬度
    longitude: 0, // 中心经度
    moveStep: 0.001, // 基础移动步长
    moveInterval: null, // 定时器的引用
    markers: [],
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
      drawMode: !this.data.drawMode,
      currentTool: 'brush' // 进入绘画模式时重置工具为画笔
    });
  },

  // 切换是否显示周边地点
  toggleShowNearbyPlaces() {
    this.setData({
      showNearbyPlaces: !this.data.showNearbyPlaces,
    })

    if (this.data.showNearbyPlaces) {
      this.searchNearbyPlaces();
    }
    else {
      this.setData({ markers: [], currentMarker: null });
    }
  },

  // 切换是否隐藏绘画
  toggleHideDrawing() {
      this.setData({
        hideDrawing: !this.data.hideDrawing,
      })

      const ctx = this.data.ctx;
      if (this.data.hideDrawing) {
        ctx.clearRect(0, 0, this.data.w, this.data.h);  // 清空画布
      }
      else {
        this.renderPaths(ctx);
      }
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

  // 开始移动（按下按钮时触发）
  startMove(direction) {
    const mapCtx = wx.createMapContext('map');
    this.data.moveInterval = setInterval(() => {
      let newLatitude = this.data.latitude;
      let newLongitude = this.data.longitude;

      // 根据方向更新经纬度
      switch (direction) {
        case 'up':
          newLatitude -= this.data.moveStep;
          break;
        case 'down':
          newLatitude += this.data.moveStep;
          break;
        case 'left':
          newLongitude += this.data.moveStep;
          break;
        case 'right':
          newLongitude -= this.data.moveStep;
          break;
      }

      this.setData({
        latitude: newLatitude,
        longitude: newLongitude
      }, () => {
        // 移动地图到新的位置
        mapCtx.moveToLocation({
          latitude: this.data.latitude,
          longitude: this.data.longitude
        });
      });
    }, 100); // 每 100ms 移动一次
  },

  // 停止移动（松开按钮时触发）
  stopMove() {
    clearInterval(this.data.moveInterval); // 停止定时器
    this.setData({
      moveInterval: null
    });
  },

  // 左移地图
  moveLeft() {
    this.startMove('left');
  },

  // 右移地图
  moveRight() {
    this.startMove('right');
  },

  // 上移地图
  moveUp() {
    this.startMove('up');
  },

  // 下移地图
  moveDown() {
    this.startMove('down');
  },

  onLoad: async function () {
    // 获取用户当前位置
    wx.getLocation({
      type: 'gcj02',
      success: async (res) => {
        const { latitude, longitude } = res;

        // 更新纬度和经度
        this.setData({
          latitude: latitude,
          longitude: longitude,
        });

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
      fail: (err) => {
        console.error("获取当前位置失败:", err);
      }
    });
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
      const ctx = this.data.ctx;
      ctx.clearRect(0, 0, this.data.w, this.data.h);  // 清空画布
    }
    else if (e.type == "end") {
      await this.setCurrentCoordinate();
      this.renderPaths(this.data.ctx);
    }
  },

  // 渲染全部路径
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

  // 根据当前工具渲染新增路径
  renderNewPath(ctx, x, y) {
    ctx.strokeStyle = "#1b76c0"; // 画笔颜色
    ctx.lineWidth = 5;
    // ctx.lineCap = "round"; // 设置线条端点样式
    // ctx.lineJoin = "round"; // 设置线条连接样式

    // 绘制路径
    ctx.beginPath();
    ctx.moveTo(this.data.lastScreenXY.x, this.data.lastScreenXY.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  },

  // 检测并擦除接触的路径
  erasePath(x, y) {
    const tolerance = 10; // 碰撞检测的容忍度
    const newPaths = this.data.paths.filter(path => {
        const start = this.convertLatLngToScreen(path.startLng, path.startLat);
        const end = this.convertLatLngToScreen(path.endLng, path.endLat);

        // 计算线段到点的距离
        const dist = this.pointToLineDistance({ x, y }, start, end);
        return dist > tolerance; // 仅保留未接触的路径
    });

    this.setData({ paths: newPaths });
    const ctx = this.data.ctx;
    ctx.clearRect(0, 0, this.data.w, this.data.h); // 清空画布
    this.renderPaths(this.data.ctx); // 重新渲染路径
  },

  // 计算点到线段的距离
  pointToLineDistance(point, start, end) {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = len_sq !== 0 ? dot / len_sq : -1;

    let xx, yy;

    if (param < 0) {
        xx = start.x;
        yy = start.y;
    } else if (param > 1) {
        xx = end.x;
        yy = end.y;
    } else {
        xx = start.x + param * C;
        yy = start.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy); // 返回距离
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
      lastScreenXY: {x: x, y: y}
    });
  },

  // 用户在画布上滑动手指时触发（绘制或擦除过程）
  touchMove: function (e) {
    const x = e.touches[0].x;  // 获取当前触摸点的 X 坐标
    const y = e.touches[0].y;  // 获取当前触摸点的 Y 坐标

    if (this.data.currentTool === 'eraser') {
      this.erasePath(x, y);
    } else {
      // 渲染新增绘制路径
      this.renderNewPath(this.data.ctx, x, y);

      const latLng = this.convertScreenToLatLng(x, y);
      const newPath = {
        startLat: this.data.lastLatLng.latitude,
        startLng: this.data.lastLatLng.longitude,
        endLat: latLng.latitude,
        endLng: latLng.longitude
      };

      // 保存路径并更新
      this.data.paths.push(newPath); // 直接推入数组，减少setData调用
      this.setData({
        lastLatLng: latLng,
        lastScreenXY: {x: x, y: y}
      });
    }
  },

  // 用户触摸结束时触发（结束绘制）
  touchEnd: function () {
    this.setData({
      isDrawing: false  // 停止绘画，但不关闭绘画模式
    });
  },

  // 清空画布
  clearCanvas() {
    if (!this.data.drawMode) return;
    const ctx = this.data.ctx;
    ctx.clearRect(0, 0, this.data.w, this.data.h); // 清空画布
    this.setData({ paths: [] }); // 清空路径记录
  },

  // 选择画笔工具
  selectBrush() {
    this.setData({ currentTool: 'brush' });
  },

  // 选择橡皮擦工具
  selectEraser() {
    this.setData({ currentTool: 'eraser' });
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

  },

  // 周边搜索函数
  async searchNearbyPlaces() {
    const latitude = this.data.latitude;
    const longitude = this.data.longitude;

    const key = this.data.subKey;
    const radius = 500; // 搜索半径，单位为米
    const url = `https://apis.map.qq.com/ws/place/v1/explore?boundary=nearby(${latitude},${longitude},${radius})&policy=1&page_size=10&page_index=1&key=${key}`;

    try {
        const res = await new Promise((resolve, reject) => {
            wx.request({
                url: url,
                method: 'GET',
                header: {
                    'Content-Type': 'application/json'
                },
                success: resolve,
                fail: reject
            });
        });

        if (res.data && res.data.status === 0) {
            const markers = res.data.data.map((place, index) => ({
                id: index + 1, // 自增ID
                name: place.title,
                latitude: place.location.lat,
                longitude: place.location.lng,
                iconPath: '../../images/location.png',
                width: 32,
                height: 32,
            }));

            this.setData({ markers: markers });
        } else {
            console.error("周边搜索失败:", res.data ? res.data.message : "无响应数据");
        }
    } catch (error) {
        console.error("请求失败:", error);
    }
  },

  // 显示对话框
  onShowDialog() {
    this.setData({ showDialog: true });
    const ctx = this.data.ctx;
    ctx.clearRect(0, 0, this.data.w, this.data.h); // 清空画布
  },

  // 隐藏对话框
  onHideDialog() {
    this.setData({ showDialog: false });
    this.renderPaths(this.data.ctx);
  },

  handleMarkerTap(e) {
    const marker = this.data.markers.find(item => item.id == e.markerId);
    marker && this.setData({
      currentMarker: marker
    });
    this.onShowDialog();
  },

  navi1() {
    const latitude = this.data.currentMarker.latitude;
    const longitude = this.data.currentMarker.longitude;
    wx.openLocation({
      latitude,
      longitude,
      scale: 18
    });
  },

  navi2() {

  }
})