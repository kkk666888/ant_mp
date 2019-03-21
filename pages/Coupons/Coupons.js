import http from './../../util/http';
import * as Utils from '/util/util';
const app = getApp();

Page({
  data: {
    getCouponsUrl: '/wuzhu/user/queryUserCouponInfo',
    getInstructionUrl: '/wuzhu/user/queryCouponDetailMsgBychannel',
    tabs: [
      {
        title: '未使用',
        id: 1,
        cards: []
      },
      {
        title: '已使用',
        id: 2,
        cards: []
      },
      {
        title: '已过期',
        id: 3,
        cards: []
      }
    ],
    showToast: false,
    toastTitle: '说明',
    toastContent: '',
    activeTab: 0,
    couponInstruction: '' // 优惠券使用说明
  },
  onLoad() {
    this.getCoupons();
    this.getInstructionInfo();
  },
  onReady() {},
  couponInstruction() {
    this.setData({
      showToast: true,
      toastTitle: '使用说明'
    });
    if (!this.data.toastContent) {
      this.getInstructionInfo();
    }
  },
  async getInstructionInfo() {
    let params = {
      channelNo: '002'
    };
    try {
      let res = await http.get(this.data.getInstructionUrl, params);
      if (res.code === '00') {
        this.setData({
          toastContent: res.data,
          insFlag: true
        });
      } else {
        my.showToast({
          content: res.msg
        });
      }
    } catch (error) {
      console.log(error);
    }
  },
  getCoupons() {
    let params = {};
    my.showLoading();
    http
      .post(this.data.getCouponsUrl, params)
      .then(res => {
        my.hideLoading();
        console.log(res);
        if (res.code === '00') {
          this.setCouponList(res.data);
        } else {
          my.showToast({
            content: res.msg
          });
        }
      })
      .catch(err => {
        console.error(err);
        my.hideLoading();
      });
  },
  setCouponList(data) {
    console.log('tab', data);

    let nCards = [];
    let uCards = [];
    let oCards = [];
    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      switch (element.bizStatus) {
        case '1': // 未使用
          let nItem = { ...element };
          nItem['available'] = '0';
          nItem['operation'] = 'button';
          nItem['buttonText'] = '去使用';
          nItem['footer'] = `有效期：${Utils.formatDateInCN(element.beginTime)}——${Utils.formatDateInCN(
            element.endTime
          )}`;
          nCards.push(nItem);
          break;
        case '2': // 已使用
          let uItem = { ...element };
          uItem['available'] = '1';
          uItem['operation'] = 'used';
          uItem['footer'] = `有效期：${Utils.formatDateInCN(element.beginTime)}——${Utils.formatDateInCN(
            element.endTime
          )}`;
          uCards.push(uItem);
          break;
        case '3': // 已过期
          let oItem = { ...element };
          oItem['available'] = '1';
          oItem['operation'] = 'overdue';
          oItem['footer'] = `有效期：${Utils.formatDateInCN(element.beginTime)}——${Utils.formatDateInCN(
            element.endTime
          )}`;
          oCards.push(oItem);
          break;
        default:
          break;
      }
    }
    this.setData({
      'tabs[0].cards': nCards,
      'tabs[1].cards': uCards,
      'tabs[2].cards': oCards
    });
    console.log('tab', this.data.tabs, nCards, uCards, oCards);
  },
  onHideToastClick() {
    this.setData({
      showToast: false
    });
  },
  handleTabClick({ index }) {
    this.setData({
      activeTab: index
    });
  },
  clickCard(env) {
    if (env.status === '0') {
      my.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});
