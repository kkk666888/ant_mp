const app = getApp();
Page({
  data: {
    url: 'https://jindatest.dafyjk.com/dist/static/protocolHtml/用户租赁及服务协议（金达主体）.htm',
    baiduUrl: 'https://www.baidu.com',
    title: '协议'
  },
  onLoad(query) {
    console.log('接收到 query' + JSON.stringify(query));
    // 特别注意打开的协议不能包含中文名
    let title = query.protocol;
    let originUrl = query.protocolUrl;
    let encodeUrl = encodeURI(originUrl);
    console.log('encodeUrl === ' + encodeUrl);
    this.setData({
      title: title,
      url: encodeUrl
    });
  },
  onShow() {
    let tempTitle = this.data.title;
    console.log('标题设置====' + tempTitle);
    my.setNavigationBar({
      title: tempTitle
    });
  },
  // 分享
  onShareAppMessage() {
    console.log(app.shareObj);
    return app.shareObj.common;
  },
});
