import http from './../../util/http';
// import indexJSON from './mock/Buyout.json';
import Config from '/util/config';
const app = getApp();
Page({
  data() {
    return {
      forceBuyoutUrl: '/wuzhu/order/buyOut/forcebuyout/bill', // 强制买断信息
      forceBuyoutOrderStrUrl: '/wuzhu/order/buyOut/forcebuyout/checkpay', // 获取强制买断支付参数
      queryPayResultUrl: '/wuzhu/order/buyOut/query', // 查询买断结果
      buyoutDetaiUrl: '/wuzhu/order/buyOut/calculate/V2', // 试算接口
      applyUrl: '/wuzhu/order/buyOut/alipay', // 获取支付orderStr
      commodityInfo: {},
      buyoutProductInfo: {},
      checkBoxChoose: false,
      checkedUrl: '/image/Buyout/fill-small_2x.png',
      unCheckedUrl: '/image/common/choice_unchecked.png',
      checkImgUrl: '/image/common/choice_unchecked.png', // 选择框默认图片
      checkBtn: 'submitBtnHL',
      remindProtocol: false,
      orderNo: '',
      count: 5, // 查询买断结果次数
      buyoutType: 1 // 买断类型，1、主动买断，2、强制买断
    };
  },
  onLoad(query) {
    let that = this;

    that.setData({
      orderNo: query.orderNo,
      buyoutType: query.buyoutType
    });

    if (query.buyoutType == 1) {
      // 主动买断
      this.getBuyoutDetail(query.orderNo);
    } else {
      // 强制买断
      this.getForceBuyoutInfo(query.orderNo);
    }
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  // 获取强制买断信息
  getForceBuyoutInfo(orderNo) {
    my.showLoading();
    let params = {
      orderNo: orderNo
    };
    http
      .post(this.data.forceBuyoutUrl, params)
      .then(res => {
        console.log(res);
        my.hideLoading();
        if (res.code === '00' && res.data) {
          this.setData({
            commodityInfo: res.data,
            buyoutProductInfo: res.data.buyoutProductInfo
          });
        } else {
          my.showToast({
            content: res.msg
          });
        }
      })
      .catch(err => {
        my.hideLoading();
      });
  },
  // 主动买断信息
  getBuyoutDetail(orderNo) {
    my.showLoading();
    let params = {
      orderNo: orderNo
    };
    http
      .get(this.data.buyoutDetaiUrl, params)
      .then(res => {
        console.log(res);
        my.hideLoading();
        if (res.code === '00' && res.data) {
          this.setData({
            commodityInfo: res.data,
            buyoutProductInfo: res.data.buyoutProductInfo
          });
        } else {
          my.showToast({
            content: res.msg
          });
        }
      })
      .catch(err => {
        my.hideLoading();
      });
  },
  // 提交
  submitOrder() {
    if (this.data.checkBoxChoose) {
      if (this.data.buyoutType == 2) {
        // 强制买断
        this.forceBuyoutPay();
      } else {
        // 主动买断
        this.applyPay();
      }
    } else {
      this.setData({
        remindProtocol: true
      });
      this.draw();
    }
  },
  // 强制买断
  forceBuyoutPay() {
    let params = {
      orderNo: this.data.orderNo,
      cashDeductionAmt: this.data.commodityInfo.cashDeductionAmt,
      finalActualPayAmt: this.data.commodityInfo.finalActualPayAmt,
      cashOffsetAmt: this.data.commodityInfo.cashOffsetAmt
    };
    my.showLoading();
    http
      .post(this.data.forceBuyoutOrderStrUrl, params)
      .then(res => {
        my.hideLoading();
        if (res.code === '00') {
          this.handleForceBuyout(res.data);
        } else {
          my.alert({
            content: res.msg
          });
        }
      })
      .catch(err => {
        my.hideLoading();
        console.log(`apply error`, err);
      });
  },
  // 买断是否需要支付
  handleForceBuyout(data) {
    switch (data.status) {
      case 'PAY_FAILED': // 买断失败
        my.alert({
          content: data.desc
        });
        break;
      case 'PAY_INPROGRESS': // 需要支付买断
        this.callAliTradePay(data.payInfo);
        break;
      case 'PAY_SUCCESS': // 支付金额为0，成功买断
        my.alert({
          content: '买断成功',
          success: () => {
            my.navigateTo({
              url: `/pages/orderDetail/orderDetail?orderNo=${_this.data.orderNo}`
            });
          }
        });
        break;
      default:
        break;
    }
  },
  // 调起支付
  callAliTradePay(str) {
    my.tradePay({
      orderStr: str, //完整的支付参数拼接成的字符串，从服务端获取
      success: res => {
        console.log('apply success', res.resultCode);
        switch (res.resultCode) {
          case '9000':
            this.queryPayResult();
            my.showLoading({
              content: '查询买断结果中'
            });
            break;
          case '8000':
            this.queryPayResult();
            my.showLoading({
              content: '查询买断结果中'
            });
            break;
          case '6004':
            this.queryPayResult();
            my.showLoading({
              content: '查询买断结果中'
            });
            break;
          case '4000':
            my.showToast({
              content: '支付失败'
            });
            break;
          case '6001':
            my.showToast({
              content: '支付失败'
            });
            break;
          default:
            my.showToast({
              content: '未知错误'
            });
            this.queryPayResult();
            my.showLoading({
              content: '查询买断结果中'
            });
            break;
        }
      },
      fail: res => {
        console.log('apply fail');
        my.alert({
          content: JSON.stringify(res)
        });
      }
    });
  },
  // 主动买断
  applyPay() {
    let param = {
      buyOutType: this.data.buyoutProductInfo.buyOutType,
      orderNo: this.data.orderNo
    };
    my.showLoading();
    http
      .post(this.data.applyUrl, param)
      .then(res => {
        my.hideLoading();
        if (res.code === '00' && res.data && res.data.status === 'PAY_INPROGRESS') {
          this.callAliTradePay(res.data.orderString);
        } else if (res.code === '00' && res.data.status === 'PAY_SUCCESS') {
          my.hideLoading();
          my.alert({
            content: '买断成功',
            success: () => {
              my.navigateTo({
                url: `/pages/orderDetail/orderDetail?orderNo=${_this.data.orderNo}`
              });
            }
          });
        } else {
          my.alert({
            content: res.msg
          });
        }
      })
      .catch(err => {
        my.hideLoading();
        console.log(`apply error`, err);
      });
  },
  // 查询买断结果
  queryPayResult() {
    const _this = this;
    this.data.count--;
    let param = {
      orderNo: this.data.orderNo
    };

    http
      .get(this.data.queryPayResultUrl, param)
      .then(res => {
        console.log('query result', res);
        if (res.code === '00' && res.data.status === 'PAY_SUCCESS') {
          my.hideLoading();
          my.alert({
            content: '买断成功',
            success: () => {
              my.navigateTo({
                url: `/pages/orderDetail/orderDetail?orderNo=${_this.data.orderNo}`
              });
            }
          });
        } else {
          this.queryError();
        }
      })
      .catch(err => {
        console.log(err);
        this.queryError();
      });
  },
  // 失败重复查5次
  queryError() {
    const _this = this;
    if (this.data.count <= 0) {
      my.hideLoading();
      my.alert({
        content: '查询买断结果失败,请稍后查看',
        success: res => {
          my.navigateTo({
            url: `/pages/orderDetail/orderDetail?orderNo=${_this.data.orderNo}`
          });
        }
      });
      return;
    }
    setTimeout(() => {
      this.queryPayResult();
    }, 3000);
  },
  // 查看协议
  protocolClick() {
    let protocolUrl = `${Config._hoststr}/doc/zfb/user_lease_buy_out_agreement.htm`;
    my.navigateTo({
      url: `./../ProtocolHtml/ProtocolHtml?protocol=用户租赁及服务协议之买断协议&protocolUrl=${protocolUrl}`
    });
  },
  // 勾选协议
  onCheckBoxClick() {
    this.setData({
      checkBoxChoose: !this.data.checkBoxChoose
    });
    this.setImg();
  },
  // 按钮协议选择框联动
  setImg() {
    const isChecked = this.data.checkBoxChoose;
    if (isChecked) {
      this.setData({
        checkImgUrl: this.data.checkedUrl,
        checkBtn: 'submitBtn',
        remindProtocol: false
      });
    } else {
      this.setData({
        checkImgUrl: this.data.unCheckedUrl,
        checkBtn: 'submitBtnHL'
      });
    }
  },
  // 开始绘制阅读协议的弹窗
  draw() {
    var context = my.createCanvasContext('canvas');
    context.setFillStyle('#35394B');
    context.setStrokeStyle('#35394B');
    context.beginPath();
    context.moveTo(7, 0);
    context.lineTo(12, 10);
    context.lineTo(17, 0);
    context.fill();
    context.draw();
  }
});
