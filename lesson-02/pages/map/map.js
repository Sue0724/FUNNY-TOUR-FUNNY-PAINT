// pages/map/map.js
const QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
const util = require('../../utils/util.js');
var qqmapsdk;
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
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
    latitude: '30.873496',
    longitude: '120.131063',
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

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // qqmapsdk = new QQMapWX({
    //   key: 'ZFJBZ-NDACQ-5X45Z-4HUVI-G2NZH-IDFMV'
    // });
    // wx.getLocation({
    //   type: 'gcj02', // 返回可以用于wx.openLocation的经纬度
    //   success: (res) => {
    //     this.data.set_point.longitude = res.longitude;
    //     this.data.set_point.latitude = res.latitude;
    //     // 地址反解析
    //     qqmapsdk.reverseGeocoder({
    //       location: {
    //         latitude: res.latitude,
    //         longitude: res.longitude
    //       },
    //       success:  (res) => {
    //         console.log(res);
    //         this.data.set_point.address = res.result.address;
    //         this.setData({
    //           set_point: this.data.set_point
    //         });
    //       },
    //       fail: function (error) {
    //         console.error(error);
    //       },
    //       complete: function (res) {
    //         console.log(res);
    //       }
    //     });
    //   }
    // });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // const map = wx.createMapContext("map");
    // map.moveToLocation();
    const markers = this.data.features.filter(item => item.category == 'XN').map((feature,index) => {
      return {
        id: index,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        properties: {
          name: feature.name,
          code: feature.code
        },
        width: 24,
        height: 24,
        iconPath: '../../images/location.png',
        label: {
          content: feature.name
        }
      }
    });
    const circles = this.data.features.filter(item => item.category == 'ND').map((feature,index) => {
      return {
        id: index,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        color: '#26C9FF',
        radius: 3,
        fillColor: '#26C9FF80',
        strokeWidth: 1
      }
    });
    const polylines = this.data.features.filter(item => item.category == 'PL').map((feature,index) => {
      return {
        id: index,
        points: feature.geometry.coordinates.map(item => {return{longitude: item[0], latitude: item[1]}}),
        arrowLine: true,
        dottedLine: false,
        color: '#26C9FF',
        width: 2
      }
    });
    const polygons = this.data.features.filter(item => item.category == 'LR').map((feature,index) => {
      return {
        id: index,
        points: feature.geometry.coordinates[0].map(item => {return{longitude: item[0], latitude: item[1]}}),
        strokeColor: '#26C9FF',
        fillColor: '#26C9FF80',
        strokeWidth: 1
      }
    });
    this.setData({
      markers: markers,
      circles: circles,
      polylines: polylines,
      polygons: polygons
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  handleMarkerTap(e) {
    console.log(e);
    const marker = this.data.markers.find(item => item.id == e.markerId);
    marker && this.setData({
      currentMarker: marker,
      showDialog: true
    });
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
    // let plugin = requirePlugin('routePlan');
    // let key = 'ZFJBZ-NDACQ-5X45Z-4HUVI-G2NZH-IDFMV';  //使用在腾讯位置服务申请的key
    // let referer = 'wx2b5b0c606a528fce';   //调用插件的app的名称
    // let endPoint = JSON.stringify({  //终点
    //     'name': this.data.currentMarker.properties['name'],
    //     'latitude': this.data.currentMarker.latitude,
    //     'longitude': this.data.currentMarker.longitude
    // });
    // wx.navigateTo({
    //     url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint
    // });
  }
})