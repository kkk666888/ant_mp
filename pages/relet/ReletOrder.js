import http from '/util/http';
import Config from '/util/config';
import { getFeeDescStr, uploadThirdInterfaceLog } from '/util/wuzhuUtil';
let orderDepositStatus = {};
orderDepositStatus.no = 0; // 不免押金
orderDepositStatus.part = 1; // 免部分押金
orderDepositStatus.all = 2; // 全免
const app = getApp();
Page({
  data() {
    return {
      recommendCode: app.recommendCode,
      outOrderNo: '', // 商户的订单号即金达订单号
      goodsDetail: {
        commodityNo: '', // 订单商品的commodityNo
        fullName: '', // 原订单商品名称
        specContentList: '', // 原订单商品规格
        dayAvgRentAmt: '', // 原订单商品日租金
        listImg: '', // 原订单商品图片
        reletAvgRentAmt: '', // 原订单续租日租金
        sourceStartDate: '', // 原订单租期开始日期
        sourceEndDate: '' // 原订单租期结束日期
      },
      orderCreditAmtShow: true, // 芝麻信用授权金额展示
      checkBoxImageUrl: '/image/common/choice_unchecked.png', // checkBox
      checkBoxChoose: false, // checkBox是否选定
      showToast: false, // 展示费用说明
      toastTitle: '意外保障金说明', //  展示标题

      financeProductList: [], // 租期列表
      chooseFinancialProduct: {}, // 用户选中的租期
      payStyleArray: [], // 支付方式的列表
      choosePayItem: {}, // 支付方式选择
      currServices: [], // 当前选中租期对应的增值服务
      chooseFeeList: [], // 当前选中的服务
      isClick: false
    };
  },
  onLoad(query) {
    console.warn('传过来的参数为=====' + JSON.stringify(query));
    this.setData({
      outOrderNo: query.orderNo
    });
  },
  onReady() {
    // 开始获取续租订单的详细信息
    this.getReletOrderDetail();
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  // HTTP获取当前续租订单的详情
  getReletOrderDetail: function() {
    let that = this;
    let _orderNo = this.data.outOrderNo;
    let detailUrl = Config._hoststr + '/wuzhu/renew/renewCommodity';
    let param = {
      orderNo: _orderNo
    };
    my.showLoading();
    http
      .get(detailUrl, param)
      .then(res => {
        my.hideLoading();
        if (res.code === '00') {
          // 开始解析对应的数据
          that.parseHttpResult(res.data);
          that.setData({
            isClick: true
          });
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
    console.log('data=' + JSON.stringify(data));
    // 商品详情
    let dayAvgRentAmt = data && data['sourceAvgRentAmt']; // 商品每日的租金
    let sourceStartDate = data && data['sourceStartDate'];
    let sourceEndDate = data && data['sourceEndDate'];
    let baseOrder = data && data['baseOrder'];
    let commodityNo = baseOrder && baseOrder['commodityNo'];
    let fullName = baseOrder && baseOrder['fullName']; // 商品名称
    let listImg = baseOrder && baseOrder['listImg']; // 商品图片
    let specContentList = baseOrder && baseOrder['specContentList']; // 商品规格
    let orderDepositAmt = baseOrder && baseOrder['orderDepositAmt']; // 押金金额
    let orderCreditAmt = baseOrder && baseOrder['orderCreditAmt']; // 授信金额
    // 判定下是部分免押 完全免押 无免押 押金金额  授信金额
    this.dealDeposit(orderDepositAmt, orderCreditAmt);

    // 金融产品列表
    let productList = data && data['productList'];
    // 续租租金
    let reletAvgRentAmt = productList && productList[0] && productList[0]['avgRentAmt']; // 续租租金

    // 支付方式
    let payStyle = productList && productList[0]['rentPayStyle']; //  支付方式
    this.initPayStyleArray(payStyle);

    let goodsDetail = {
      commodityNo: commodityNo,
      fullName: fullName,
      specContentList: specContentList,
      dayAvgRentAmt: dayAvgRentAmt,
      listImg: listImg,
      reletAvgRentAmt: reletAvgRentAmt,
      sourceStartDate: sourceStartDate,
      sourceEndDate: sourceEndDate
    };

    let firstListFeeInfo = productList && productList[0]['listFeeInfo'];
    firstListFeeInfo = this.initCurrFeeInfo(firstListFeeInfo);

    this.setData({
      goodsDetail: goodsDetail,
      financeProductList: productList,
      chooseFinancialProduct: productList && productList[0],
      currServices: firstListFeeInfo
    });
    this.refreashRentDayBtnsCssStyle();
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
    let orderCreditAmtShow = true; // 芝麻信用授权金额展示
    switch (orderDeposit) {
      case orderDepositStatus.no: {
        orderCreditAmtShow = false;
        break;
      }
      case orderDepositStatus.part: {
        orderCreditAmtShow = true;
        break;
      }
      case orderDepositStatus.all: {
        orderCreditAmtShow = true;
        break;
      }
      default: {
        console.info('押金状态有问题');
        break;
      }
    }
    this.setData({
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
  initCurrFeeInfo: function(firstListFeeInfo) {
    if (firstListFeeInfo) {
      for (let i = 0; i < firstListFeeInfo.length; i++) {
        const element = firstListFeeInfo[i];
        element.isChose = true;
        element.imgUrl = '/image/GoodDetail/icon-service_03.png';
      }
    }
    console.log('initCurrFeeInfo = ' + firstListFeeInfo);
    return firstListFeeInfo;
  },
  // 费用选取
  feeClick: function(event) {
    let feeItem = event.target.dataset.feeItem;
    console.log('feeClick ' + JSON.stringify(feeItem));
    // 当费用是可以取消的，才能点击
    if (feeItem.isCancelled === '1') {
      let currServices = this.data.currServices;
      for (let i = 0; i < currServices.length; i++) {
        const element = currServices[i];
        if (element.feeNo === feeItem.feeNo) {
          if (element.isChose) {
            element.isChose = false;
            element.imgUrl = '/image/orderSubmit/choice_unchecked_3x.png';
          } else {
            element.isChose = true;
            element.imgUrl = '/image/GoodDetail/icon-service_03.png';
          }
        }
      }
      this.setData({
        currServices: currServices
      });
    }
  },
  // 费用说明icon被点击
  feeIconClick: function(event) {
    let feeItem = event.target.dataset.feeItem;
    console.log('费用详细信息被点击了' + JSON.stringify(feeItem));
    this.setData({
      showToast: true,
      toastTitle: feeItem.feeName,
      toastContent: feeItem.feeDesc
    });
  },
  // 费用说明等弹框隐藏按钮被点击,注意一定要以on开头，否则会被处理为字符串
  onHideToastClick: function() {
    this.setData({
      showToast: false
    });
  },
  // 租赁天数按钮点击
  financialItemClick(e) {
    let financialItem = e.target.dataset.dayItem;
    // console.log('financialItem:' + JSON.stringify(financialItem));
    let chooseFinancialProduct = this.data.chooseFinancialProduct;
    if (financialItem && chooseFinancialProduct && financialItem.totalDays === chooseFinancialProduct.totalDays) {
      console.log('same product.');
      return;
    }
    let payItem = this.data.choosePayItem;
    let currServices = financialItem && financialItem['listFeeInfo'];
    currServices = this.initCurrFeeInfo(currServices);
    this.setData({
      chooseFinancialProduct: financialItem,
      choosePayItem: payItem,
      currServices: currServices
    });
    this.refreashRentDayBtnsCssStyle();
    this.initPayStyleArray(financialItem['rentPayStyle']);
  },
  // 更新租期按钮
  refreashRentDayBtnsCssStyle() {
    let listProduct = this.data.chooseFinancialProduct;
    let financeProductList = this.data.financeProductList;
    /*开始设置金融产品列表的 租赁天数部分的css状态*/
    for (let i = 0; i < financeProductList.length; i++) {
      let finalProductItem = financeProductList[i];
      if (finalProductItem.totalDays === listProduct.totalDays) {
        finalProductItem.cssName = 'kind-btn btn-golden';
      } else {
        finalProductItem.cssName = 'kind-btn';
      }
    }
    this.setData({
      financeProductList: financeProductList
    });
  },
  // 初始化支付方式
  initPayStyleArray: function(payStyle) {
    let tmpArray = payStyle.split(',');
    let tmpPayStyleArray = [];
    let choosePayItem = {};
    if (tmpArray && tmpArray.length > 0) {
      for (let index = 0; index < tmpArray.length; index++) {
        const element = tmpArray[index];
        let tmpPayItem = {};
        if (element === '0') {
          tmpPayItem.key = 0;
          tmpPayItem.name = '按月支付';
          tmpPayItem.cssName = 'kind-btn btn-golden';
          choosePayItem = tmpPayItem;
        } else if (element === '1') {
          tmpPayItem.key = 1;
          tmpPayItem.name = '一次性支付';
          tmpPayItem.cssName = 'kind-btn';
        } else {
          console.log('error payStyle. ' + element);
        }
        if (tmpPayItem.name) {
          tmpPayStyleArray.push(tmpPayItem);
        }
      }
    }
    this.setData({
      choosePayItem: choosePayItem,
      payStyleArray: tmpPayStyleArray
    });
  },
  // 支付方式按钮点击
  payItemClick(e) {
    let payItem = e.target.dataset.payItem;
    // console.log('payItem:' + JSON.stringify(payItem));
    let choosePayItem = this.data.choosePayItem;
    if (payItem && choosePayItem && payItem.key === choosePayItem.key) {
      console.log('same payItem.');
      return;
    }
    let payStyleArray = this.data.payStyleArray;
    /*开始设置金融产品列表的 租赁天数部分的css状态*/
    for (let i = 0; i < payStyleArray.length; i++) {
      let tmpItem = payStyleArray[i];
      if (tmpItem.key === payItem.key) {
        tmpItem.cssName = 'kind-btn btn-golden';
      } else {
        tmpItem.cssName = 'kind-btn';
      }
    }
    this.setData({
      payStyleArray: payStyleArray,
      choosePayItem: payItem
    });
  },
  // ------------------下单接口开始------------------
  // 确认下单
  confirmOrder() {
    let that = this;
    if (that.data.isClick) {
      that.setData({
        isClick: false
      });
    } else {
      console.log('isClick is false');
      return;
    }
    let chooseProduct = that.data.chooseFinancialProduct;
    console.log('chooseProduct = ' + JSON.stringify(chooseProduct));
    let choosePayItem = that.data.choosePayItem;
    let payWay = choosePayItem && choosePayItem.key;
    if (!that.data.goodsDetail.commodityNo) {
      my.showToast({
        type: 'none',
        content: '商品规格选择数据出错！',
        duration: 3000
      });
      return;
    }
    my.showLoading();
    // console.info('payWay: ', payWay);
    // console.info('Token: ', app.Token);
    console.info(app.isLogonRequest);
    app.startLogin(
      function(res) {
        console.log('startLogin success, ' + JSON.stringify(res));
        // 登录成功
        that.confrimPlaceOrderOnCreditEvaluation(chooseProduct, payWay);
      },
      function(err) {
        console.log('startLogin fail, ' + JSON.stringify(err));
        that.setData({
          // 恢复 按钮 状态
          isClick: true
        });
      }
    );
  },
  // 确认订单
  confrimPlaceOrderOnCreditEvaluation(chooseProduct, payWay) {
    let that = this;
    let feeList = [];
    let currServices = this.data.currServices;
    for (let i = 0; i < currServices.length; i++) {
      const element = currServices[i];
      if (element.isChose && element.isCancelled === '1') {
        feeList.push(element.feeNo);
      }
    }
    console.log('feeList ' + JSON.stringify(feeList));

    let params = {
      feeList: feeList, // 费用 -- 页面没有,
      recommCode: that.data.recommendCode, // 别人的邀请码
      byno: '', // 埋点的唯一标识
      loginMobile: '', // 手机
      gpsLongitude: app.userInfo.location && app.userInfo.location.longitude, // 经纬度
      gpsLatitude: app.userInfo.location && app.userInfo.location.latitude, // 经纬度
      commodityNo: that.data.goodsDetail.commodityNo,
      productNo: chooseProduct.productNo,
      payWay: payWay, // 0-分期; 1-一次性支付
      totaldays: chooseProduct.totalDays, // 选择的租赁天数，续租时需要该字段
      orderType: '1', // 是否续租订单标识：1：续租订单 0：正常下单
      orderNo: that.data.outOrderNo
    };
    console.log('confrimPlaceOrderOnCreditEvaluation params:' + JSON.stringify(params));
    my.showLoading();
    http
      .post('/wuzhu/aliPayZmOrderController/confrimPlaceOrderOnCreditEvaluation', params)
      .then(res => {
        if (res.code === '00' && res.data) {
          that.ZMCreditRent(res.data);
        } else {
          my.hideLoading();
          that.setData({
            // 恢复 按钮 状态
            isClick: true
          });
          my.alert({
            content: res.msg
          });
        }
      })
      .catch(err => {
        console.error(err);
        that.setData({
          // 恢复 按钮 状态
          isClick: true
        });
        my.hideLoading();
      });
  },
  // 免押评估接口
  ZMCreditRent(opt) {
    // console.log('ZMCreditRent opt=' + JSON.stringify(opt));
    let that = this;
    if (!opt.zmCategoryId) {
      my.alert({
        content: '商品配置错误：该商品类目为空!'
      });
      that.setData({
        // 恢复 按钮 状态
        isClick: true
      });
      my.hideLoading();
      return;
    }
    if (opt.totalPayAmt) {
      opt.totalPayAmt = parseFloat(opt.totalPayAmt).toFixed(2);
      opt.totalDepositAmt = parseFloat(opt.totalDepositAmt).toFixed(2);
    }
    my.startZMCreditRent({
      creditRentType: 'rent', // 固定传：rent
      category: opt.zmCategoryId, // 类目 -- 需提供，例如：'ZMSC_1_1_1'
      subject: {
        products: [
          {
            count: opt.commodityAccount, // 商品件数
            deposit: opt.totalDepositAmt, // 总押金
            installmentCount: opt.totalTerm, // 分期数
            name: encodeURI(opt.commdityShortName) // 商品名
          }
        ]
      },
      overdue_time: opt.overdueDate, // 逾期时间
      amount: opt.totalPayAmt, // 租金总金额
      deposit: opt.totalDepositAmt, // 押金总金额
      out_order_no: opt.orderNo, // 商户自己的订单号
      item_id: opt.itemId,
      // 订单处理 url，商户处理订单的页面,后续发送给用户订单继续处理的支付宝Card消息中，需要跳转该链接。如果没有链接，无法发送 支付宝Card消息。
      order_process_url:
        'alipays://platformapi/startapp?appId=' + Config.appid + '&query=xx%3dxx&page=pages/orderList/orderList',
      success: function(res) {
        if (res.orderNo) {
          my.setStorageSync({
            key: 'GoodDetailData',
            data: {
              ZMCreditRent: res
            }
          });
          that.upateZimaOrderInfo(res.orderNo, res.outOrderNo); // 更新订单
          that.uploadStartZMCreditRentLog(opt, res, '1');
        } else {
          that.uploadStartZMCreditRentLog(opt, res, '2');
        }
        that.setData({
          // 恢复 按钮 状态
          isClick: true
        });
        my.hideLoading();
      },
      fail: function(res) {
        that.setData({
          // 恢复 按钮 状态
          isClick: true
        });
        my.hideLoading();
        that.uploadStartZMCreditRentLog(opt, res, '2');
      },
      complete: function(res) {
        my.hideLoading();
        that.setData({
          // 恢复 按钮 状态
          isClick: true
        });
      }
    });
  },
  // 更新 订单
  upateZimaOrderInfo(zmOrderNo, outOrderNo) {
    console.log('upateZimaOrderInfo zmOrderNo = ' + zmOrderNo + ', outOrderNo = ' + outOrderNo);
    my.showLoading();
    http
      .post('/wuzhu/aliPayZmOrderController/upateZimaOrderInfo', {
        zmOrderNo: zmOrderNo,
        orderNo: outOrderNo
      })
      .then(res => {
        my.hideLoading();
        if (res.code == '00') {
          console.log('upateZimaOrderInfo ok');
          my.navigateTo({
            url:
              '/pages/OrderSubmitPage/OrderSubmitPage?zmOrderNo=' +
              zmOrderNo +
              '&outOrderNo=' +
              outOrderNo +
              '&orderType=1'
          });
        } else {
          my.alert({
            content: res.msg
          });
        }
      })
      .catch(err => {
        my.hideLoading();
        console.error(err);
      });
  },
  // 上传startZMCreditRent日志
  uploadStartZMCreditRentLog(opt, res, status) {
    let _requestParam = {
      creditRentType: 'rent', // 固定传：rent
      category: opt.zmCategoryId, // 类目 -- 需提供，例如：'ZMSC_1_1_1'
      subject: {
        products: [
          {
            count: opt.commodityAccount, // 商品件数
            deposit: opt.totalDepositAmt, // 总押金
            installmentCount: opt.totalTerm, // 分期数
            name: encodeURI(opt.commdityShortName) // 商品名
          }
        ]
      },
      overdue_time: opt.overdueDate, // 逾期时间
      amount: opt.totalPayAmt, // 租金总金额
      deposit: opt.totalDepositAmt, // 押金总金额
      out_order_no: opt.orderNo, // 商户自己的订单号
      item_id: opt.itemId
    };
    // console.log(_requestParam);
    let params = {
      uniqueIdenty: 'my.startZMCreditRent',
      type: '10',
      requestParam: JSON.stringify(_requestParam),
      responseParam: JSON.stringify(res),
      status: status, // 状态：1成功2失败
      logSource: '0' // 请求发起来源 0:前端发起；1=后端发起
    };
    // console.log('params:' + params);
    uploadThirdInterfaceLog(params);
  }
});
