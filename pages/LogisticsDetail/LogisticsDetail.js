import http from '/util/http.js';
const app = getApp();
Page({
  data() {
    return {
      company: '', // 物流公司
      orderNo: '', // 可以直接从传来的参数取
      orderStatus: '', // 物流状态
      routeInfo: [], // 物流详情
      deliveryOrderNo: '' // 物流单号
    };
  },
  onLoad(query) {
    this.setData({
      orderNo: query.orderNo
    });
    this.getRouteInfo();
  },
  onShow() {},
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  getRouteInfo() {
    let that = this;
    let params = {
      orderNo: that.data.orderNo
    };
    my.showLoading();
    http.get('/wuzhu/route/getRouteInfo', params).then(res => {
      // console.log(res)
      my.hideLoading();
      if (res.code === '00' && res.data) {
        that.setData({
          company: res.data.expressCompanyName,
          orderStatus: res.data.routStatusDesc,
          deliveryOrderNo: res.data.deliveryOrderNo
        });
        let route = [];
        if (res.data.routeTraceList) {
          for (let i = 0, l = res.data.routeTraceList.length; i < l; i++) {
            let routeItem = {};
            routeItem.day = res.data.routeTraceList[i].day.split('-').join('.');
            routeItem.times = res.data.routeTraceList[i].times;
            routeItem.address = res.data.routeTraceList[i].address;
            route.push(routeItem);
          }
        }
        that.setData({
          routeInfo: route
        });
      } else {
        console.log(`没有数据～`);
      }
    });
  },
  handleCopy() {
    let that = this;
    my.setClipboard({
      text: that.data.deliveryOrderNo,
      success: () => {
        my.showToast({
          type: 'success',
          content: '已复制'
        });
      }
    });
  }
});
