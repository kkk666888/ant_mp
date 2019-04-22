import http from '/util/http';
import Config from '/util/config';
import { gotoIndex } from '/util/wuzhuUtil';
import * as Utils from '/util/util';
import { startZMCreditRent } from '/util/startZMCreditRent';

const app = getApp();

Page({
  data() {
    return {
      orderType: 0,
      orderNo: '', // 商户的订单号即金达订单号
      title: '恭喜你已减免押金', //  错误标题
      msg: '正在为你生成新订单，请稍候......', // 错误原因
      icon: '/image/waiting_2x.png', // 图标
      showBtn: false, // 是否显示订单生成失败后的按钮
      success: false, // 用于标识订单生成是否成功
      clickBtn: false // 是否点击重试或者返回首页按钮
    };
  },
  onLoad(query) {
    console.info('NewOrderWait query === ' + JSON.stringify(query));
    this.setData({
      orderNo: query.orderNo
    });
    this.createNewOrder();
  },
  // TODO
  onUnload() {
    // 如果未点击重试或者返回首页按钮，unload时返回首页
    if (!this.data.clickBtn) {
      gotoIndex();
    }
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  // TODO 创建新订单
  createNewOrder: function() {
    let that = this;
    let _orderNo = that.data.orderNo;
    let url = Config._hoststr + '/wuzhu/aliPayZmOrderController/createBlockchainOrderForAli';
    let param = {
      orderNo: _orderNo
    };
    my.showLoading();
    http
      .post(url, param)
      .then(res => {
        my.hideLoading();
        console.log('====== createNewOrder res ' + JSON.stringify(res));
        // 订单生成成功则进入芝麻免押页面
        console.log('createNewOrder res.code = ' + res.code + ', res.data = ' + res.data);
        if (res && res.code === '00' && res.data) {
          console.log('createNewOrder startZMCreditRent');
          that.setData({
            success: true
          });
          startZMCreditRent(res.data);
        } else {
          console.log('createNewOrder showFailReason');
          that.showFailReason(res);
        }
      })
      .catch(err => {
        console.log('createNewOrder err = ' + JSON.stringify(err));
        my.hideLoading();
        that.showFailReason(err);
      });
  },
  showFailReason: function(res) {
    this.setData({
      showBtn: true,
      msg: '请重新下单或返回首页',
      title: '你的订单生成失败',
      icon: '/image/warning_2x.png'
    });
  },
  onRetry() {
    this.setData({
      clickBtn: true
    });
    gotoIndex();
  },
  onReturnHome() {
    this.setData({
      clickBtn: true
    });
    gotoIndex();
  }
});
