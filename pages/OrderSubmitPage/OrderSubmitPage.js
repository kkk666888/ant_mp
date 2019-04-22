import http from '/util/http';
import Config from '/util/config';
import { getFeeDescStr, getLeaseStyleDesc, getPayStayleEnum, uploadThirdInterfaceLog } from '/util/wuzhuUtil';
import * as Utils from '/util/util';
const app = getApp();
let orderDepositStatus = {};
orderDepositStatus.no = 0; // 不免押金
orderDepositStatus.part = 1; // 免部分押金
orderDepositStatus.all = 2; // 全免

Page({
  data() {
    return {
      queryContractStatus: 'INIT',  // 查询合同的请求状态
      showSupplyInfo: false, // 是否显示补充资料的入口
      orderType: 0,
      remindProtocol: false, // 提示用户点击阅读协议
      submitOrderStatus: false, // 用于检验是否下单是否成功
      token: '', // 仅仅是为了测试方便而引入
      zmOrderNo: '', // 芝麻信用的订单号
      outOrderNo: '', // 商户的订单号即金达订单号
      receiverName: '',
      receiverTel: '',
      consigneeAddr: '',
      goodsDetail: {
        fullName: '',
        specContentList: '',
        dayAvgRentAmt: '',
        listImg: ''
      },
      feeDetail: {
        deepFreeAmount: '', // 身份认证减免金
        dayAvgRentAmt: '', // 每日租金
        totalDays: 0, // 租期
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
      deepFreeAmountShow: false,  // 身份认证减免金
      checkBoxImageUrl: '/image/common/choice_unchecked.png', // checkBox
      checkBoxChoose: false, // checkBox是否选定
      // protocolList: ['物主用户租赁及服务协议', '物主用户租赁协议及服务协议之补充协议'],
      protocolList: [],
      showToast: false, // 展示费用说明
      toastTitle: '意外保障金说明', //  展示标题
      toastContent:
        '意外保障服务仅针对全新商品的非人为意外损坏。包含手机内外屏、按键（不包含home键）的损坏。电脑系统及软件维护服务，意外落水或遭受液体泼溅、渗入导致的部分功能丧失或者失效(设备可开机，可被识别序列号)等状况。具体以物主或物主指定的第三方机构出具专业鉴定报告为准',
      showBottom: false, // 优惠券弹框
      getCouponsInfoUrl: '/wuzhu/order/queryCustomerCouponCheckedResponse', // 获取订单优惠券信息
      enabledCards: [], // 可使用的优惠券
      disabledCards: [], // 不可使用的优惠券
      defaultCoupon: null, // 默认选中的优惠券
      currentMoney: 0, // 优惠后金额
      isScroll: false,
      saveCouponInfoUrl: '/wuzhu/aliPayZmOrderController/saveBindCouponOrder' // 保存优惠券url
    };
  },
  onLoad(query) {
    console.warn('传过来的参数为=====' + JSON.stringify(query));
    this.setData({
      zmOrderNo: query.zmOrderNo,
      outOrderNo: query.outOrderNo,
      orderType: query.orderType ? query.orderType : 0
    });
    // 开始获取芝麻订单的详细信息
    this.httpGetOrderDetail();
  },
  onShow() {
    // 获取对应的token并且复制给data里面的token
    // var app = getApp();
    let token = app.Token;
    console.log('app <<<>>>>> ', JSON.stringify(app));
    console.info('app中拿到的token为:' + token);
    console.log(app.channelNo);
    console.info('设置了Token' + token);
    this.setData({
      token: token
    });
  },
  onReady() {},
  // 分享
  onShareAppMessage() {
    console.log(app.shareObj);
    return app.shareObj.common;
  },
  // HTTP获取当前芝麻订单的详情
  httpGetOrderDetail: function() {
    let that = this;
    let _orderNo = this.data.outOrderNo;
    // GET /aliPayZmOrderController/queryZimaOrderDetail
    let detailUrl = Config._hoststr + '/wuzhu/aliPayZmOrderController/queryZimaOrderDetail';
    let couponUrl = this.data.getCouponsInfoUrl;
    let param = {
      orderNo: _orderNo
    };
    my.showLoading();
    // 并发获取详情和优惠券
    Promise.all([http.get(detailUrl, param), http.get(couponUrl, param)])
      .then(([resDetail, resCoupon]) => {
        console.log('res', resDetail, resCoupon);
        my.hideLoading();
        let msg = '';
        if (resDetail.code === '00') {
          this.parseHttpResult(resDetail.data);
        } else {
          msg += resDetail.msg;
        }
        if (resCoupon.code === '00') {
          this.handleCouponData(resCoupon.data);
        } else {
          msg += resCoupon.msg;
        }
        if (msg.length) {
          my.showToast({
            content: msg
          });
        }
      })
      .catch(err => {
        console.log('err', err);

        my.hideLoading();
      });
  },
  // 处理优惠券数据,分组
  handleCouponData(data) {
    console.log('coupondata', data);
    let enabled = [];
    let disabled = [];
    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      if (element.selectStatus === 'Y') {
        this.setDeduct(element);
      }
      if (element.status) {
        let nItem = { ...element };
        nItem['available'] = '0';
        nItem['operation'] = 'radio';
        nItem['footer'] = `有效期：${Utils.formatDateInCN(
          element.customerCouponInfoVO.beginTime
        )}——${Utils.formatDateInCN(element.customerCouponInfoVO.endTime)}`;
        enabled.push(nItem);
      } else {
        let oItem = { ...element };
        oItem['available'] = '1';
        oItem['operation'] = '';
        oItem['footer'] = `有效期：${Utils.formatDateInCN(
          element.customerCouponInfoVO.beginTime
        )}——${Utils.formatDateInCN(element.customerCouponInfoVO.endTime)}`;
        disabled.push(oItem);
      }
    }
    this.setData({
      enabledCards: enabled,
      disabledCards: disabled
    });
  },
  // 计算折扣金额
  setDeduct(coupon) {
    // 折扣的首期
    if (coupon.couponDeductResponse.term === '1' && coupon.couponDeductResponse.deductType === 'CASH') {
      let total = this.data.feeDetail.totalMoney;

      let current = Utils.accSub(total, coupon.couponDeductResponse.actualPlanCouponDeductAmt);
      this.setData({
        defaultCoupon: coupon,
        currentMoney: current
      });
    }
    // console.log('coup', this.data.defaultCoupon);
  },
  // 解析获取到的订单详情内容
  parseHttpResult: function(data) {
    // 支付方式文字描述
    let rentInfo = data && data['rentInfo'];
    let payStyle = rentInfo && rentInfo['payStyle']; //  支付方式
    let payStyleStr = getLeaseStyleDesc(payStyle); //   支付方式
    let commodity = data && data['commodity'];
    let fullName = commodity && commodity['fullName'];
    let specContentList = commodity && commodity['specContentList'];
    let listImg = commodity && commodity['listImg'];
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
    let receiverName = rentInfo && rentInfo['receiverName']; // 收件人姓名
    let receiverTel = rentInfo && rentInfo['receiverTel']; // 收件人手机号
    let consigneeAddr = rentInfo && rentInfo['consigneeAddr']; // 收件人地址

    // 附加服务列表
    let serviceFeeList = data && data['serviceFeeList']; // 附加服务列表，此处费用显示逻辑和商品详情部分一致
    let serviceFeeInfoList = this.getServiceFeeList(serviceFeeList);

    // 协议
    let protocolList = data && data['pdfFileList'];

    let goodsDetail = {
      fullName: fullName,
      specContentList: specContentList,
      dayAvgRentAmt: dayAvgRentAmt,
      listImg: listImg
    };

    let payStyleEnum = getPayStayleEnum(payStyle);
    let firPayAmt = '';
    if (payStyleEnum === 1) {
      // 如果是一次性支付
      firPayAmt = onepayAmt;
    } else {
      firPayAmt = termFirstPayAmt;
    }


    // 判断是否显示深度免押入口
    let showSupplyInfo = (data.deepExemption === 'Y') ? true : false;
    if (showSupplyInfo) {
      my.confirm({
        title: '',
        content: '仅需一步认证，即刻减免更多押金',
        confirmButtonText: '立即减免',
        cancelButtonText: '稍后了解',
        success: result => {
          console.log(result);
          if (result && result.confirm) {
            this.gotoIDOcr();
          } else {
            // do nothing
          }
        }
      });
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

    this.setData({
      deepFreeAmountShow: deepFreeAmountShow,
      receiverName: receiverName,
      receiverTel: receiverTel,
      consigneeAddr: consigneeAddr,
      goodsDetail: goodsDetail,
      feeDetail: feeDetail,
      showSupplyInfo: showSupplyInfo,
      protocolList: protocolList
    });
  },

  // 根据押金的状态处理对应的data
  // 入参： 押金金额  授信金额
  dealDeposit: function(orderDepositAmt, orderCreditAmt) {
    // 押金全免
    let orderDeposit = orderDepositStatus.no;
    if (orderCreditAmt === 0) {
      orderDeposit = orderDepositStatus.no;
    } else if (orderCreditAmt >= orderDepositAmt) {
      orderDeposit = orderDepositStatus.all;
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
        depositAmtShow = true;
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
    return serviceFeeInfoList;
  },
  // 调用蚂蚁的确认
  mySureOrder: function() {
    console.log('调用蚂蚁确认订单接口');
    let that = this;
    let order = this.data.outOrderNo;
    let zmOrder = this.data.zmOrderNo;
    my.showLoading();
    my.zmRentTransition({
      creditRentType: 'signPay' /*信用租固定 */,
      outOrderNo: order /** 外部订单号*/,
      zmOrderNo: zmOrder /** 芝麻订单号*/,
      success: res => {
        my.hideLoading();
        console.log('====== 支付宝回调结果' + JSON.stringify(res));
        console.info('调用蚂蚁确认订单接口成功' + JSON.stringify(res));
        /*返回的例子
         * success":true,"out_order_no":"00220180606Q001014511912","order_status":"SUCCESS","order_create_time":"2018-06-06 14:50:03","zm_order_no":"2018060600001001084475979486"}*/
        let success = res && res['success'];
        let order_status = res && res['order_status'];
        let errorCode = res && res['error_code'];
        // 2018-7-27 modify by hanfeng
        // 支付宝前端返回的bug，有时候会没有error_code这个参数，导致下单后前端判断是失败，后台通知是成功
        // 如果有error_code这个参数，则判断error_code和order_status是否都为success。 如果没有error_code，则只判断order_status是否为success
        if (order_status === 'SUCCESS' && (errorCode === 'SUCCESS' || errorCode === undefined)) {
          that.gotoOrderResult(true);
          // that.updateZimaOrderToWuzhu()
        } else {
          // 如果用户点击取消的情况下，直接按返回键的时候，将会返回
          // {"resultStatus":"6001"}
          let resultStatus = res && res['resultStatus'];
          if (!errorCode && resultStatus === '6001') {
            errorCode = 'USER_CANCEL';
          }
          that.gotoOrderResult(false, errorCode);
        }

        that.uploadZmRentTransitionLog(
          {
            creditRentType: 'signPay',
            outOrderNo: order,
            zmOrderNo: zmOrder
          },
          res,
          '1'
        );
      },
      fail: res => {
        // 网络失败停在原来的页面上不做处理
        my.hideLoading();
        console.log(res);
        console.info('调用蚂蚁确认订单接口失败' + JSON.stringify(res));
        let errorCode = res && res['error_code'];
        that.gotoOrderResult(false, errorCode);
        that.uploadZmRentTransitionLog(
          {
            creditRentType: 'signPay',
            outOrderNo: order,
            zmOrderNo: zmOrder
          },
          res,
          '2'
        );
      }
    });
  },
  // 绑定优惠券
  saveCouponInfo() {
    // if (this.data.couponFlag <= 0) {
    //   return false;
    // }
    // this.setData({
    //   couponFlag: this.data.couponFlag--
    // });
    let params = {
      orderNo: this.data.outOrderNo,
      receiveNo: this.data.defaultCoupon.customerCouponInfoVO.receiveNo
    };
    http
      .post(this.data.saveCouponInfoUrl, params)
      .then(res => {
        console.log('couponSave', res);
      })
      .catch(err => {
        console.error(err);
        // this.saveCouponInfo();
      });
  },
  // 上传zmRentTransition日志
  uploadZmRentTransitionLog(req, res, status) {
    let params = {
      uniqueIdenty: 'my.zmRentTransition',
      type: '11',
      requestParam: JSON.stringify(req),
      responseParam: JSON.stringify(res),
      status: status, // 状态：1成功2失败
      logSource: '0' // 请求发起来源 0:前端发起；1=后端发起
    };
    console.log('params:' + params);
    uploadThirdInterfaceLog(params);
  },
  // 跳转到订单详情页面
  // result true 表示成功  false 表示失败
  // errorCode 芝麻订单失败的情况需要传入，否则不需要传入
  gotoOrderResult: function(result, errorCode) {
    this.setData({
      submitOrderStatus: result
    });
    let zmOrderNo = this.data.zmOrderNo;
    let outOrderNo = this.data.outOrderNo;
    let orderType = this.data.orderType;
    let receiveNo = 'N';
    // if (this.data.defaultCoupon) {
    //   receiveNo = this.data.defaultCoupon.customerCouponInfoVO.receiveNo;
    // }
    if (result === true) {
      // 成功后关闭本页面跳转订单下单结果页
      my.redirectTo({
        url: `./../OrderResultPage/OrderResultPage?zmOrderNo=${zmOrderNo}&outOrderNo=${outOrderNo}&result=success&orderType=${orderType}`
      });
    } else {
      // 跳转订单下单结果页
      my.navigateTo({
        url:
          './../OrderResultPage/OrderResultPage?zmOrderNo=' +
          zmOrderNo +
          '&outOrderNo=' +
          outOrderNo +
          '&result=' +
          'fail' +
          '&errorCode=' +
          errorCode
      });
    }
  },
  // 确认按钮被点击
  clickSubmit: function(event) {
    console.log('开始调用蚂蚁金服的确认订单接口' + event);
    // 先判断是否阅读了协议
    if (this.data.checkBoxChoose === false) {
      if (this.data.remindProtocol === false) {
        this.setData({
          remindProtocol: true
        });
        // 调用下对应的draw方法
        this.draw();
      }
    } else {
      if (this.data.submitOrderStatus === true) {
        my.alert({
          title: '',
          content: '该订单已提交成功，请勿重复提交',
          buttonText: '确定',
          success: () => {
            my.navigateBack({
              delta: 10
            });
          }
        });
      } else {
        if (this.data.defaultCoupon) {
          this.saveCouponInfo();
        }

        this.mySureOrder();
      }
    }
  },
  // 协议被点击
  protocolClick: function(event) {
    let item = event.target.dataset.item;
    console.log('protocolClick = ' + JSON.stringify(item));
    if (item) {
      // 如果未生成合同，则查询
      if (item.contractCreatedStatus === 'N') {
        my.showToast({
          content: '请稍候...',
          duration: 1000,
        });
        this.queryContract();
        return;
      }
      let protocolName = item.templateName;
      let protocolUrl = encodeURIComponent(item.url);
      my.navigateTo({
        url: './../ProtocolHtml/ProtocolHtml?protocol=' + protocolName + '&protocolUrl=' + protocolUrl
      });
    }
    // console.log('protocolName = ' + protocolName);
    // let protocolUrl = '';
    // if (protocolName === '物主用户租赁及服务协议') {
    //   protocolUrl = Config._hoststr + '/doc/zfb/user_lease_agreement.htm';
    // } else if (protocolName === '物主用户租赁协议及服务协议之补充协议') {
    //   protocolUrl = Config._hoststr + '/doc/zfb/user_lease_supplementary_agreement.htm';
    // }
  },
  // 费用部分icon被点击
  feeIconClick: function(event) {
    let feeItem = event.target.dataset.feeItem;
    console.log('费用详细信息被点击了' + JSON.stringify(feeItem));
    this.setData({
      showToast: true,
      toastTitle: feeItem.feeName,
      toastContent: feeItem.feeDesc
    });
  },
  // 首期支付icon被点击
  firstBillIconClick: function(event) {
    this.setData({
      showToast: true,
      toastTitle: '首期应付',
      toastContent:
        '首期支付金额=28天的租金+意外保障金(如有)+溢价（如有）\n' +
        '在签收商品后次日，支付宝会自动划扣首期租金并开始计算租期。'
    });
  },
  // 支付宝免密支付Icon被点击
  alipayIconClick: function(event) {
    this.setData({
      showToast: true,
      toastTitle: '支付宝免密支付',
      toastContent: '服务完结进行结算时，实际费用由商户发起向用户支付宝账户扣款'
    });
  },
  // 支付宝免密支付授权Icon被点击
  alipayAccreditClick: function(event) {
    this.setData({
      showToast: true,
      toastTitle: '支付宝资金授权',
      toastContent: '用户使用服务时，通过支付宝账户资金渠道做相应金额的授权，并不产生实际消费\n'
    });
  },
  // 费用说明等弹框隐藏按钮被点击,注意一定要以on开头，否则会被处理为字符串
  onHideToastClick: function() {
    console.log('hideToastClick hideToastClick hideToastClick====');
    this.setData({
      showToast: false
    });
  },
  // CheckBox被点击
  onCheckBoxClick: function() {
    let select = this.data.checkBoxChoose;
    if (select === true) {
      this.setData({
        checkBoxChoose: false,
        checkBoxImageUrl: '/image/orderSubmit/choice_unchecked_3x.png' // checkBox
      });
    } else {
      this.setData({
        checkBoxChoose: true,
        checkBoxImageUrl: '/image/orderSubmit/choice_select_3x.png' // checkBox
      });
      // 关闭对应提示阅读协议的
      this.setData({
        remindProtocol: false
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
  },

  chooseCoupon() {
    this.setData({
      showBottom: true,
      isScroll: 'Y'
    });
    console.log('coupon', this.data.isSroll);
  },
  onPopupClose() {
    this.setData({
      showBottom: false,
      isScroll: 'N'
    });
  },
  clickCard(obj) {
    console.log('obj', obj);
    let cards = this.data.enabledCards;
    cards.map(item => {
      if (obj.id === item.customerCouponInfoVO.id) {
        item.selectStatus = 'Y';
        this.setDeduct(item);
      } else {
        item.selectStatus = 'N';
      }
    });
    this.setData({
      enabledCards: cards,
      isScroll: 'N'
    });
    setTimeout(() => {
      this.setData({
        showBottom: false
      });
    }, 200);
  },
  gotoIDOcr() {
    my.navigateTo({
      url: '/pages/IDOcr/IDOcr?orderNo=' + this.data.outOrderNo
    });
  },
  // 查询填充个人信息后的合同
  queryContract(templateCode = '') {
  // "templateName": "用户租赁及服务协议",
  // "templateCode": "RENT_CONTRACT",
  // "url": ""
  // "contractCreatedStatus": "Y" // Y表示已创建合同，N表示模板
    console.log('queryContract queryContractStatus = ' + this.data.queryContractStatus);
    let needQuery = true;
    switch (this.data.queryContractStatus) {
      case 'INIT':
        this.setData({
          queryContractStatus: 'ING'
        })
        break;
      case 'ING':
        needQuery = false;
        break;
      case 'FAIL':
        this.setData({
          queryContractStatus: 'ING'
        })
        break;
      case 'SUCCESS':
        needQuery = false;
        break;
      default:
        break;
    }
    console.log('queryContract needQuery = ' + needQuery);
    if (!needQuery) {
      return;
    }
    let params = {
      orderNo: this.data.outOrderNo,
      templateCode: templateCode
    };
    // my.showLoading();
    http
      .get('/wuzhu/order/queryContract', params)
      .then(res => {
        // my.hideLoading();
        console.log('queryContract res = ' + JSON.stringify(res));
        if (res.code === '00') {
          let protocolList = res.data;
          if (protocolList && protocolList.length > 0){
            let succ = true;
            for (let i = 0; i < protocolList.length; i++){
              if (protocolList[i].contractCreatedStatus !== 'Y') {
                succ = false;
                break;
              }
            }
            if (succ) {
              this.setData({
                queryContractStatus: 'SUCCESS',
                protocolList: protocolList
              });
            } else {
              this.setData({
                queryContractStatus: 'FAIL',
              });
            }
          } else {
            this.setData({
              queryContractStatus: 'FAIL',
            });
          }
        } else {
          // my.showToast({
          //   content: res.msg
          // });
          this.setData({
            queryContractStatus: 'FAIL',
          });
        }
      })
      .catch(err => {
        console.error(err);
        this.setData({
          queryContractStatus: 'FAIL',
        });
        // my.hideLoading();
      });
  }
});
