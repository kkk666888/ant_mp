import http from '/util/http';
import { goToMiniProgram } from '/util/wuzhuUtil';

const app = getApp();

Page({
  data() {
    return {
      doFavorite: false,
      canIUseLifestyle: my.canIUse('lifestyle'),
      canIUseFavorite: my.canIUse('favorite'),
      bannerData: [],
      indicatorDots: true,
      autoplay: false, // 自动轮播
      vertical: false, // 垂直 or 横向
      interval: 3000, // 自动切换时间间隔
      circular: false, // 是否启用无限滑动
      resDatas: {},
      activeIdx: 0, // 激活的 tab
      tabMenu: [],
      tabDetail: [], // 二手优品,
      activityItem: {} // 活动图片
    };
  },
  onLoad(query) {
    console.log('index onLoad query:' + JSON.stringify(query));
    this.initData();
  },
  onShow() {
    console.log('index onShow');
  },
  onReady() {
    console.log('index onReady');
    this.gotoOtherPage();
  },
  onPullDownRefresh() {
    // 页面被下拉
  },
  onHide() {
    // 页面隐藏 -- 切换 tab 执行
    my.setStorageSync({
      key: 'IndexData',
      data: {
        activeIdx: this.data.activeIdx,
        tabMenu: this.data.tabMenu
      }
    });
    my.hideLoading();
  },
  onUnload() {
    // 页面被关闭
    my.hideLoading();
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  initData() {
    let _activeIdx = this.data.activeIdx;
    let _tabMenu = this.data.tabMenu;
    let storeRes = my.getStorageSync({ key: 'IndexData' }); // undefined or {}
    if (storeRes && storeRes.data) {
      _activeIdx = storeRes.data.activeIdx;
      _tabMenu = storeRes.data.tabMenu || [];
    }
    this.setData({
      // 清空之前的数据
      activeIdx: _activeIdx,
      tabDetail: []
    });
    let _typeNo = _tabMenu[_activeIdx] && _tabMenu[_activeIdx].datas && _tabMenu[_activeIdx].datas.typeNo;
    Promise.all([
      this.queryCommodityListPage(0, _typeNo || ''), // 查询商品首页数据
      this.queryHomeInfomation() // 获取 banner 数据
    ])
      .then(result => {
        console.log('promise all, ', result); //['成功了', 'success']
      })
      .catch(error => {
        console.log(error);
      });
  },
  gotoOtherPage() {
    // 2019-1-16 added by hf
    // 延迟500ms跳转，防止生命周期onLoad、onReady等方法未执行，页面无法响应
    setTimeout(() => {
      if (!this.gotoDetailWithCode()) {
        console.log('start gotoFavoritePage.');
        this.gotoFavoritePage();
      }
    }, 500);
  },
  testtest() {
    let _tabMenu = this.data.tabMenu;
    _tabMenu.push(_tabMenu[_tabMenu.length - 1]);
    this.setData({
      // 清空之前的数据
      tabMenu: _tabMenu
    });
  },
  // 从外部链接经过首页，跳转到商品详情
  gotoDetailWithCode() {
    let outCategory = my.getStorageSync({
      key: 'outCategoryCode'
    });
    console.log('index gotoDetailWithCode outCategory = ', outCategory);
    if (outCategory) {
      let outCategoryCode = outCategory.data;
      console.log('index gotoDetailWithCode outCategoryCode = ' + outCategoryCode);
      if (outCategoryCode) {
        my.hideLoading();
        my.setStorageSync({
          key: 'outCategoryCode',
          data: ''
        });
        my.navigateTo({
          url: '/pages/GoodDetail/GoodDetail?categoryCode=' + outCategoryCode
        });
        return true;
      }
    }
    return false;
  },
  // 从跳转到收藏有礼落地页
  gotoFavoritePage() {
    let favoriteInfo = my.getStorageSync({
      key: 'favoriteInfo'
    });
    console.log('index gotoFavoritePage favoriteInfo = ', favoriteInfo);
    if (favoriteInfo) {
      let data = favoriteInfo.data;
      console.log('index gotoFavoritePage data = ' + data);
      if (data) {
        my.setStorageSync({
          key: 'favoriteInfo',
          data: ''
        });
        // 跳转到活动页面
        my.navigateTo({
          url: '/pages/ActivityHtml/ActivityHtml?url=' + encodeURIComponent(data.url) + '&doFavorite=' + data.doFavorite
        });
      }
    }
  },
  // 根据 折旧系数 判断时“全新”还是“二手优品”
  depreciationRatio(res) {
    let _activeIdx = this.data.activeIdx;
    if (!(res && res.listCommodityCategory)) {
      console.error('>>> 商品列表 listCommodityCategory 数据出错');
      return false;
    }
    // 处理 商品内容
    let _tmp = [];
    let _tabDetail = {
      head: '二手优品',
      goods: []
    };
    let _tabDetailNew = {
      head: res.listCommodityType[_activeIdx].typeName,
      goods: []
    };
    for (let k in res.listCommodityCategory) {
      // 判断 折旧系数
      if (res.listCommodityCategory[k].depreciationRatio < 100) {
        _tabDetail.goods.push({
          detail: res.listCommodityCategory[k].shortName,
          img: res.listCommodityCategory[k].listImg,
          price: res.listCommodityCategory[k].leastRentDay,
          datas: res.listCommodityCategory[k]
        });
      } else {
        _tabDetailNew.goods.push({
          detail: res.listCommodityCategory[k].shortName,
          img: res.listCommodityCategory[k].listImg,
          price: res.listCommodityCategory[k].leastRentDay,
          datas: res.listCommodityCategory[k]
        });
      }
    }
    _tmp.push(_tabDetailNew);
    _tmp.push(_tabDetail);
    this.setData({
      tabDetail: _tmp
    });
  },
  // 处理 tab menu
  dealTabMenu(_activeIdx, res) {
    let _tabMenu = [];
    if (!(res && res.listCommodityType)) {
      console.error('>>> 商品列表 listCommodityType 数据出错');
      return false;
    }
    for (let i in res.listCommodityType) {
      if (i == _activeIdx) {
        _tabMenu.push({
          datas: res.listCommodityType[i],
          txt: res.listCommodityType[i].typeName,
          class: 'item-txt active'
        });
      } else {
        _tabMenu.push({
          datas: res.listCommodityType[i],
          txt: res.listCommodityType[i].typeName,
          class: 'item-txt'
        });
      }
    }
    this.setData({
      tabMenu: _tabMenu
    });
    my.setStorageSync({
      key: 'IndexData',
      data: {
        activeIdx: this.data.activeIdx,
        tabMenu: this.data.tabMenu
      }
    });
  },
  // 根据 tabDatas 处理 tabDetail
  dealTabDatas(isNew, res) {
    let _activeIdx = this.data.activeIdx;
    if (!(res && res.listCommodityCategory)) {
      console.error('>>> 商品列表 listCommodityCategory 数据出错');
      return false;
    }

    // 处理 商品内容
    let _head = '二手优品';
    if (isNew === 0) {
      _head = '全部商品';
    } else if (isNew === 1) {
      _head = '全新' + res.listCommodityType[_activeIdx].typeName;
    }
    let _tmp = {
      head: _head,
      goods: []
    };
    for (let k in res.listCommodityCategory) {
      _tmp.goods.push({
        detail: res.listCommodityCategory[k].shortName,
        img: res.listCommodityCategory[k].listImg,
        price: res.listCommodityCategory[k].leastRentDay,
        datas: res.listCommodityCategory[k]
      });
    }
    return _tmp;
  },
  // 点击 banner 图
  bannerClick(e) {
    let idx = e.target.dataset.idx;
    let _bannerData = this.data.bannerData[idx];

    if (_bannerData.categoryCode) {
      my.navigateTo({
        url: '/pages/GoodDetail/GoodDetail?categoryCode=' + _bannerData.categoryCode
      });
    } else if (_bannerData.imgLinkUrl) {
      // 跳转到活动页面
      my.navigateTo({
        url: '/pages/ActivityHtml/ActivityHtml?url=' + encodeURIComponent(_bannerData.imgLinkUrl)
      });
    } else if (_bannerData.aliMiniProgram) {
      // 跳转到其他支付宝小程序
      let aliMini = _bannerData.aliMiniProgram;
      goToMiniProgram(aliMini);
    }
  },
  activityClick() {
    let categoryCode = this.data.activityItem && this.data.activityItem.categoryCode;
    if (categoryCode) {
      my.navigateTo({
        url: '/pages/GoodDetail/GoodDetail?categoryCode=' + categoryCode
      });
    }
  },
  // 切换 tab
  switchTab(e) {
    let idx = e.target.dataset.idx;
    // console.log('switchTab idx = ' + idx + ', activeIdx = ' + this.data.activeIdx);
    if (idx === this.data.activeIdx) {
      console.log('same index.');
      return;
    }
    let _tabMenu = this.data.tabMenu;
    for (let i in _tabMenu) {
      _tabMenu[i].class = 'item-txt';
    }
    _tabMenu[idx].class = 'item-txt active';
    this.setData({
      activeIdx: idx,
      tabMenu: _tabMenu
    });
    // 查询对应的商品
    this.queryCommodityListPage(0, _tabMenu[idx].datas.typeNo);
  },
  // 跳转到商品详情
  goToDetail(e) {
    let idx = e.target.dataset.idx;
    let _tab = String(idx).split('_');
    if (_tab.length < 3) {
      my.alert({ content: '选择的商品数据出错' });
      return false;
    }
    let _selectGood = this.data.tabDetail[_tab[0]].goods[_tab[1]];
    let _categoryCode = _selectGood.datas && _selectGood.datas.categoryCode;
    my.navigateTo({
      url: '/pages/GoodDetail/GoodDetail?categoryCode=' + _categoryCode
    });
  },
  // 获取 banner 图
  queryHomeInfomation() {
    let that = this;
    return new Promise((resolve, reject) => {
      http
        .get('/wuzhu/homePageController/queryHomeInfomation', {
          openId: '',
          channelNo: app.channelNo
        })
        .then(res => {
          console.log('queryHomeInfomation ok.');
          if (res.code === '00' && res.data) {
            let banner_list = res.data.bannerData;
            let activityItem = {};
            let bannerData = [];
            for (var i in banner_list) {
              if (banner_list[i].type === '2') {
                activityItem = banner_list[i];
              } else {
                bannerData.push(banner_list[i]);
              }
            }
            that.setData({
              bannerData: bannerData,
              activityItem: activityItem
            });
          } else {
          }
          resolve('queryHomeInfomation resolve');
        })
        .catch(err => {
          console.error(err);
          // 异常也继续后续的跳转
          resolve('queryHomeInfomation resolve');
        });
    });
  },
  // 查询商品信息
  queryCommodityListPage(_isNew, _typeNo) {
    let that = this;
    return new Promise((resolve, reject) => {
      my.showLoading();
      http
        .get('/wuzhu/homePageController/queryCommodityListPage', {
          openId: '',
          channelNo: app.channelNo, // 渠道编号
          typeNo: _typeNo, // 商品类型编号
          isNew: _isNew, // 是否全新 0-全部;1-全新;2-二手优品
          pageNum: 1, // 分页页码-默认1，第一页
          maxRecordNum: 10, // 默认10条
          queryTypeFlag: 1 // 返回所有商品类型标识 0-不返回;1-返回
        })
        .then(res => {
          console.log('queryCommodityListPage ok.');
          my.hideLoading();
          if (res.code === '00') {
            if (res.data) {
              that.dealTabMenu(that.data.activeIdx, res.data); // 处理 menu
              that.depreciationRatio(res.data);
            } else {
              my.showToast({ content: 'result is null！' });
            }
          } else {
            my.alert({ content: res.msg });
          }
          resolve('queryCommodityListPage resolve');
        })
        .catch(err => {
          my.hideLoading();
          console.error(err);
          // 异常也继续后续的跳转
          resolve('queryCommodityListPage resolve');
        });
    });
  }
});
