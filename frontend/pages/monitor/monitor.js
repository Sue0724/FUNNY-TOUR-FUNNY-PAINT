// pages/monitor/monitor.js

const moment = require('moment');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    source: [{"_id":"6180aab38f9b3e63da8cb010", "indexes": ["I01"],"name":"德清湖1号液位计","code":"M001","type":"M01","enable":true, "battery": 3},{"_id":"6180d239be5ee500f6db3a79","indexes":["I02", "I03","I04", "I05", "I06"],"name":"德清湖1号水质仪","code": "Q001","type": "M02","enable":true,"battery":3},{"_id":"618354cee7f5d9eb5fd45e67","indexes":["I01"], "name":"西校区1号液位计","code":"L101","type":"M01","enable":false,"battery":0}],
    types: [{"name":"液位计","code":"M01","type":"Level","short":"L","display":["I01"],"preferred": "I01"},{"name":"水质仪","code":"M02","type":"Quality","short":"Q","display": ["I02","I03","I04", "I05","I06"], "preferred":"I05"}],
    indexes:[{"name":"液位","code":"I01","description":"液位","unit type":"U01","unit":"01","display_unit":"01","series type":"line","series color":"#0ef2f6","order":0},
    {"name":"pH","code":"I02","description":"pH","unit_type":"","unit":"","display_ unit":"","series _type":"line","series color":"#c300d1","order":0},
    {"name":"总氮","code":"I03","description":"TN","unit_type":"U02","unit":"01","display_unit":"01","series type":"line","series color":"#f59b00", "order":0},
    {"name":"总磷", "code" : "I04","description":"TP","unit_type":"U02","unit":"01","display unit":"01","series_ type":"line","series color":"#c42d12", "order":0},
    {"name":"COD", "code": "I05","description":"COD","unit_type":"U02","unit":"01","display_unit":"01","series_ type":"line","series color":"#3017ab","order" : 0},
    {"name": "DO","code":"I06","description":"DO","unit_type":"U02","unit":"01","display_unit":"01","series_type":"line","series_color":"#308ddf","order":0}],
    records: [{"_id":"6180aab38f9b3e63da8cb010","lastDate":"2021-12-27T08:35:00.000Z","lastOrigin":[1.510]},{"_id": "6180d239be5ee500f6db3a79","lastDate": "2021-12-27T08:35:00.000Z","lastOrigin":[7.205,1.503,0.034,15.002,6.009]}],
    monitors: [],
    show: false,
    loading: false,
    type: 'all',
    keyword: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.refreshData();
  },

  refreshData: function() {
    wx.showLoading({
      title: "正在加载...",
      mask: true
    });
    wx.request({
      url: app.globalData.api.business_api + '/config/monitor',
      success: (result) => {
        this.data.types = result.data.types;
        this.data.indexes = result.data.indexes;
        wx.request({
          url: app.globalData.api.monitor_api + '/monitors/',
          success: (result) => {
            this.data.source = result.data;
            wx.request({
              url: app.globalData.api.monitor_api + '/monitorRecords/monitor/now',
              success: (result) => {
                result.data.forEach(item => {
                  const monitor = this.data.source.find(monitor => monitor._id == item._id);
                  if(monitor){
                    monitor.latest = item;
                    monitor.latest.date = moment(monitor.latest.lastDate).fromNow();
                    monitor.indexes = monitor.indexes.map(index => {
                      return this.data.indexes.find(item => item.code == index);
                    })
                    monitor.type = this.data.types.find(item => item.code == monitor.type);
                    monitor.display = monitor.indexes.map( (index, i) => {
                      const object = {};
                      object.name = index.name;
                      object.code = index.code;
                      // object.unit = index.display_unit ? index.display_unit.name : "";
                      object.value = Array.isArray(monitor.latest.lastOrigin) ?  Math.round(monitor.latest.lastOrigin[i] * 1000) / 1000 : "-";
                      return object;
                    });
                  }
                });
                this.setData({
                  loading: true,
                  types: this.data.types,
                  source: this.data.source,
                  monitors: this.data.source
                });
                wx.hideLoading();
              }
            });
          }
        });
      }
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
    this.refreshData();
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

  filter(e) {
    this.data.keyword = e.detail.value;
    this.setData({
      monitors: this.data.source.filter(item => item.name.indexOf(this.data.keyword) != -1)
    });
  },

  clear() {
    this.setData({
      monitors: this.data.source
    });
  },

  switch() {
    this.setData({
      show: !this.data.show,
      type: 'all',
      monitors: this.data.source
    });
  },

  changeType(e) {
    const type = e.currentTarget.dataset.code;
    this.setData({
      type: type,
      monitors: this.data.source.filter(item => type == 'all' || item.type == type || item.type.code == type)
    })
  },

  naviMonitor(e) {
    const _id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: 'chart/chart?id=' + _id
    })
  }
})