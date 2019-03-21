import http from '/util/http';
import { goToMiniProgram } from '/util/wuzhuUtil';

const app = getApp();
Page({
  data: {
    url: '',
    title: '',
    doFavorite: ''
  },
  onLoad(query) {
    console.log('ActivityHtml onLoad query = ' + JSON.stringify(query));
    let title = query.title;
    let originUrl = query.url + '?_r=' + Math.random();
    let doFavorite = query.doFavorite;
    // let encodeUrl = encodeURI(originUrl);
    // console.log('encodeUrl === ' + encodeUrl);
    this.setData({
      title: title,
      url: originUrl,
      doFavorite: doFavorite
    });
    if (doFavorite === '1') {
      this.onDoFavorite();
    }
  },
  // 分享
  onShareAppMessage() {
    console.log(app.shareObj);
    return app.shareObj.common;
  },
  onDoFavorite(res) {
    console.log('onDoFavorite res = ' + JSON.stringify(res));
    let that = this;
    // this.setData({
    //   doFavorite: true
    // });
    // // 收藏成功，保存
    // my.setStorageSync({
    //   key: 'favoriteData',
    //   data: {
    //     doFavorite: true
    //   }
    // });
    app.startLogin(
      function(res) {
        console.log('startLogin success, ' + JSON.stringify(res));
        that.postFavorite();
      },
      function(err) {
        console.log('startLogin fail, ' + JSON.stringify(err));
        my.confirm({
          title: '',
          content: '取消授权将无法领取优惠券，是否重新授权并领取优惠券',
          confirmButtonText: '领取优惠券',
          cancelButtonText: '放弃领券',
          success: (result) => {
            console.log(result);
            if (result && result.confirm) {
              that.onDoFavorite();
            } else {
              // do nothing
            }
          },
        });
      }
    );
  },
  postFavorite() {
    my.showLoading();
    let params = {
      channelNo: app.channelNo
    };
    http
      .post('/wuzhu/user/saveAliCollectRecord', params)
      .then(res => {
        console.log('postFavorite res = ' + JSON.stringify(res));
        my.hideLoading();
        if (res && res.code === '00') {
          // 已经领取优惠券，保存
          // my.setStorageSync({
          //   key: 'favoriteData',
          //   data: {
          //     getCoupon: true
          //   }
          // });
          if (res.data && res.data.length > 0) {
            // TODO 本次暂时取第一个 2019-1-8
            let data = res.data[0];
            let content = '领取成功，快去下单使用优惠券吧';
            if (data.promotionInfoVO) {
              let promotionInfoVO = data.promotionInfoVO;
              content = promotionInfoVO.partySuccessMsg;
            }
            my.showToast({ content: content });
            // my.confirm({
            //   title: '收藏成功',
            //   content: content,
            //   confirmButtonText: '查看优惠券',
            //   cancelButtonText: '去使用',
            //   success: (result) => {
            //     console.log(result);
            //     if (result && result.confirm) {
            //       my.navigateTo({
            //         url: '/pages/Coupons/Coupons'
            //       });
            //     } else {
            //       // do something
            //     }
            //   },
            // });
          }
        } else {
          my.showToast({ content: res && res.msg });
        }
      })
      .catch(err => {
        console.error(err);
        my.hideLoading();
      });
  },
  // 来自H5页面的消息
  msgFromWeb(e) {
    console.log('msgFromWeb e = ' + JSON.stringify(e));
    if (e && e.detail) {
      if (e.detail.categoryCode) {
        // 跳转到商品详情
        my.navigateTo({
          url: '/pages/GoodDetail/GoodDetail?categoryCode=' + e.detail.categoryCode
        });
      } else if (e.detail.phoneNumber) {
        // 拨打电话
        my.makePhoneCall({ number: e.detail.phoneNumber });
      } else if (e.detail.url){
        // 跳转页面
        let url = e.detail.url;
        if (e.detail.isTab === '1') {
          let currentPages = getCurrentPages().length;
          if (currentPages <= 1) {
            my.reLaunch({
              url: url
            });
          } else {
            my.switchTab({
              url: url
            });
          }
        } else {
          my.navigateTo({
            url: url
          });
        }
      } else if (e.detail.aliMiniProgram){
        // 跳转到其他支付宝小程序
        goToMiniProgram(e.detail.aliMiniProgram);
      }
    }
  }
});
