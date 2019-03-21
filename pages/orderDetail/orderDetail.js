import http from './../../util/http';
import { getFeeDescStr, getLeaseStyleDesc } from '/util/wuzhuUtil';
import * as Utils from '/util/util';
const app = getApp();
Page({
  data() {
    return {
      orderNo: '',
      statusDate: '', // 状态改变时间
      dayAmt: '', // 日租金
      bizStatus: '', // '4已取消', '5待发货', '6待收货', '7租用中', '99已完结'
      status: '', // 订单状态
      orderStatusStr: '', // 详见 setOrderStatus()
      orderStatusDes: '', // 详见 setOrderStatus()
      orderClass: '', // 详见 setOrderStatus()
      payStatusArr: ['4首期应付', '5,6首期已付', '7,99,本期已付'],
      showBtn: false, // 是否显示底部按钮 4已取消.不显示，99已完结，不显示
      userInfo: {},
      goodsDetail: {},
      feeDetail: {},
      serviceList: [],
      aliPayShow: false, // 支付宝资金授权的展示
      depositAmtShow: true, // 总押金
      orderCreditAmtShow: true, // 芝麻信用授权金额展示
      showToast: false, // 展示费用说明
      toastTitle: '', //  展示标题
      toastContent: '',
      timeControl: {},
      isGiveBack: 'N',
      orderButtons: '',
      shwoBuyoutDetail: false,
      buyOutDetail: {}, // 买断信息
      coupon: null, // 优惠券
      currentMoney: 0, // 优惠后的价格
      currentPeriod: 0 // 当前期次
    };
  },
  onLoad(query) {
    let url = '/wuzhu/order/getOrderDetail';
    let params = {
      orderNo: query.orderNo
      // orderNo: '00220190228164247M035265821' // 可买断
      // orderNo: '00220190125172952M046660915'  // 主动买断完成的
      // orderNo: '00220190129165528M046643040' // 买断中的
      // orderNo: '00220190125175637M046669504'  // 逾期买断完结的
    };
    let that = this;
    my.showLoading();
    http.get(url, params).then(res => {
      my.hideLoading();
      console.log('getOrderDetail res=', res);
      if (res.code === '00') {
        var res = res.data;

        that.setData({
          orderButtons: that.getButtonsListStrWithItem(res.orderButtons, res.bizStatus)
        });

        // 买断信息
        const buyOutDetail = { ...res.orderBuyOutRecord };

        // 是否显示无押图标
        const orderCreditAmt = res.billInfo.orderCreditAmt;
        const orderDepositAmt = res.billInfo.orderDepositAmt;
        if (orderCreditAmt != 0 && orderCreditAmt <= orderDepositAmt) {
          that.setData({
            aliPayShow: true
          });
        }
        // 商品详情
        const goodsDetail = {
          fullName: res.commodity.fullName,
          specContentList: res.commodity.specContentList,
          listImg: res.commodity.listImg
        };
        // 用户信息
        const userInfo = {
          receiveName: res.rentInfo.receiverName,
          receivePhone: res.rentInfo.receiverTel,
          receiveAddress: res.rentInfo.consigneeAddr
        };
        // 获取该商品的附加服务列表
        let serviceList = [];
        if (res.serviceFeeList !== undefined && res.serviceFeeList instanceof Array) {
          for (let i = 0; i < res.serviceFeeList.length; i++) {
            let feeItem = res.serviceFeeList[i];
            let feeDesc = getFeeDescStr(feeItem);
            serviceList.push({
              itemName: feeItem.feeName,
              itemValue: feeDesc,
              itemDesc: feeItem.feeDesc,
              feeTypeCode: feeItem.feeTypeCode
            });
          }
        }
        // 支付详情
        const feeDetail = {
          termDay: res.billInfo.totalDays, // 租期总天数
          payStyleStr: getLeaseStyleDesc(res.rentInfo.payStyle), // 结算方式
          totalMoney: res.billInfo.termFirstPayAmt, // 分期首期应支付金额, 暂时不支持一次性支付
          nextPayTime: res.billInfo.nextPayTime ? res.billInfo.nextPayTime.split(' ')[0] : '-', // 下期付款日
          nextPeriodAmt: res.billInfo.nextPeriodAmt, // 下期待付
          currentPeriodAmt: res.billInfo.currentPeriodAmt, // 本期应付
          orderDepositAmt: res.billInfo.orderDepositAmt, // 总押金
          payDepositAmt: res.billInfo.payDepositAmt, // 已冻结押金
          orderCreditAmt: res.billInfo.orderCreditAmt // 芝麻信用免押金
        };

        // 订单状态的时间管理
        const timeControl = {
          createDate: res.createDate, // 下单时间
          deliveryDate: res.rentInfo.deliveryDate, // 发货时间
          signingDate: res.rentInfo.signingDate, // 签收时间
          expireDate: res.rentInfo.expireDate, // 到期时间
          finishDate: res.finishDate // 完结时间
        };
        let shwoBuyoutDetail = false;
        if (
          res.bizStatus === '10' ||
          res.status === '99005' ||
          res.status === '99008' ||
          res.status === '99012' ||
          res.status === '99013' ||
          res.status === '99014'
        ) {
          shwoBuyoutDetail = true;
        }
        that.setData({
          orderNo: res.orderNo,
          bizStatus: res.bizStatus,
          statusDate: res.statusChangeDate,
          dayAmt: res.dayAvgRentAmt,
          goodsDetail: goodsDetail,
          userInfo: userInfo,
          serviceList: serviceList,
          feeDetail: feeDetail,
          timeControl: timeControl,
          status: res.status,
          shwoBuyoutDetail: shwoBuyoutDetail,
          buyOutDetail: buyOutDetail,
          currentPeriod: res.currentPeriod
        });
        that.setOrderStatus();
        // 设置优惠券信息
        this.setCouponInfo(res.couponOrderUseInfo);
      }
    });
  },
  // 设置优惠券信息
  setCouponInfo(coupon) {
    if (
      coupon &&
      // coupon.couponDeductResponse.term === this.data.currentPeriod &&
      coupon.couponDeductResponse.deductType === 'CASH'
    ) {
      let total = this.data.feeDetail.totalMoney;
      // let current = (Number(total * 100) - coupon.couponDeductResponse.actualPlanCouponDeductAmt * 100) / 100;
      let current = Utils.accSub(total, coupon.couponDeductResponse.actualPlanCouponDeductAmt);

      this.setData({
        coupon: coupon,
        currentMoney: current
      });
    }
  },
  onShow() {},
  // 分享
  onShareAppMessage() {
    console.log(app.shareObj);
    return app.shareObj.common;
  },
  setOrderStatus() {
    /**
     *  orderStatusStr @param'4已取消', '5待发货', '6待收货', '7租用中', '99已完结', '9归还中', '10买断中'
     *  orderStatusDes  @param '订单已取消','正在准备你的商品，请耐心等候','你的商品已经发货，请注意查收','请爱惜租用的商品，记得按期付款、归还，避免造成违约金','订单已经完结',
     *  orderClass  @param 'order_cancel', 'order_stay', 'order_mail', 'order_complete'
     * */
    var bizStatus = parseInt(this.data.bizStatus);
    var orderStatusArr = ['已取消', '待发货', '待收货', '租用中', '已完结', '回收中', '已拒收', '买断中'];
    var orderStatusDesArr = [
      '订单已取消',
      '正在准备你的商品，请耐心等候',
      '你的商品已经发货，请注意查收',
      '请爱惜租用的商品，记得按期付款、归还，避免造成违约金',
      '订单已经完结',
      '您的商品已送回物主基地，请耐心等待检测结果，如有疑问可随时咨询客服。',
      '拒收时，来回邮费由用户承担。邮费代扣成功后，订单将自动完结。',
      '您的订单正在买断中'
    ];
    var orderClassArr = [
      'order_cancel',
      'order_stay',
      'order_mail',
      'order_leasing',
      'order_complete',
      'order_recycleing'
    ];
    console.log('bizStatus==== ' + bizStatus);
    switch (bizStatus) {
      case 4:
        this.setData({
          orderStatusStr: orderStatusArr[0],
          orderStatusDes: orderStatusDesArr[0],
          orderClass: orderClassArr[0],
          showBtn: false
        });
        break;
      case 5:
        this.setData({
          orderStatusStr: orderStatusArr[1],
          orderStatusDes: orderStatusDesArr[1],
          orderClass: orderClassArr[1],
          showBtn: true
        });
        break;
      case 6:
        this.setData({
          orderStatusStr: orderStatusArr[2],
          orderStatusDes: orderStatusDesArr[2],
          orderClass: orderClassArr[2],
          showBtn: true
        });
        break;
      case 7:
        this.setData({
          orderStatusStr: orderStatusArr[3],
          orderStatusDes: orderStatusDesArr[3],
          orderClass: orderClassArr[3],
          showBtn: true
        });
        break;
      case 99:
        this.setData({
          orderStatusStr: orderStatusArr[4],
          orderStatusDes: orderStatusDesArr[4],
          orderClass: orderClassArr[4],
          showBtn: false
        });
        break;
      case 9:
        this.setData({
          orderStatusStr: orderStatusArr[5],
          orderStatusDes: orderStatusDesArr[5],
          orderClass: orderClassArr[5],
          showBtn: true
        });
        break;
      case 10:
        this.setData({
          orderStatusStr: orderStatusArr[7],
          orderStatusDes: orderStatusDesArr[7],
          orderClass: orderClassArr[4],
          showBtn: true
        });
        break;
      case 11:
        this.setData({
          orderStatusStr: orderStatusArr[6],
          orderStatusDes: orderStatusDesArr[6],
          orderClass: orderClassArr[5],
          showBtn: true
        });
        break;
    }
    // 买断完结
    if (this.data.status === '99005' && this.data.bizStatus === '99') {
      this.setData({
        orderStatusDes: '您的订单已成功买断。'
      });
    }
    // 强制买断完结
    if (this.data.status === '99008' && this.data.bizStatus === '99') {
      this.setData({
        // orderStatusDes: '你的订单按照合同约定已变更为买断状态，请保证你的支付宝账户内余额充足，扣款失败将导致违约。'
        orderStatusDes: '你的订单已成功买断'
      });
    }
  },
  // 费用部分icon被点击
  feeIconClick: function(event) {
    let feeItem = event.target.dataset.feeItem;
    this.setData({
      showToast: true,
      toastTitle: feeItem.itemName,
      toastContent: feeItem.itemDesc
    });
  },
  // 首期支付icon被点击
  firstBillIconClick: function(event) {
    console.log('首期应付');
    this.setData({
      showToast: true,
      toastTitle: '首期应付',
      toastContent:
        '首期支付金额=28天的租金+意外保障金（如有）+溢价（如有）；在签收商品后次日，支付宝会自动划扣首期租金并开始计算租期。'
    });
  },
  // 支付宝免密支付Icon被点击
  alipayIconClick: function(event) {
    // console.log('支付宝免密支付')
    this.setData({
      showToast: true,
      toastTitle: '支付宝免密支付',
      toastContent: '服务完结进行结算时，实际费用由商户发起向用户支付宝账户扣款'
    });
  },
  // 支付宝资金授权Icon被点击
  alipayAccreditClick: function(event) {
    console.log('支付宝资金授权');
    this.setData({
      showToast: true,
      toastTitle: '支付宝资金授权',
      toastContent: '用户使用服务时，通过支付宝账户资金渠道做相应金额的授权，并不产生实际消费'
    });
  },
  // 费用说明等弹框隐藏按钮被点击,注意一定要以on开头，否则会被处理为字符串
  onHideToastClick: function() {
    console.log('hideToastClick hideToastClick hideToastClick====');
    this.setData({
      showToast: false
    });
  },
  goLogisticsDetailPage() {
    my.navigateTo({
      url: '/pages/LogisticsDetail/LogisticsDetail?orderNo=' + this.data.orderNo
    });
  },
  goBillPage() {
    my.navigateTo({
      url: '/pages/viewBill/viewBill?orderNo=' + this.data.orderNo
    });
  },
  // 归还
  goGoodsReturn() {
    my.navigateTo({
      url: `/pages/GoodsReturn/GoodsReturn?orderNo=${this.data.orderNo}`
    });
  },
  // 续租
  goRelet() {
    my.alert({
      content:
        '受规则限制，续租时需要重新下单并申请免押，原押金将在原订单完结时自动解冻。当新订单发生买断时，原订单已支付租金依旧生效。',
      success: () => {
        my.navigateTo({
          url: `/pages/relet/ReletOrder?orderNo=${this.data.orderNo}`
        });
      }
    });
  },
  // 主动买断
  goBuyout() {
    my.navigateTo({
      url: `/pages/Buyout/Buyout?orderNo=${this.data.orderNo}&buyoutType=1`
    });
  },
  // 强制买断
  goForceBuyout() {
    my.navigateTo({
      url: `/pages/Buyout/Buyout?orderNo=${this.data.orderNo}&buyoutType=2`
    });
  },
  // 根据返回的item数据返回对应的按钮需要展示的链表
  getButtonsListStrWithItem(orderButtons, bizStatus) {
    let buttonListStr = '';
    if (orderButtons !== undefined && orderButtons instanceof Array) {
      for (let i = 0; i < orderButtons.length; i++) {
        let button = orderButtons[i];
        switch (button.buttonValue) {
          case 'CANCEL': {
            // 取消订单
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '1 ';
            }
            break;
          }
          case 'PAY': {
            // 支付
            if (button['isShow'] === 'Y' && bizStatus == '10') {
              buttonListStr = buttonListStr + '2 ';
            }
            break;
          }
          case 'LOGISTICS': {
            // 查看物流
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '3 ';
            }
            break;
          }
          case 'REPAIR': {
            // 维修
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '4 ';
            }
            break;
          }
          case 'BACK': {
            // 归还
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '5 ';
            }
            break;
          }
          case 'RELET': {
            // 续租
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '6 ';
            }
            break;
          }
          case 'BUY_OUT': {
            // 买断
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '7 ';
            }
            break;
          }
          case 'VIEW_BILLS': {
            // 查看账单
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '8 ';
            }
            break;
          }
          case 'CONTRACT_SERVICE':
            // 联系客服
            if (button['isShow'] === 'Y') {
              buttonListStr = buttonListStr + '9 ';
            }
            break;
          default:
            break;
        }
      }
    }
    return buttonListStr;
  }
});
