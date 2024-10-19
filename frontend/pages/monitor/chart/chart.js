// pages/monitor/chart/chart.js

import * as echarts from '../../../libs/ec-canvas/echarts';
const moment = require('moment');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    mid: null,
    monitor: null,
    current: [],
    indexes: [],
    index: null,
    show: false,
    ec: {
      lazyLoad: true
    }
  },

  onResize: function (res) {
    this.chart && this.chart.resize({
      width: res.size.windowWidth,
      height: res.size.windowHeight,
    }); 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.data.mid = options.id;
    // console.log(options.id);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.ecComponent = this.selectComponent('#mychart-dom-line');
    this.ecComponent.init((canvas, width, height, dpr) => {
      // 获取组件的 canvas、width、height 后的回调函数
      // 在这里初始化图表
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });

      wx.request({
        url: app.globalData.api.monitor_api + '/monitorRecords/monitor/' + this.data.mid + '/' + moment().startOf('day') + '/' + moment().endOf('day'),
        success: (result) => {
          this.data.current = result.data;
          let series = {
            name: '当天数据',
            type: 'line',
            z: 2,
            showSymbol: false,
            itemStyle: {
              normal: {
                color: '#26C9FF'
              }
            },
            // areaStyle: this.monitor_index.code === "quantity" ? {
            //     normal: {
            //         color: '#26C9FF'
            //     }
            // } : undefined,
            markLine :{
              silent: true,
              data: []
            },
            symbolSize: 8,
            hoverAnimation: false,
            data: this.data.current.map(record => record.origin[0])
          };
          const option = {
            title: {
              //text: this.monitor_index.alias + '实时数据曲线',
              text: '实时数据曲线',
              x: 'center',
              top: 15
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                animation: false
              }
            },
            legend: {
              data: [],
              x: 'left'
            },
            grid: [{
              top: 50,
              left: 50,
              right: 30,
              bottom: 50
            }],
            dataZoom: [{
              type: 'inside'
            }],
            xAxis: [
              {
                type: 'category',
                boundaryGap: false,
                axisLine: {
                  onZero: true,
                },
                data: this.data.current.map(record => moment(record.date).format('HH:mm'))
              }
            ],
            yAxis: [
              {
                // name: this.monitor_index.alias + "(" + this.monitor_index.display_unit.name + ")",
                name: '',
                type: 'value',
                max: value => value.max * 1.5,
                axisLine: {
                  show: true
                },
                splitLine: {
                  show: true
                },
                axisLabel: {
                  showMaxLabel: false
                }
              }
            ],
            series: [series]
          };
        
          chart.setOption(option);
        }
      });
      
      // 将图表实例绑定到 this 上，可以在其他成员函数（如 dispose）中访问
      this.chart = chart;

      // 注意这里一定要返回 chart 实例，否则会影响事件处理等
      return chart;
    });
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