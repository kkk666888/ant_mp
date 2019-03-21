import http from '/util/http.js';
const app = getApp();
Page({
  data: {
    model: {
      recommApplyNum: 0,
      monthApplyNum: 0
    }
  },
  getInviteInfo() {
    my.showLoading();
    http
      .get('/wuzhu/invite/getInviteInfo')
      .then(res => {
        my.hideLoading();
        if (res.code === '00' && res.data) {
          this.handleData(res.data);
          this.setData({
            model: res.data
          });
        } else {
          my.alert({ content: res.msg });
        }
      })
      .catch(e => {
        my.hideLoading();
      });
  },
  handleData(data) {
    if (data) {
      data.monthApplyNum = data.monthApplyNum || 0;
      data.recommApplyNum = data.recommApplyNum || 0;
    }
  },
  onReady() {
    this.getInviteInfo();
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  }
});
