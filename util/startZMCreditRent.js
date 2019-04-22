import http from '/util/http';
import Config from '/util/config';
import { uploadThirdInterfaceLog } from '/util/wuzhuUtil';

// 免押评估接口
export function startZMCreditRent(opt, completeCb, successCb, failCb) {
  console.log('startZMCreditRent opt = ' + opt +', completeCb = ' + completeCb
    + ', successCb = ' + successCb + ', failCb = ' + failCb);
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
      my.hideLoading();
      if (res.orderNo) {
        // my.setStorageSync({
        //   key: 'GoodDetailData',
        //   data: {
        //     ZMCreditRent: res
        //   }
        // });
        uploadStartZMCreditRentLog(opt, res, '1');
        upateZimaOrderInfo(res.orderNo, res.outOrderNo); // 更新订单
      } else {
        uploadStartZMCreditRentLog(opt, res, '2');
      }
      if (successCb) {
        successCb();
      }
    },
    fail: function(res) {
      my.hideLoading();
      uploadStartZMCreditRentLog(opt, res, '2');
      if (failCb) {
        failCb();
      }
    },
    complete: function(res) {
      if (completeCb) {
        completeCb();
      }
    }
  });
}

// 更新 订单
export function upateZimaOrderInfo(zmOrderNo, outOrderNo) {
  my.showLoading();
  // console.log('upateZimaOrderInfo');
  http
    .post('/wuzhu/aliPayZmOrderController/upateZimaOrderInfo', {
      zmOrderNo: zmOrderNo,
      orderNo: outOrderNo
    })
    .then(res => {
      my.hideLoading();
      if (res.code == '00') {
        my.navigateTo({
          url: '/pages/OrderSubmitPage/OrderSubmitPage?zmOrderNo=' + zmOrderNo + '&outOrderNo=' + outOrderNo
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
}

// 上传startZMCreditRent日志
export function uploadStartZMCreditRentLog(opt, res, status) {
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