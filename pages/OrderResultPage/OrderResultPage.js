import http from '/util/http';
import Config from '/util/config';
import { getFeeDescStr, getLeaseStyleDesc, getPayStayleEnum, gotoIndex } from '/util/wuzhuUtil';
import * as Utils from '/util/util';

const app = getApp();
let orderDepositStatus = {};
orderDepositStatus.no = 0; // 不免押金
orderDepositStatus.part = 1; // 免部分押金
orderDepositStatus.all = 2; // 全免

Page({
  data() {
    return {
      orderType: 0,
      token: '', // token部分
      zmOrderNo: '', // 芝麻信用的订单号
      outOrderNo: '', // 商户的订单号即金达订单号
      errorCode: '', // 芝麻返回的错误码，详见：https://docs.open.alipay.com/solution/pnf1gm/
      errorTitle: '待确认', //  错误标题
      errorReason: '', // 错误原因
      errorIcon: '/image/orderSubmit/tobeConfirmed.svg', // 图标
      success: false, // 用于指示是否成功
      feeDetail: {
        deepFreeAmount: '', // 身份认证减免金
        dayAvgRentAmt: '', // 每日租金
        totalDays: '', // 租期
        payStyleStr: '', // 结算方式
        totalMoney: '', // 首期应支付金额
        serviceList: [
          {
            feeName: '意外保障费',
            feeValue: '',
            feeDesc: ''
          }
        ],
        orderDepositAmt: '', // 商品的总押金
        payDepositAmt: '', // 需要支付的押金金额
        orderCreditAmt: '' // 授信金额
      },
      aliPayShow: true, // 支付宝资金授权的展示
      depositAmtShow: true, // 总押金
      orderCreditAmtShow: true, // 芝麻信用授权金额展示
      deepFreeAmountShow: false, // 身份认证减免金
      coupon: null, // 优惠券
      currentMoney: 0, // 优惠后金额
      queryOrderResultUrl: '/wuzhu/order/queryAndConfirmOrderSatus', // 查询订单结果
      queryOrderStatusCount: 3 // 查询次数
    };
  },
  onLoad(query) {
    let result = query.result;
    if (result === 'success') {
      this.queryOrderResult();
    } else {
      this.updateOrderStatus();
    }
    this.setData({
      zmOrderNo: query.zmOrderNo,
      outOrderNo: query.outOrderNo,
      errorCode: query.errorCode,
      orderType: query.orderType ? query.orderType : 0
      // receiveNo: query.receiveNo
    });
    console.info('传过来的 query === ' + JSON.stringify(query));
  },
  onShow() {
  },
  onReady() {
    // 获取对应的token并且复制给data里面的token
    let token = app.Token;
    this.setData({
      token: token
    });
  },
  onUnload() {
    gotoIndex();
  },   
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  // 支付成功后查询订单结果
  queryOrderResult() {
    let params = {
      orderNo: this.data.outOrderNo
    };
    let url = this.data.queryOrderResultUrl;
    my.showLoading();
    this.setData({
      queryOrderStatusCount: this.data.queryOrderStatusCount--
    });
    http.get(url, params).then(res => {
      if (res.code === '00') {
        my.hideLoading();
        this.setData({
          success: true
        });
        // 下单成功查询详情
        this.httpGetOrderDetail();
      } else if (res.code === '2025') {
        my.hideLoading();
        this.setData({
          success: false,
          errorTitle: '订单预约失败',
          errorIcon: '/image/orderSubmit/fail_3x.png',
          errorReason: '你的订单暂未通过物主的深度审核，已被取消，期待下次光临！'
        });
      } else {
        this.continueQueryOrder();
      }
    });
  },
  continueQueryOrder() {
    if (this.data.queryOrderStatusCount <= 0) {
      my.hideLoading();
      this.setData({
        success: false,
        errorTitle: '正在确认订单，请稍候',
        errorReason: '你的订单正在等待后台确认， 10分钟内将返回确认结果，请留意确认短信。'
      });
    } else {
      this.queryOrderResult();
    }
  },
  // HTTP下单失败时更新订单状态
  updateOrderStatus: function() {
    let that = this;
    let _orderNo = that.data.outOrderNo;
    let url = Config._hoststr + '/wuzhu/order/alipay/payFail';
    let param = {
      orderNo: _orderNo,
      failCode: that.data.errorCode,
      failReason: that.getFailReason()
    };
    let header = {
      Token: that.data.token
    };
    my.showLoading();
    http
      .post(url, param, header)
      .then(res => {
        my.hideLoading();
        console.log('====== updateOrderStatus res ' + JSON.stringify(res));
        // 无论后台返回成功或失败都展示错误原因
        that.showFailReason();
      })
      .catch(err => {
        my.hideLoading();
        that.showFailReason();
      });
  },
  getFailReason: function() {
    let that = this;
    let _errorCode = that.data.errorCode;
    let errorReason = '';
    console.log('getFailReason _errorCode=' + _errorCode);
    switch (_errorCode) {
      case 'SYSTEM_FAILURE':
        errorReason = '系统错误，请稍后再试';
        break;
      case 'ORDER_NOT_EXISTS':
        errorReason = '订单不存在';
        break;
      case 'SIGN_ERROR':
        errorReason = '系统异常，请稍后再试';
        break;
      case 'WITHHOLDING_FAILED':
        errorReason = '签约代扣协议失败';
        break;
      case 'PREAUTH_FREEZE_ERROR':
        errorReason = '预授权冻结押金失败';
        break;
      case 'ORDER_CONFIRM_ERROR':
        errorReason = '订单确认失败';
        break;
      case 'CLOSE_PRE_AUTH_BACK':
        errorReason = '预授权失败';
        break;
      case 'USER_CANCEL':
        errorReason = '你已取消下单';
        break;
      default:
        errorReason = '其他错误，请稍后再试';
        break;
    }
    console.log('getFailReason errorReason=' + errorReason);
    return errorReason;
  },
  showFailReason: function() {
    this.setData({
      errorReason: this.getFailReason(),
      errorTitle: '下单失败',
      errorIcon: '/image/orderSubmit/fail_3x.png'
    });
  },
  // HTTP获取当前芝麻订单的详情
  httpGetOrderDetail: function() {
    let that = this;
    let _orderNo = this.data.outOrderNo;
    // GET /aliPayZmOrderController/queryZimaOrderDetail
    let detailUrl = Config._hoststr + '/wuzhu/aliPayZmOrderController/queryZimaOrderDetail';
    let param = {
      orderNo: _orderNo
    };
    let header = {
      Token: this.data.token
    };
    my.showLoading();
    http
      .get(detailUrl, param, header)
      .then(res => {
        my.hideLoading();
        if (res.code === '00') {
          // 开始解析对应的数据
          that.parseHttpResult(res.data);
        } else {
          let msg = res && res['msg'];
          my.showToast({
            type: 'fail',
            content: msg,
            duration: 3000
          });
        }
      })
      .catch(err => {
        my.hideLoading();
      });
  },
  // 解析获取到的订单详情内容
  parseHttpResult: function(data) {
    // 支付方式文字描述
    let rentInfo = data && data['rentInfo'];
    let payStyle = rentInfo && rentInfo['payStyle']; //  支付方式
    let payStyleStr = getLeaseStyleDesc(payStyle); //   支付方式
    let dayAvgRentAmt = data && data['dayAvgRentAmt']; // 每日的租金

    let billInfo = data && data['billInfo']; // 账单信息
    let orderDepositAmt = billInfo && billInfo['orderDepositAmt']; // 押金金额
    let orderCreditAmt = billInfo && billInfo['orderCreditAmt']; // 授信金额
    let payDepositAmt = billInfo && billInfo['payDepositAmt']; // 需要支付的押金金额
    let totalDays = billInfo && billInfo['totalDays']; // 租赁的总天数

    // 判定下是部分免押 完全免押 无免押 押金金额  授信金额
    this.dealDeposit(orderDepositAmt, orderCreditAmt);

    // 首期费用总金额和一次应该支付的总金额
    let termFirstPayAmt = billInfo && billInfo['termFirstPayAmt']; // 分期需要支付的总金额
    let onepayAmt = billInfo && billInfo['onepayAmt']; //  一次性付款需要支付的总金额

    // 附加服务列表
    let serviceFeeList = data && data['serviceFeeList']; // 附加服务列表，此处费用显示逻辑和商品详情部分一致
    let serviceFeeInfoList = this.getServiceFeeList(serviceFeeList);

    // 设置优惠券优惠后金额
    this.setCouponInfo(data.couponOrderUseInfo);

    let payStyleEnum = getPayStayleEnum(payStyle);
    let firPayAmt = '';
    if (payStyleEnum === 1) {
      // 如果是一次性支付
      firPayAmt = onepayAmt;
    } else {
      firPayAmt = termFirstPayAmt;
    }
    let deepFreeAmount = billInfo && billInfo['deepFreeAmount'];;
    let deepFreeAmountShow = false;
    if ( deepFreeAmount > 0 ) {
      deepFreeAmountShow = true;
    }
    let feeDetail = {
      deepFreeAmount: deepFreeAmount,
      dayAvgRentAmt: dayAvgRentAmt, // 每日租金
      totalDays: totalDays, // 租期
      payStyleStr: payStyleStr, // 结算方式
      totalMoney: firPayAmt, // 首期应支付金额
      serviceList: serviceFeeInfoList,
      orderDepositAmt: orderDepositAmt, // 商品的总押金
      payDepositAmt: payDepositAmt, // 需要支付的押金金额
      orderCreditAmt: orderCreditAmt // 授信金额
    };

    console.log('====== 解析出来 feeDetail ' + JSON.stringify(feeDetail));

    this.setData({
      deepFreeAmountShow: deepFreeAmountShow,
      feeDetail: feeDetail
    });
  },
  // 设置优惠券信息
  setCouponInfo(coupon) {
    if (coupon && coupon.couponDeductResponse.term === '1' && coupon.couponDeductResponse.deductType === 'CASH') {
      let total = this.data.feeDetail.totalMoney;
      // let current = (Number(total * 100) - coupon.couponDeductResponse.actualPlanCouponDeductAmt * 100) / 100;
      let current = Utils.accSub(total, coupon.couponDeductResponse.actualPlanCouponDeductAmt);

      this.setData({
        coupon: coupon,
        currentMoney: current
      });
    }
  },
  // 根据押金的状态处理对应的data
  // 入参： 押金金额  授信金额
  dealDeposit: function(orderDepositAmt, orderCreditAmt) {
    // 押金全免
    let orderDeposit = orderDepositStatus.no;
    if (orderCreditAmt >= orderDepositAmt) {
      orderDeposit = orderDepositStatus.all;
    } else if (orderCreditAmt === 0) {
      orderDeposit = orderDepositStatus.no;
    } else {
      orderDeposit = orderDepositStatus.part;
    }

    console.info('orderDeposit ==' + orderDeposit);
    let aliPayShow = true; // 支付宝资金授权的展示
    let depositAmtShow = true; // 总押金
    let orderCreditAmtShow = true; // 芝麻信用授权金额展示
    switch (orderDeposit) {
      case orderDepositStatus.no: {
        aliPayShow = true;
        depositAmtShow = false;
        orderCreditAmtShow = false;
        break;
      }
      case orderDepositStatus.part: {
        aliPayShow = true;
        depositAmtShow = true;
        orderCreditAmtShow = true;
        break;
      }
      case orderDepositStatus.all: {
        aliPayShow = false;
        depositAmtShow = true;
        orderCreditAmtShow = true;
        break;
      }
      default: {
        console.info('押金状态有问题');
        break;
      }
    }
    this.setData({
      aliPayShow: aliPayShow,
      depositAmtShow: depositAmtShow,
      orderCreditAmtShow: orderCreditAmtShow
    });
  },
  // 获取该商品的附加服务列表
  getServiceFeeList: function(serviceFeeList) {
    let serviceFeeInfoList = [];
    if (serviceFeeList !== undefined && serviceFeeList instanceof Array) {
      for (let i = 0; i < serviceFeeList.length; i++) {
        let feeItem = serviceFeeList[i];
        let feeValueStr = getFeeDescStr(feeItem);
        serviceFeeInfoList.push({
          feeName: feeItem.feeName,
          feeDesc: feeItem.feeDesc,
          feeValue: feeValueStr
        });
      }
    }
  },
  // 查看订单
  onlookOrderBtnClick() {
    my.navigateTo({
      // 跳转订单下单结果页
      url: '/pages/orderDetail/orderDetail?orderNo=' + this.data.outOrderNo
    });
  },
  // 返回首页
  onReturnHomeBtnClick() {
    // 在three页面内 navigateBack，将返回one页面 返回首页
    // my.navigateBack({
    //   delta: 10
    // });
    // my.navigateTo({
    //   url: '/pages/index/index'
    // });
    gotoIndex();
  },
  // 重试
  onRetryBtnClick() {
    // 在three页面内 navigateBack，将返回one页面
    my.navigateBack({
      delta: 1
    });
  }
});
