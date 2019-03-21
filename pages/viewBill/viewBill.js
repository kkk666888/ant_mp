import http from '/util/http.js';
import { addSeparator, dateFormat } from '/util/util.js';
const app = getApp();
Page({
  data: {
    model: {},
    showAliImg: false
  },
  onLoad(query) {
    if (query && query.orderNo) {
      this.getBillInfo(query.orderNo);
    }
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  getBillInfo(orderNo) {
    my.showLoading();
    http
      .get('/wuzhu/order/getOrderRepaymentDetail', { orderNo: orderNo })
      .then(res => {
        if (res.code === '00' && res.data) {
          this.handleData(res.data);
          this.setData({
            model: res.data
          });
          if (res.data.orderCreditAmt != 0 && res.data.orderCreditAmt <= res.data.orderDepositAmt) {
            this.setData({
              showAliImg: true
            });
          }
        } else {
          my.alert({ content: res.msg });
        }

        my.hideLoading();
      })
      .catch(e => {
        my.hideLoading();
      });
  },
  repaymentPlanListSort(data) {
    let result = [];
    let hasBeenPayment = [];
    if (data && data.length > 0) {
      data.forEach(item => {
        if (item.paymentStatus == '3') {
          hasBeenPayment.push(item);
        } else {
          result.push(item);
        }
      });
    }

    result = result.concat(hasBeenPayment);
    return result;
  },
  handleData(data) {
    //日租金
    data._dayAvgRentAmt = addSeparator(data.dayAvgRentAmt);
    //应还金额
    data._orderRentAmt = addSeparator(data.orderRentAmt);
    data._shouldAmt = addSeparator(data.shouldAmt);
    //已还金额
    data._alreadyRepaidAmt = addSeparator(data.alreadyRepaidAmt);
    //待还金额
    data._noRepaidAmt = addSeparator(data.noRepaidAmt);

    //账单排序
    data.repaymentPlanList = this.repaymentPlanListSort(data.repaymentPlanList || []);

    if (data.repaymentPlanList && data.repaymentPlanList.length > 0) {
      data.repaymentPlanList.forEach(item => {
        item._payDate = dateFormat(item.payDate, 'yyyy-MM-dd');
        item._settleDate = dateFormat(item.settleDate, 'yyyy-MM-dd');
        item._showMoney = addSeparator(item.principalBalanceAmt);
        item._className = '';
        switch (item.paymentStatus) {
          case '1':
            item._paymentStatus = '待还款';
            break;
          case '2':
            item._paymentStatus = '已还款，但未还清';
            break;
          case '3':
            item._paymentStatus = '已还款';
            item._className = 'hasBeenPayment';
            item._showMoney = addSeparator(item.actualPrincipalAmt);
            break;
          case '4':
            item._paymentStatus = '已逾期';
            break;
        }
      });
    }
  }
});
