import http from '/util/http.js';

const app = getApp();
Page({
  data() {
    return {
      listData: [], // 获取的所有数据
      listTitles: ['进行中', '已完结', '已取消'],
      curTitle: '0', // 当前选中项
      border0: 'border-bottom: 4rpx solid transparent;',
      border2: 'border-bottom: 4rpx solid #FFC400;',
      index: 0, // 订单状态 -- 进行中、已完成
      underway: [], // 进行中
      completed: [], // 已完成
      canceled: [], // 已取消
      orderInfos: [], // 当前tab下的列表
      bizStatus: ''
    };
  },
  onLoad() {
    // console.log('>>> onLoad')
    this.getListData();
  },
  // 分享
  onShareAppMessage() {
    console.log(app.shareObj);
    return app.shareObj.common;
  },
  onShow() {},
  selectItem(e) {
    const index = e.target.dataset.value;
    this.setData({
      curTitle: index
    });
    this.setOrderListTab();
  },
  goDetailPage(e) {
    my.navigateTo({
      url: '/pages/orderDetail/orderDetail?orderNo=' + e.target.dataset.orderNo
    });
  },
  GoToPage(e) {
    var order = e.target.dataset.id;
    var item = e.target.dataset.items;
    if (order === 1) {
      // 取消订单 ======== 1期不做，联系客服取消
      console.log('>> 取消订单');
    } else if (order === 2) {
      // 支付
      // if (item.statusStr.split('-')[0] === '待支付') {
      // } else if (item.statusStr.split('-')[0] === '租赁中') {
      //   console.log('暂不支持');
      // }

      // 强制买断
      my.navigateTo({
        url: `/pages/Buyout/Buyout?orderNo=${item.orderNo}&buyoutType=2`
      });
    } else if (order === 3) {
      console.log('>> 查看物流');
      my.navigateTo({
        url: '/pages/LogisticsDetail/LogisticsDetail?orderNo=' + item.orderNo
      });
    } else if (order === 4) {
      console.log('>> 维修');
    } else if (order === 5) {
      my.navigateTo({
        url: `/pages/GoodsReturn/GoodsReturn?orderNo=${item.orderNo}`
      });
      console.log('>> 归还');
    } else if (order === 6) {
      console.log('>> 续租');
      my.alert({
        content:
          '受规则限制，续租时需要重新下单并申请免押，原押金将在原订单完结时自动解冻。当新订单发生买断时，原订单已支付租金依旧生效。',
        success: () => {
          my.navigateTo({
            url: `/pages/relet/ReletOrder?orderNo=${item.orderNo}`
          });
        }
      });
    } else if (order === 7) {
      console.log('>> 买断');
      my.navigateTo({
        url: `/pages/Buyout/Buyout?orderNo=${item.orderNo}&buyoutType=1`
      });
    } else if (order === 8) {
      console.log('>> 查看账单');
      my.navigateTo({
        url: '/pages/viewBill/viewBill?orderNo=' + item.orderNo
      });
    }
  },
  // 获取数据列表
  getListData() {
    let that = this;
    my.showLoading();
    let url = '/wuzhu/order/getMyOrders';
    let params = {
      bizStatus: '',
      status: '',
      intoChannel: app.channelNo
    };

    http.get(url, params).then(res => {
      console.log('orderList', res);

      my.hideLoading();
      if (res.code === '00' && res.data) {
        that.setData({
          listData: res.data,
          bizStatus: res.data.bizStatus
        });
        that.setOrderListTab();
      }
    });
  },
  // 设置根据内容分组对应tab
  setOrderListTab() {
    let that = this;
    let data = that.data.listData;
    that.dataPacket(data); // 数据分组
    if (that.data.curTitle === 0) {
      that.setData({
        orderInfos: that.data.underway
      });
    } else if (that.data.curTitle === 1) {
      that.setData({
        orderInfos: that.data.completed
      });
    } else if (that.data.curTitle === 2) {
      that.setData({
        orderInfos: that.data.canceled
      });
    } else {
      that.setData({
        orderInfos: that.data.underway
      });
    }
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
            if (button['isShow'] === 'Y' && this.data.bizStatus === '10') {
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
  },
  // 数据分组 -- 按钮显示
  dataPacket(lists) {
    // console.log(lists)
    var that = this;
    var underway = [];
    var completed = [];
    var canceled = [];
    lists.map(function(item, index, array) {
      item.specContentList = String(item.specContentList)
        .split(',')
        .join('/');
      item.showBTN = that.getButtonsListStrWithItem(item.orderButtons);
      switch (parseInt(item.bizStatus)) {
        case 1: // 待确认
          underway.push(item); // 进行中
          break;
        case 2: // 待支付
          underway.push(item); // 进行中
          break;
        case 3: // 已支付
          underway.push(item); // 进行中
          break;
        case 4: // 取消订单
          canceled.push(item); // 已取消
          break;
        case 5: // 待发货
          underway.push(item); // 进行中
          break;
        case 6: // 已发货
          underway.push(item); // 进行中
          break;
        case 7: // 租赁中
          underway.push(item); // 进行中
          break;
        case 8: // 退货中
        case 9: // 回收中
        case 10: // 买断中
          underway.push(item); // 进行中
          break;
        case 99: // 完结
          completed.push(item); // 已完成
          break;
        case 11: // 完结
          completed.push(item); // 已完成
          break;
        default:
          underway.push(item); // 进行中
      }
      // 新的按钮展示逻辑
      if (item.showBTN.length) {
        item['hasBtn'] = true;
      } else {
        item['hasBtn'] = false;
      }
    });
    that.setData({
      underway: underway, // 进行中
      completed: completed, // 已完成
      canceled: canceled // 已取消
    });
  }
});
