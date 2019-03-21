import http from './../../util/http';
const app = getApp();
Page({
  data: {
    orderNo: '',
    supplierAddress: '',
    supplierContact: '',
    listData: {
      data: [
        {
          title: '归还方式',
          extra: '快递归还'
        }
      ]
    },
    logisticsArray: [],
    submitDisabled: true,
    logisticsName: '请选择',
    logisticsVal: '',

    expressCompanyCode: '', // 物流公司编号 1、京东，2、顺丰
    deliveryOrderNo: '', //  物流单号
    returnReasonStyle: '0', // 归还原因 0、完结归还，1、维修归还，2、退货归还
    applyReturnDate: '', // 上门归还预约时间
    returnStationOid: '', // 回收站点Oid
    returnStyle: '0', // 归还方式 0、自寄，1、逆向物流，2、上门归还，3、上门维修
    showToast: false // 是否显示成功提示
  },
  chooseLogisticsChange(e) {
    let index = e.detail.value;
    this.setData({
      expressCompanyCode: this.data.logisticsArray[index].expressCompanyCode,
      logisticsName: this.data.logisticsArray[index].expressCompanyName
    });

    if (this.data.expressCompanyCode !== '' && this.data.deliveryOrderNo !== '') {
      this.setData({
        submitDisabled: false
      });
    } else {
      this.setData({
        submitDisabled: true
      });
    }
  },
  inputLogisticsNo(e) {
    this.setData({
      deliveryOrderNo: e.detail.value
    });
    if (this.data.expressCompanyCode !== '' && this.data.deliveryOrderNo !== '') {
      this.setData({
        submitDisabled: false
      });
    } else {
      this.setData({
        submitDisabled: true
      });
    }
  },
  submitReturn() {
    this.setData({
      submitDisabled: true
    });
    this.applyReturnFetch();
  },
  applyReturnFetch() {
    my.showLoading();
    const url = 'wuzhu/returnApplyNote/createReturnApplyNote';
    let param = {
      expressCompanyCode: this.data.expressCompanyCode, // 物流公司编号 1、京东，2、顺丰
      deliveryOrderNo: this.data.deliveryOrderNo, //  物流单号
      returnReasonStyle: this.data.returnReasonStyle, // 归还原因 0、完结归还，1、维修归还，2、退货归还
      applyReturnDate: this.data.applyReturnDate, // 上门归还预约时间
      returnStationOid: this.data.returnStationOid, // 回收站点Oid
      returnStyle: this.data.returnStyle,
      orderNo: this.data.orderNo
    };
    http
      .post(url, param)
      .then(res => {
        my.hideLoading();
        console.log(res);
        if (res.code === '00') {
          this.setData({
            showToast: true
          });
          this.gotoOrderList();
        } else {
          this.setData({
            submitDisabled: false
          });
          my.alert({
            title: '提示',
            content: res.msg,
            buttonText: '确定',
            success: () => {}
          });
        }
      })
      .catch(err => {
        my.hideLoading();
        this.setData({
          submitDisabled: false
        });
        my.alert({
          title: '错误',
          content: err.message,
          buttonText: '确定',
          success: () => {}
        });
      });
  },

  getLogisticsAndAddress() {
    const url = 'wuzhu/common/queryLogisticsByChannel';
    const url2 = 'wuzhu/vendor/getVendorReciveAddress';
    let param = {
      channelNo: '002'
    };
    let param2 = {
      orderNo: this.data.orderNo // '00120180724M000103895229' //
    };
    my.showLoading();
    http.get(url, param).then(res => {
      console.log(res);
      my.hideLoading();
      if (res && res.code === '00') {
        this.setData({
          logisticsArray: res.data,
          expressCompanyCode: res.data[0].expressCompanyCode,
          logisticsName: res.data[0].expressCompanyName
        });
      } else {
        my.showToast({
          content: res && res.msg
        });
      }
    });
    http.get(url2, param2).then(res => {
      console.log(res);
      if (res && res.code === '00') {
        this.setData({
          supplierAddress: `${res.data.province}${res.data.city}${res.data.area}${res.data.location}`,
          supplierContact: `${res.data.contract} ${res.data.contractPhone}`,
          returnStationOid: res.data.returnStationOid
        });
      } else {
        my.showToast({
          content: res && res.msg
        });
      }
    });
  },
  gotoOrderList() {
    let that = this;
    setTimeout(function() {
      that.setData({
        showToast: false
      });
      my.navigateTo({
        url: '/pages/orderList/orderList'
      });
    }, 3000);
  },
  onLoad(query) {
    this.setData({
      orderNo: query.orderNo
    });
    this.getLogisticsAndAddress();
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  }
});
