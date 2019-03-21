const app = getApp();

Page({
  data: {
    phone: '4008396296',
    listData: {
      onItemTap: 'handleListItemTap',
      data: [
        {
          name: 'myOrder',
          title: '我的订单',
          arrow: 'horizontal'
        },
        {
          name: 'myCoupons',
          title: '我的优惠券',
          arrow: 'horizontal'
        },
        {
          name: 'inviteFriend',
          title: '邀请好友',
          arrow: 'horizontal'
        },
        {
          name: 'helpCenter',
          title: '帮助中心',
          arrow: 'horizontal'
        }
      ]
    }
  },
  handleListItemTap(e) {
    switch (e.currentTarget.dataset.name) {
      case 'myOrder':
        if (app.hasLogin()) {
          my.navigateTo({
            url: '/pages/orderList/orderList'
          });
        } else {
          app.startLogin();
        }
        break;
      case 'inviteFriend':
        if (app.hasLogin()) {
          my.navigateTo({
            url: '/pages/inviteFriend/inviteFriend'
          });
        } else {
          app.startLogin();
        }
        break;
      case 'helpCenter':
        my.navigateTo({
          url: '/pages/helpCenter/helpCenter'
        });
        break;
      case 'myCoupons':
        if (app.hasLogin()) {
          my.navigateTo({
            url: '/pages/Coupons/Coupons'
          });
        } else {
          app.startLogin();
        }
        break;
    }
  },
  makePhoneCall() {
    my.makePhoneCall({ number: this.data.phone });
  },
  onLoad(query) {
    // 获取用户信息
    console.info('Token: ', app.Token);
    console.info(app.isLogonRequest);
    app.startLogin(
      function(res) {
        console.log('startLogin success, ' + JSON.stringify(res));
      },
      function(err) {
        console.log('startLogin fail, ' + JSON.stringify(err));
      }
    );
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  }
});
