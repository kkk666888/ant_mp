import http from '/util/http';
import Config from '/util/config';
import { Intersect, addSeparator, formatDateInCN } from '/util/util';
import { goToMiniProgram, uploadThirdInterfaceLog, gotoIndex } from '/util/wuzhuUtil';
import { CategoryStatus, parseRentDayList } from '/util/goodsDetailHelp';
import questions from '/pages/GoodDetail/Q&A';
import { startZMCreditRent } from '/util/startZMCreditRent';
const app = getApp();

Page({
  data() {
    return {
      coupons: null, // 优惠券
      canGetCoupons: false, // 是否可以进行领取优惠券的操作
      showCoupons: false, // 优惠券弹框
      enabledCoupons: [], // 有效的优惠券
      disabledCoupons: [], // 无效的优惠券
      instructionInfo: '', // 优惠券使用说明
      isScroll: 'Y',
      getDetailStatus: 'INIT', // 获取商品详细信息的状态
      activity: null, // 活动
      recommendCode: app.recommendCode,
      // 2.50迭代增加买断系数
      buyoutRatio: 100,
      isShowAdvantageT: false,
      indicatorDots: true,
      autoplay: false, // 自动轮播
      vertical: false, // 垂直 or 横向
      interval: 3000, // 自动切换时间间隔
      circular: false, // 是否启用无限滑动
      baseInfo: {},
      resDatas: {},
      goodMsgVisible: 0, // 展示的内容
      marketPrice: {
        // 市场价
        min: '0',
        max: '0.00'
      },
      tabMenu: [
        {
          txt: '商品详情',
          class: 'item-txt active'
        },
        {
          txt: '租赁说明',
          class: 'item-txt'
        },
        {
          txt: '常见问答',
          class: 'item-txt'
        }
      ],
      categoryCode: '', // query 传过来的参数
      isDialogOpen: false,
      noteClass: 'fs-popup2', // 服务说明
      fsPopupClass: 'fs-popup',
      oderSel: {
        listCommodity: null,
        listProduct: null
      },
      listCommodityNumAll: [], // 总的
      listCommodityNum: [], // 统计用户选择的商品 -- 在不同规格限制下
      selectListProduct: {}, // 用户最终选择的商品
      headInfo: {
        // 弹出框
        img: '',
        price: 0,
        inventory: 0, // 默认有货
        describe: '有货',
        oneMonthPrice: 0
      },
      selectShowCat: [], // 已选择的 按钮
      showCat: [], // show category 展示品类
      showChooseTxt: '',
      addedServices: [
        {
          feeName: '意外保障',
          feeDesc: '用机无忧，物主平台提供的意外保障服务',
          imgUrl: '/image/GoodDetail/icon-service_03.png',
          detail: ''
        }
      ],
      showChoose: [],
      isClick: true, // foot btn
      // 增加对应的常见问题
      collapseData: questions, // 常见问答
      currentindex: -1, // 用于表示当前选择的index
      // 租赁说明使用
      // leastMonthRentAmt: '0',  // 最低月租金
      leaseDescShorName: '', // 该商品品类短名称
      leaseDescRentDay: 0, // 该商品品类下，最长最长租赁天数
      leaseDescRentTotal: 0, // 商品品类所有产品中的最低租金*最长的租赁天数
      leaseDescMarketPrice: 0, // 显示该商品品类中最小的价格
      leaseShowCompare: true, // 是否展示比较优势
      // 选择的商品 listCommodity
      userChooseGood: '', // 用户选定的对应的商品
      userChooseGoodTemp: {}, // 当选定了商品就直接写入这里
      // 增加租赁方式的选定的金融产品列表
      userChooseRentProductList: [], // 增加租赁方式的选定的金融产品列表
      userChooseRentItem: {},
      financeProductList: [], // 租期列表 里面包含的都是天数
      rentStyleArray: [], // 租赁方式的列表
      payStyleArray: [], // 支付方式的列表
      payChooseItem: {}, // 支付方式选择
      showRentImgList: false, // 是否显示租赁说明图，如果有则显示
      buttonText: '确定',
      showToast: false, // 展示费用说明
      toastTitle: '', //  展示标题
      toastContent: '',
      buyoutPriceMin: '0', // 买断金最低价，在详情展示
      buyoutPriceCurr: '0.00', // 当前选定商品的买断金，在选择完商品规格后展示
      marketPriceCurr: '0.00', // 当前选定商品的市场价，在选择完商品规格后展示
      userChooseFinancialProduct: {}
    };
  },
  onLoad(query) {
    // console.log('gooddetail onLoad query:' + JSON.stringify(query));
    let categoryCode = '';
    if (query && query.categoryCode) {
      categoryCode = query.categoryCode;
    } else {
      let outCategoryCode = my.getStorageSync({
        key: 'outCategoryCode'
      });
      categoryCode = outCategoryCode.data;
      // console.log('outCategoryCode = ' + categoryCode);
    }
    this.setData({
      // 设置商品信息 -- categoryCode
      noteClass: 'fs-popup2',
      fsPopupClass: 'fs-popup',
      categoryCode: categoryCode
    });
    // 清除本地存储的外部链接中的categoryCode
    my.setStorageSync({
      key: 'outCategoryCode',
      data: ''
    });

    this.switchTabByIdx(0);
    this.queryCommodityBaseInfo();
    this.querPromotionInfo();
    this.queryCoupons();
  },
  onReady() {},
  onHide() {},
  onUnload() {},
  onShareAppMessage() {
    let tmpShare = app.shareObj.commodityDetail;
    (tmpShare.title = tmpShare.title || '物主潮品租赁'),
      (tmpShare.desc = tmpShare.desc || this.data.leaseDescShorName),
      (tmpShare.imageUrl = tmpShare.imageUrl || this.data.headInfo.img);
    tmpShare.bgImgUrl = tmpShare.imageUrl;
    if (this.data.recommendCode) {
      tmpShare.path =
        'pages/GoodDetail/GoodDetail?from=share&categoryCode=' +
        this.data.categoryCode +
        '&invitationCode=' +
        this.data.recommendCode;
    } else {
      tmpShare.path = 'pages/GoodDetail/GoodDetail?from=share&categoryCode=' + this.data.categoryCode;
    }
    return tmpShare;
  },
  // 根据当前的日租金，返回对应的月租金
  getOneMonthPriceWithDayPrice: function(price) {
    let leaseDescRentTotal = parseInt(price * 30 + 0.5);
    return leaseDescRentTotal;
  },
  // 处理 展示品类 的数据
  dealShowCat(i, k) {
    let that = this;
    let _showChoose = this.data.showChoose;
    let _selectShowCat = [];
    let _showCat = this.data.showCat; // 展示的 按钮 信息
    let _listCommodityNum = [];
    let _allSelectNum = 0;
    if (!_showCat[i].btn[k].inStock) {
      console.log('>>> 没有库存的, 不做任何处理');
      return false;
    }
    for (let t in _showCat[i].btn) {
      // 将 该规格 的其它类型 isSelect 设为 false
      if (t != k && _showCat[i].btn[t].isSelect) {
        _showCat[i].btn[t].isSelect = false;
        _showCat[i].btn[t].state = 'kind-btn';
      }
    }
    // 处理 该类型
    if (_showCat[i].btn[k].isSelect) {
      // 2018-12-19 已选择则不处理
      console.log('cat btn is selected');
      return;
    } else {
      _showCat[i].btn[k].isSelect = true;
      _showCat[i].isClick = true;
      _showCat[i].selectNum = k;
      _showCat[i].btn[k].state = 'kind-btn btn-golden';
      _showChoose[i] = _showCat[i].btn[k].type;
    }
    // 1、处理其它 未选择的
    for (let p in this.data.listCommodityNumAll) {
      _listCommodityNum.push(this.data.listCommodityNumAll[p]);
    }
    for (let l = 0; l < _showCat.length; l++) {
      let _selectNum = _showCat[l].selectNum;
      if (_selectNum != -1) {
        // 已选择的 btn
        _selectShowCat.push(l); // 保存 已选择 按钮
        _allSelectNum++;
        _listCommodityNum = Intersect(_listCommodityNum, _showCat[l].btn[_selectNum].listCommodity);
      }
    }
    for (let l = 0; l < _showCat.length; l++) {
      if (!_showCat[l].isClick) {
        // 除去 已经选择的
        for (let ll = 0; ll < _showCat[l].btn.length; ll++) {
          let _tmpIn = Intersect(_listCommodityNum, _showCat[l].btn[ll].listCommodity);
          if (_tmpIn.length < 1) {
            _showCat[l].btn[ll].inStock = false;
            _showCat[l].btn[ll].state = 'kind-btn btn-gray';
          } else {
            _showCat[l].btn[ll].inStock = true;
            _showCat[l].btn[ll].state = 'kind-btn';
          }
        }
      }
    }
    // 2、处理 已选择的
    for (let f in _selectShowCat) {
      let cur = _selectShowCat[f];
      let _listCommodityNum3 = [];
      for (let p in this.data.listCommodityNumAll) {
        _listCommodityNum3.push(this.data.listCommodityNumAll[p]);
      }
      for (let l = 0; l < _showCat.length; l++) {
        let _selectNum = _showCat[l].selectNum;
        if (cur != l && _selectNum != -1) {
          // 已选择的 btn, 不包含当前的
          _listCommodityNum3 = Intersect(_listCommodityNum3, _showCat[l].btn[_selectNum].listCommodity);
        }
      }
      for (let ll = 0; ll < _showCat[cur].btn.length; ll++) {
        let _tmpIn = Intersect(_listCommodityNum3, _showCat[cur].btn[ll].listCommodity);
        if (_tmpIn.length < 1 && ll != _showCat[cur].selectNum) {
          _showCat[cur].btn[ll].inStock = false;
          _showCat[cur].btn[ll].state = 'kind-btn btn-gray';
        } else {
          _showCat[cur].btn[ll].inStock = true;
          if (!_showCat[cur].btn[ll].isSelect) {
            // 不处理 当前已选择规格的 按钮
            _showCat[cur].btn[ll].state = 'kind-btn';
          }
        }
      }
    }

    // 处理 “已选” 的展示
    let _showChooseTxt = '';
    for (let h in _showChoose) {
      if (_showChoose[h]) {
        _showChooseTxt += _showChoose[h];
        if (h != _showChoose.length - 1) {
          _showChooseTxt += ';';
        }
      }
    }
    let _selectListProduct = {}; // 用户选择的规格商品
    let _selectListCommodity = {};
    let _headInfo = this.data.headInfo;

    if (_listCommodityNum.length == 1) {
      // 确认好 规格
      let _tenancy = _showCat[_showCat.length - 2]; // 获取 “租期” 选项
      _selectListCommodity = this.data.resDatas.listCommodity[_listCommodityNum[0]];
      that.setData({
        userChooseGoodTemp: _selectListCommodity
      });
    } else {
    }

    // 渲染视图
    this.setData({
      selectShowCat: _selectShowCat,
      headInfo: _headInfo,
      showChoose: _showChoose,
      selectListProduct: _selectListProduct,
      showChooseTxt: _showChooseTxt,
      listCommodityNum: _listCommodityNum,
      showCat: _showCat
    });

    // 直接调用下需要监听的方法
    this.updateWithShowCatChoose();
    this.setAddedService();
  },
  // 获取商品规格
  _listCommodityCategorySpec() {
    let _resDatas = this.data.resDatas;
    let res = [];
    if (!(_resDatas && _resDatas.listCommodityCategorySpec)) {
      // console.error('>>> 商品规格 listCommodityCategorySpec 数据出错');
      return res;
    }
    // 根据 推荐系数 recommendNo 对 listCommodityCategorySpec 进行排序 -- 冒泡排序
    let com = _resDatas.listCommodityCategorySpec;
    for (let k = 0; k < com.length - 1; k++) {
      for (let t = 0; t < com.length - k - 1; t++) {
        if (com[t].recommendNo < com[t + 1].recommendNo) {
          // 比较的部分 -- 从大到小
          let _tmp = com[t];
          com[t] = com[t + 1];
          com[t + 1] = _tmp;
        }
      }
    }
    _resDatas.listCommodityCategorySpec = com;
    // 去重 -- 根据 typeAttrNo
    for (let i = 0; i < _resDatas.listCommodityCategorySpec.length; i++) {
      let isRepeat = false;
      let j = 0;
      for (; j < res.length; j++) {
        if (_resDatas.listCommodityCategorySpec[i].typeAttrNo == res[j].typeAttrNo) {
          // 比较的部分
          isRepeat = true;
          break;
        }
      }
      if (!isRepeat) {
        res.push({
          typeAttrNo: _resDatas.listCommodityCategorySpec[i].typeAttrNo,
          datas: [_resDatas.listCommodityCategorySpec[i]]
        });
      } else {
        res[j].datas.push(_resDatas.listCommodityCategorySpec[i]);
      }
    }
    return res;
  },
  // 确认 showCat -- 检查有无库存等
  _listCommoditySpec() {
    let _resDatas = this.data.resDatas;
    let _res = this._listCommodityCategorySpec(); // 取得 商品 规格

    // 构造出 showCat
    let _showCat = [];
    for (let i = 0; i < _res.length; i++) {
      _showCat.push({
        isClick: false, // 判断用户是否点击过
        title: _res[i].datas[0].specName,
        typeAttrNo: _res[i].typeAttrNo, // 新增规格类型No
        selectNum: -1,
        compare: [], // 用于对比 categorySpecCode
        btn: []
      });
      for (let j = 0; j < _res[i].datas.length; j++) {
        _showCat[i].btn.push({
          datas: _res[i].datas[j],
          type: _res[i].datas[j].specContent,
          categorySpecCode: _res[i].datas[j].categorySpecCode,
          listCommodity: [], // 缓存该规格的 商品编号
          state: 'kind-btn btn-gray',
          isSelect: false,
          inStock: false // 默认没有库存
        });
        _showCat[i].compare.push(_res[i].datas[j].categorySpecCode);
      }
    }
    let _listCommodityNum = [];
    // 在 _showCat[l].btn[p].listCommodity 中保存 该规格 对应的商品 num
    let _headInfoDescribe = this.data.headInfo.describe;
    if (!(_resDatas && _resDatas.listCommodity && _res.length > 0)) {
      _headInfoDescribe = '无货';
      // console.error('>>> listCommodity 数据出错');
    } else {
      let _listCommodity = _resDatas.listCommodity;
      this._marketPrice(_listCommodity); // 处理 市场价
      // btn 按钮中保存 对应的 listCommodity key
      for (let k in _listCommodity) {
        for (let t in _listCommodity[k].listCommoditySpec) {
          for (let l in _showCat) {
            for (let p in _showCat[l].btn) {
              // 商品规格 按钮
              if (_showCat[l].btn[p].categorySpecCode === _listCommodity[k].listCommoditySpec[t].categorySpecCode) {
                _showCat[l].btn[p].inStock = true;
                _showCat[l].btn[p].state = 'kind-btn';
                _showCat[l].btn[p].listCommodity.push(k);
              }
            }
          }
        }
        _listCommodityNum.push(k);
      }
    }
    // 渲染视图
    this.setData({
      'headInfo.describe': _headInfoDescribe,
      showCat: _showCat,
      listCommodityNum: _listCommodityNum,
      listCommodityNumAll: _listCommodityNum
    });
  },
  // 市场价 最小和最大
  _marketPrice(com) {
    // 根据 市场价 marketPrice 进行排序 -- 冒泡排序
    for (let k = 0; k < com.length - 1; k++) {
      for (let t = 0; t < com.length - k - 1; t++) {
        if (com[t].marketPrice > com[t + 1].marketPrice) {
          // 比较的部分 -- 从小到大
          let _tmp = com[t];
          com[t] = com[t + 1];
          com[t + 1] = _tmp;
        }
      }
    }
    let minPrice = com[0].marketPrice.toFixed(0);
    let maxPrice = addSeparator(com[com.length - 1].marketPrice);
    // 计算买断金，计算公式是：“该品类的最小的市场价*买断系数 - 该品类的最小每日租金*最大租期”
    let _buyoutPriceMin = ((minPrice * this.data.buyoutRatio) / 100 - this.data.leaseDescRentTotal).toFixed(0);
    if (isNaN(_buyoutPriceMin) || _buyoutPriceMin < 0) {
      _buyoutPriceMin = 0;
    }
    this.setData({
      'marketPrice.min': minPrice,
      'marketPrice.max': maxPrice,
      buyoutPriceMin: _buyoutPriceMin,
      buyoutPriceCurr: _buyoutPriceMin,
      marketPriceCurr: minPrice
    });
  },
  // 处理 支付方式
  _payment(_listCommodityNum, rentPayStyles) {
    try {
      rentPayStyles = JSON.parse(rentPayStyles);
    } catch (err) {
      console.error(err);
    }
    let res = {
      isClick: false, // 判断用户是否点击过
      title: '支付方式',
      selectNum: -1,
      compare: [], // 用于对比 categorySpecCode
      btn: [
        // 默认按钮都不能点击, 通过检查 rentPayStyles 激活按钮
        {
          datas: [],
          type: '一次性支付',
          payWay: '1',
          categorySpecCode: 't10001',
          listCommodity: [], // 缓存该规格的 商品编号
          state: 'kind-btn btn-gray',
          isSelect: false,
          inStock: false
        },
        {
          datas: [],
          type: '按月支付',
          payWay: '0',
          categorySpecCode: 't10001',
          listCommodity: [],
          state: 'kind-btn btn-gray',
          isSelect: false,
          inStock: false
        }
      ]
    };
    // rentPayStyles: "{"0":"分期","1":"一次性支付"}"
    for (let k in rentPayStyles) {
      if (k === res.btn[0].payWay) {
        res.btn[0].inStock = true;
        res.btn[0].state = 'kind-btn';
        res.btn[0].listCommodity = _listCommodityNum;
      } else if (k === res.btn[1].payWay) {
        res.btn[1].inStock = true;
        res.btn[1].state = 'kind-btn';
        res.btn[1].listCommodity = _listCommodityNum; // 缓存该规格的 商品编号
      }
    }
    return res;
  },
  // 处理 租期
  _tenancy(_listCommodity) {
    let res = {
      isClick: false, // 判断用户是否点击过
      title: '租期',
      selectNum: -1,
      compare: [], // 用于对比 categorySpecCode
      btn: []
    };
    for (let h = 0; h < _listCommodity.length; h++) {
      if (!_listCommodity[h].listProduct) {
        // listProduct 可能为 null
        continue;
      }
      for (let n = 0; n < _listCommodity[h].listProduct.length; n++) {
        let _tmp = {
          datas: [],
          specContent: _listCommodity[h].listProduct[n].totalDays, // 用于比较
          type: _listCommodity[h].listProduct[n].totalDays + '天',
          categorySpecCode: 't00001',
          listCommodity: [], // 缓存该规格的 商品编号
          state: 'kind-btn',
          isSelect: false,
          inStock: true
        };
        if (res.btn.length == 0) {
          _tmp.listCommodity.push(h);
          _tmp.datas.push({
            listCommodity: h,
            listProduct: n
          });
          res.btn.push(_tmp);
        } else {
          let isRepeat2 = false;
          for (let m = 0; m < res.btn.length; m++) {
            if (res.btn[m].specContent == _listCommodity[h].listProduct[n].totalDays) {
              isRepeat2 = true;
              res.btn[m].listCommodity.push(h);
              res.btn[m].datas.push({
                listCommodity: h,
                listProduct: n
              });
            }
          }
          if (!isRepeat2) {
            _tmp.listCommodity.push(h);
            _tmp.datas.push({
              listCommodity: h,
              listProduct: n
            });
            res.btn.push(_tmp);
          }
        }
      }
    }
    return res;
  },
  // 增值服务费用选取
  feeClick: function(event) {
    let feeItem = event.target.dataset.feeItem;
    // 当费用是可以取消的，才能点击
    if (feeItem.isCancelled === '1') {
      let addedServices = this.data.addedServices;
      for (let i = 0; i < addedServices.length; i++) {
        const element = addedServices[i];
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
        addedServices: addedServices
      });
    }
  },
  // 初始化增值费用
  initCurrFeeInfo: function(firstListFeeInfo) {
    if (firstListFeeInfo) {
      for (let i = 0; i < firstListFeeInfo.length; i++) {
        const element = firstListFeeInfo[i];
        if (element.isCancelled === '1') {
          element.isChose = false;
          element.imgUrl = '/image/orderSubmit/choice_unchecked_3x.png';
        } else {
          element.isChose = true;
          element.imgUrl = '/image/GoodDetail/icon-service_03.png';
        }
      }
    }
    return firstListFeeInfo;
  },
  // 选择 展示品类
  chooseTab(e) {
    let idx = e.target.dataset.idx;
    let _tab = String(idx).split('_');
    if (_tab.length < 2) {
      my.showToast({
        type: 'none',
        content: '展示品类选择数据出错',
        duration: 3000
      });
      return false;
    }
    this.dealShowCat(_tab[0], _tab[1]);
  },
  // 切换 tab -- 商品详情
  switchTab(e) {
    let idx = e.target.dataset.idx;
    let _tabMenu = this.data.tabMenu;
    for (let i in _tabMenu) {
      _tabMenu[i].class = 'item-txt';
    }
    _tabMenu[idx].class = 'item-txt active';
    this.setData({
      goodMsgVisible: idx,
      tabMenu: _tabMenu
    });
  },
  switchTabByIdx(idx) {
    let _tabMenu = this.data.tabMenu;
    for (let i in _tabMenu) {
      _tabMenu[i].class = 'item-txt';
    }
    _tabMenu[idx].class = 'item-txt active';
    this.setData({
      goodMsgVisible: idx,
      tabMenu: _tabMenu
    });
  },
  // 校验用户选择的数据
  verifyOrder() {
    let res = true;
    let _showCat = this.data.showCat;
    let userChooseRentItem = this.data.userChooseRentItem;
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;
    let payChooseItem = this.data.payChooseItem;
    // 检查商品是否是无货，无货则直接返回
    let headInfo = this.data.headInfo;
    if (headInfo.describe === '无货') {
      my.showToast({
        type: 'none',
        content: '该商品暂时无货，请更换商品',
        duration: 3000
      });
      return false;
    }
    for (let i in _showCat) {
      if (!_showCat[i].isClick) {
        res = false;
        my.showToast({
          type: 'none',
          content: '请先选择 “' + _showCat[i].title + '” 选项',
          duration: 3000
        });
        return false;
      }
    }

    // 增加对于租赁方式的判定
    if (JSON.stringify(userChooseRentItem) === '{}') {
      my.showToast({
        type: 'none',
        content: '请选择你的租赁方式',
        duration: 3000
      });
      return false;
    }
    if (JSON.stringify(userChooseFinancialProduct) === '{}') {
      my.showToast({
        type: 'none',
        content: '请选择你的租赁天数',
        duration: 3000
      });
      return false;
    }

    if (JSON.stringify(payChooseItem) === '{}') {
      my.showToast({
        type: 'none',
        content: '请选择你的支付方式',
        duration: 3000
      });
      return false;
    }
    return res;
  },
  // 确认下单
  confirmOrder() {
    let that = this;
    // console.log('>>> 确认下单');
    let _res = that.verifyOrder(); // 检验 showCat
    if (_res === false) {
      return;
    }
    let chooseProduct = that.data.userChooseFinancialProduct;
    let payChooseItem = that.data.payChooseItem;
    let payWay = payChooseItem && payChooseItem.key;

    if (!chooseProduct.commodityNo) {
      my.showToast({
        type: 'none',
        content: '商品规格选择数据出错！',
        duration: 3000
      });
    }
    // console.info('payWay: ', payWay);
    // console.info('Token: ', app.Token);
    // console.info(app.isLogonRequest);
    app.startLogin(
      function(res) {
        // console.log('startLogin success, ' + JSON.stringify(res));
        // 登录成功
        that.confrimPlaceOrderOnCreditEvaluation(chooseProduct, payWay);
      },
      function(err) {
        // console.log('startLogin fail, ' + JSON.stringify(err));
        that.setData({
          // 恢复 按钮 状态
          isClick: true
        });
      }
    );
  },
  // 确认订单
  confrimPlaceOrderOnCreditEvaluation(chooseProduct, payWay) {
    my.showLoading();
    let that = this;

    // 费用列表
    let feeList = [];
    let addedServices = this.data.addedServices;
    for (let i = 0; i < addedServices.length; i++) {
      const element = addedServices[i];
      if (element.isChose && element.isCancelled === '1') {
        feeList.push(element.feeNo);
      }
    }

    let params = {
      feeList: feeList, // 费用,
      recommCode: this.data.recommendCode, // 别人的邀请码
      byno: '', // 埋点的唯一标识
      loginMobile: '', // 手机
      gpsLongitude: app.userInfo.location && app.userInfo.location.longitude, // 经纬度
      gpsLatitude: app.userInfo.location && app.userInfo.location.latitude, // 经纬度
      commodityNo: chooseProduct.commodityNo,
      productNo: chooseProduct.productNo,
      payWay: payWay, // 0-分期; 1-一次性支付
      totaldays: 0, // 选择的租赁天数，续租时需要该字段
      orderType: '0', // 是否续租订单标识：1：续租订单 0：正常下单
      orderNo: '',
      payDepositAmtStyle: '002' // 押金支付方式，小程序信用租是002
    };
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
  recoveryClick() {
    this.setData({
      // 恢复 按钮 状态
      isClick: true
    });
  },
  // 免押评估接口
  ZMCreditRent(opt) {
    let that = this;
    if (!opt.zmCategoryId) {
      my.alert({
        content: '商品配置错误：该商品类目为空!'
      });
      that.recoveryClick();
      // that.setData({
      //   // 恢复 按钮 状态
      //   isClick: true
      // });
      my.hideLoading();
      return;
    }
    startZMCreditRent(opt, function (res) {
      that.setData({
        // 恢复 按钮 状态
        isClick: true
      });      
    });
    // if (opt.totalPayAmt) {
    //   opt.totalPayAmt = parseFloat(opt.totalPayAmt).toFixed(2);
    //   opt.totalDepositAmt = parseFloat(opt.totalDepositAmt).toFixed(2);
    // }
    // my.startZMCreditRent({
    //   creditRentType: 'rent', // 固定传：rent
    //   category: opt.zmCategoryId, // 类目 -- 需提供，例如：'ZMSC_1_1_1'
    //   subject: {
    //     products: [
    //       {
    //         count: opt.commodityAccount, // 商品件数
    //         deposit: opt.totalDepositAmt, // 总押金
    //         installmentCount: opt.totalTerm, // 分期数
    //         name: encodeURI(opt.commdityShortName) // 商品名
    //       }
    //     ]
    //   },
    //   overdue_time: opt.overdueDate, // 逾期时间
    //   amount: opt.totalPayAmt, // 租金总金额
    //   deposit: opt.totalDepositAmt, // 押金总金额
    //   out_order_no: opt.orderNo, // 商户自己的订单号
    //   item_id: opt.itemId,
    //   // 订单处理 url，商户处理订单的页面,后续发送给用户订单继续处理的支付宝Card消息中，需要跳转该链接。如果没有链接，无法发送 支付宝Card消息。
    //   order_process_url:
    //     'alipays://platformapi/startapp?appId=' + Config.appid + '&query=xx%3dxx&page=pages/orderList/orderList',
    //   success: function(res) {
    //     my.hideLoading();
    //     if (res.orderNo) {
    //       my.setStorageSync({
    //         key: 'GoodDetailData',
    //         data: {
    //           ZMCreditRent: res
    //         }
    //       });
    //       that.upateZimaOrderInfo(res.orderNo, res.outOrderNo); // 更新订单
    //       that.uploadStartZMCreditRentLog(opt, res, '1');
    //     } else {
    //       that.uploadStartZMCreditRentLog(opt, res, '2');
    //     }
    //     that.setData({
    //       // 恢复 按钮 状态
    //       isClick: true
    //     });
    //   },
    //   fail: function(res) {
    //     that.setData({
    //       // 恢复 按钮 状态
    //       isClick: true
    //     });
    //     my.hideLoading();
    //     that.uploadStartZMCreditRentLog(opt, res, '2');
    //   },
    //   complete: function(res) {
    //     // my.hideLoading();
    //     that.setData({
    //       // 恢复 按钮 状态
    //       isClick: true
    //     });
    //   }
    // });
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
  },
  // 服务说明
  serviceNote(e) {
    this.setData({
      isDialogOpen: true,
      noteClass: 'fs-popup2 fs-popup-show2'
    });
  },
  // 服务说明 -- 关闭
  closeDialog(e) {
    this.setData({
      isDialogOpen: false,
      noteClass: 'fs-popup2'
    });
  },
  // 关闭
  closeDiv() {
    this.setData({
      isDialogOpen: false,
      fsPopupClass: 'fs-popup'
    });
  },
  // 立即租赁 按钮
  LeaseNow() {
    // modified by hf 2019-1-9
    // console.log('LeaseNow getDetailStatus = ' + this.data.getDetailStatus);
    // 判断获取商品详细信息的状态
    switch (this.data.getDetailStatus) {
      case 'INIT':
        // 初始状态，则获取
        this.queryCommodityDetail(true);
        break;
      case 'DOING':
        // 进行中
        my.showToast({ content: '请稍候...' });
        break;
      case 'SUCCESS':
        // 获取成功，显示规格选择窗
        this.setData({
          isDialogOpen: true,
          fsPopupClass: 'fs-popup fs-popup-show'
        });
        break;
      case 'FAIL':
        // 获取失败，再次获取
        this.queryCommodityDetail(true);
        break;
      default:
        // 不应该出现其他状态
        console.warn('LeaseNow error Status');
        break;
    }
  },
  // 店铺
  shop() {
    gotoIndex();
  },
  // 客服
  customerService() {
    let _phone = '400-839-6296';
    my.makePhoneCall({
      number: _phone
    });
  },
  // 更新 订单
  upateZimaOrderInfo(zmOrderNo, outOrderNo) {
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
  },
  // 查询 商品库存
  queryAvaliCommodityStockQty(commodityNo, _selectListCommodity) {
    let that = this;
    my.showLoading();

    http
      .get('/wuzhu/homePageController/queryAvaliCommodityStockQty', {
        commodityNo: commodityNo,
        recommendCode: that.data.recommendCode
      })
      .then(res => {
        my.hideLoading();
        // console.log('queryAvaliCommodityStockQty res = ' + JSON.stringify(res));
        if (res.code === '00') {
          let storeNum = res.data;
          let _describe = that.data.headInfo.describe;
          let _isClick = this.data.isClick;
          let _buttonText = '确定';
          if (storeNum < 1) {
            _describe = '无货';
            _isClick = false;
            _buttonText = '无货';
            if (_selectListCommodity.isLimited == 0) {
              // 非限量, 没货也可以点击
              _describe = '有货';
              _isClick = true;
              _buttonText = '确定';
            }
          } else {
            _describe = '有货';
            _isClick = true;
            _buttonText = '确定';
          }
          that.setData({
            'headInfo.inventory': storeNum,
            'headInfo.describe': _describe,
            isClick: _isClick,
            buttonText: _buttonText
          });
        }
      })
      .catch(err => {
        my.hideLoading();
        console.error(err);
      });
  },
  // 查询商品基本信息 added by hf 2019-1-9
  queryCommodityBaseInfo() {
    let that = this;
    my.showLoading();
    http
      .get('/wuzhu/commodity/category/detail', {
        openId: '',
        channelNo: app.channelNo, // 渠道编号
        categoryCode: that.data.categoryCode,
        recommendCode: that.data.recommendCode
      })
      .then(res => {
        if (res.code === '00' && res.data) {
          // console.info(JSON.stringify(res));
          res.data.leastRentDay = addSeparator(res.data.leastRentDay);
          // 设置租赁说明函数
          let leastRentDay = res.data.leastRentDay;
          // 设置租赁说明相关
          that.setupLeaseDescValue(res.data);
          let tmpDetailImgUrls = [];
          if (res.data.detailImgUrls) {
            tmpDetailImgUrls = String(res.data.detailImgUrls).split(',');
          }
          let baseInfo = {};
          baseInfo.fullName = res.data.fullName;
          baseInfo.drainMsg = res.data.drainMsg;
          baseInfo.drainUrl = res.data.drainUrl;
          baseInfo.leastRentDay = leastRentDay;
          baseInfo.minPerformanceBond = res.data.minPerformanceBond;
          baseInfo.detailImgList = String(res.data.detailImgList).split(','); // 商品图片
          baseInfo.detailImg = String(res.data.detailImg).split(','); // 商品租机必看图片
          baseInfo.detailImgUrls = tmpDetailImgUrls; // 商品租赁说明图片
          baseInfo.leastMonthRentAmt = res.data.leastMonthRentAmt; // 最低月租金
          baseInfo.detailTag = res.data.detailTag; // 文字标签
          that.setData({
            showRentImgList: tmpDetailImgUrls && tmpDetailImgUrls.length ? true : false,
            baseInfo: baseInfo
          });
          my.hideLoading(); // 不知道为何前一个 my.hideLoading 没有效果
        } else {
          my.hideLoading();
          my.alert({
            content: res.msg
          });
        }
      })
      .catch(err => {
        console.error(err);
        my.hideLoading();
      });
  },
  // 查询 商品详情
  queryCommodityDetail(showLoading) {
    // console.log('queryCommodityDetail getDetailStatus = ' + this.data.getDetailStatus);
    if (this.data.getDetailStatus === 'DOING' || this.data.getDetailStatus === 'SUCCESS') {
      return;
    }
    let that = this;
    that.setData({
      getDetailStatus: 'DOING'
    });
    if (showLoading) {
      my.showLoading();
    }
    http
      .get('/wuzhu/homePageController/queryCommodityDetail', {
        openId: '',
        channelNo: app.channelNo, // 渠道编号
        categoryCode: that.data.categoryCode,
        recommendCode: that.data.recommendCode
      })
      .then(res => {
        if (res.code === '00' && res.data) {
          // console.info(JSON.stringify(res));
          res.data.leastRentDay = addSeparator(res.data.leastRentDay);
          // 设置租赁说明函数
          let leastRentDay = res.data.leastRentDay;
          let oneMonthPrice = that.getOneMonthPriceWithDayPrice(leastRentDay);
          let buyoutRatio = res.data.buyoutRatio;
          // 设置租赁说明相关
          that.setupLeaseDescValue(res.data);
          let tmpDetailImgUrls = [];
          if (res.data.detailImgUrls) {
            tmpDetailImgUrls = String(res.data.detailImgUrls).split(',');
          }

          that.setData({
            buyoutRatio: buyoutRatio,
            'headInfo.img': res.data.listImg.split(',')[0],
            'headInfo.price': leastRentDay,
            'headInfo.oneMonthPrice': oneMonthPrice,
            showRentImgList: tmpDetailImgUrls && tmpDetailImgUrls.length ? true : false,
            resDatas: res.data,
            // 获取成功，显示规格选择窗 modified by hf 2019-1-9
            getDetailStatus: 'SUCCESS',
            isDialogOpen: true,
            fsPopupClass: 'fs-popup fs-popup-show'
          });

          that._listCommoditySpec(); // 构造 按钮 数据
          that._constuctRentPlaneBtn(res.data); // 构造租赁方式和 已经 租期等按钮的数据

          // 设置推荐产品数据
          this.handelRecommendData(res.data, res.data.defaultProductNo, res.data.defaultCommodityNo);

          my.hideLoading(); // 不知道为何前一个 my.hideLoading 没有效果
        } else {
          that.setData({
            getDetailStatus: 'FAIL'
          });
          my.hideLoading();
          my.alert({
            content: res.msg
          });
        }
      })
      .catch(err => {
        console.error(err);
        my.hideLoading();
        that.setData({
          getDetailStatus: 'FAIL'
        });
      });
  },
  // 设置推荐产品
  handelRecommendData(data, productNo, commodityNo) {
    let commodity = data.listCommodity.find(item => {
      return item.commodityNo === commodityNo;
    });
    let parseData = this.data.showCat;
    let typeIndex = null; // 规格类型index
    let specIndex = null; // 规格index

    //  根据推荐商品的规格No搜索对应的规格
    for (let i = 0; i < commodity.listCommoditySpec.length; i++) {
      const element = commodity.listCommoditySpec[i];
      // 搜索对应的规格类型
      let specType = parseData.find(item => item.typeAttrNo === element.typeAttrNo);
      typeIndex = parseData.findIndex(item => item.typeAttrNo === element.typeAttrNo);
      // 搜索规格
      specIndex = specType.btn.findIndex(specItem => {
        return specItem.categorySpecCode === element.categorySpecCode;
      });
      // 根据索引设置选中规格
      this.dealShowCat(typeIndex, specIndex);
    }

    // 搜索推荐产品
    let product = commodity.listProduct.find(item => item.productNo === productNo);
    let [financeProductList, rentStyleArray] = parseRentDayList(data);
    // 搜索租赁方式
    let rentStyle = rentStyleArray.find(item => item.rentSolution === product.rentSolution);
    // 搜索租期
    let rentDay = financeProductList.find(item => item.totalDays === product.totalDays);
    let rentItem = {
      target: {
        dataset: {
          rentItem: rentStyle
        }
      }
    };
    let dayItem = {
      target: {
        dataset: {
          dayItem: rentDay
        }
      }
    };
    this.setData({
      userChooseRentItem: rentStyle
    });
    this.rentItemClick(rentItem);
    this.financialItemClick(dayItem);
  },
  // 查询商品品类对应的活动
  querPromotionInfo() {
    let that = this;
    http
      .post('/wuzhu/homePageController/querPromotionInfo', {
        categoryCode: that.data.categoryCode,
        channelNo: app.channelNo, // 渠道编号
        recommendCode: that.data.recommendCode
      })
      .then(res => {
        // console.info('querPromotionInfo res = ' + JSON.stringify(res));
        if (res.code === '00') {
          if (res.data && res.data.length > 0) {
            // TODO 本次暂时取第一个 2019-1-8
            let data = res.data[0];
            let activity = {};
            activity.bannerUrl = data.bannerUrl; // 活动banner
            activity.isShow = data.isShow;
            activity.partDetailMsg = data.partDetailMsg; // 活动参与方式详细说明
            activity.partShortMsg = data.partShortMsg; // 活动参与方式短说明
            activity.promotionDetailMsg = data.promotionDetailMsg; // 活动详细说明
            activity.promotionJumpUrl = data.promotionJumpUrl; // 活动图片跳转连接地址
            activity.promotionName = data.promotionName; // 活动名称
            activity.promotionNo = data.promotionNo; // 活动编号
            activity.promotionShortName = data.promotionShortName; // 活动短说明
            activity.aliMiniProgram = data.aliMiniProgram; // 活动调换到小程序的参数
            this.setData({
              activity: activity
            });
          }
        } else {
          my.showToast({
            content: res.msg
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  },
  // 设置租赁说明的函数
  // 初始化租赁说明里面的内容 https 返回的res.data
  setupLeaseDescValue: function(parseData) {
    let leaseDescShorName = parseData && parseData.shortName;
    let leaseDescRentDay = parseData && parseData.maxRentalDays;
    let tempDayPrice = parseData && parseData.leastRentDay; // res.data.leastRentDay;
    let leaseDescRentTotal = parseInt(tempDayPrice * leaseDescRentDay + 0.5);
    let leaseDescMarketPrice = this.getMinMarketPrict(parseData.listCommodity);
    let leaseShowCompare = false;
    // 租金大于市场价80%不显示租赁优势 不展示优势
    if (leaseDescRentTotal >= leaseDescMarketPrice * 0.8) {
      leaseShowCompare = false;
    } else {
      leaseShowCompare = true;
    }
    this.setData({
      leaseDescShorName: leaseDescShorName, // 该商品品类短名称
      leaseDescRentDay: leaseDescRentDay, // 该商品品类下，最长最长租赁天数
      leaseDescRentTotal: leaseDescRentTotal, // 商品品类所有产品中的最低租金*最长的租赁天数
      leaseDescMarketPrice: leaseDescMarketPrice, // 显示该商品品类中最小的价格
      leaseShowCompare: leaseShowCompare // 是否展示比较优势
    });
  },
  // 获取最低市场价
  getMinMarketPrict(listCommodity) {
    let price = 0;
    if (listCommodity && listCommodity.length > 0) {
      listCommodity.forEach((item, index) => {
        if (index > 0) {
          if (item.marketPrice < price) {
            price = item.marketPrice;
          }
        } else {
          price = item.marketPrice;
        }
      });
    }
    return price;
  },
  // 常见问答点击展开
  handleTitleTap(e, data) {
    let currentindex = this.data.collapseData.findIndex(item => item.title === data.title);
    const { index } = e.target.dataset;
    let panel = this.data.collapseData.find(item => item.title === data.title);

    panel.qa[index].expanded = !panel.qa[index].expanded;
    this.setData({
      [`collapseData[${currentindex}]`]: panel
    });
  },
  /***********************CSL 新增加方法增加租赁方式部分代码 ******************************/
  // 入参: data https返回的原始报文的data数据部分
  _constuctRentPlaneBtn(data) {
    let [financeProductList, rentStyleArray] = parseRentDayList(data);
    let payStyleArray = [];
    let payStyleDict = data && data['rentPayStyles'];
    let tempJson = JSON.parse(payStyleDict);
    // console.info('tempJson == ', financeProductList, rentStyleArray);
    for (let key in tempJson) {
      payStyleArray.push({
        key: key,
        name: tempJson[key],
        cssName: 'kind-btn btn-gray',
        Status: CategoryStatus.Disable
      });
    }
    // console.info('financeProductList ==== ' + financeProductList);
    // console.info('rentStyleArray === ' + rentStyleArray);
    // console.info('payStyleArray === ' + JSON.stringify(payStyleArray));
    this.setData({
      financeProductList: financeProductList,
      rentStyleArray: rentStyleArray,
      payStyleArray: payStyleArray
    });
  },
  //  用户选择对应的租赁方式
  rentItemClick(e) {
    let rentItem = e.target.dataset.rentItem;
    let stu = rentItem.Status;
    let userChooseRentItem = this.data.userChooseRentItem;
    let userChooseRentProductList = this.data.userChooseRentProductList;
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;
    let userChooseGood = this.data.userChooseGood;
    let payChooseItem = this.data.payChooseItem;
    if (stu === CategoryStatus.Disable) {
      return;
    }
    if (stu === CategoryStatus.Selected) {
      // 2018-12-19 已选择则不处理
      console.log('rentItem btn is selected');
      return;
    } else {
      // 转化成当前费用列表中具体的费用
      userChooseRentItem = rentItem;
      // 开始筛选对应的金融产品列表
      userChooseRentProductList = [];

      let listProduct = userChooseGood && userChooseGood['listProduct'];
      if (listProduct !== undefined && listProduct instanceof Array) {
        for (let i = 0; i < listProduct.length; i++) {
          let product = listProduct[i];
          if (product.rentSolution === rentItem.rentSolution) {
            userChooseRentProductList.push(product);
          }
        }
        // 增加开始判断的逻辑，如果只有一个租期符合要求那么久默认选定
        if (userChooseRentProductList.length === 1) {
          userChooseFinancialProduct = userChooseRentProductList[0];
          payChooseItem = this.dealWithPayItemWithFinancialProduct(userChooseFinancialProduct);
        } else {
          if (JSON.stringify(userChooseFinancialProduct) !== '{}') {
            userChooseFinancialProduct = userChooseRentProductList.find(
              item => item.totalDays === userChooseFinancialProduct.totalDays
            );
            payChooseItem = this.dealWithPayItemWithFinancialProduct(userChooseFinancialProduct);
          }
        }
      }
      // console.log('product', userChooseGood, userChooseRentProductList, userChooseFinancialProduct);
    }
    console.log('rentclick', userChooseGood, userChooseRentProductList, userChooseFinancialProduct);

    this.setData({
      userChooseRentItem: userChooseRentItem,
      userChooseRentProductList: userChooseRentProductList,
      userChooseFinancialProduct: userChooseFinancialProduct,
      userChooseGood: userChooseGood,
      payChooseItem: payChooseItem,
      marketPriceCurr: userChooseGood.marketPrice
    });
    this.refreashRentStyle();
    this.refreashRentDayBtnsCssStyle();
    this.refreashPayStyle();
    this.refreashFinaProductReleative();
    // this.getBuyoutPrice();
  },
  // 买断金计算公式是：“该商品的市场价*买断系数 - 商品的每日租金*选中的租期（如果没选中，默认是最大租期）”
  getBuyoutPrice() {
    let buyoutPrice = 0;
    setTimeout(() => {
      console.log('getBuyoutPrice userChooseGood = ' + JSON.stringify(this.data.userChooseGood.signPrice));
      console.log(
        'getBuyoutPrice userChooseFinancialProduct = ' + JSON.stringify(this.data.userChooseFinancialProduct.avgRentAmt)
      );
      if (this.data.userChooseGood && this.data.userChooseFinancialProduct) {
        buyoutPrice = (
          this.data.userChooseGood.signPrice -
          this.data.userChooseFinancialProduct.avgRentAmt * this.data.userChooseFinancialProduct.totalDays
        ).toFixed(0);
      }
      if (isNaN(buyoutPrice) || buyoutPrice <= 0) {
        buyoutPrice = 0;
      }
      this.setData({
        buyoutPriceCurr: buyoutPrice
      });
    }, 0);
  },

  //  用户选择金融产品的处理
  financialItemClick(e) {
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;
    let payItem = this.data.payChooseItem;
    let financialItem = e.target.dataset.dayItem;
    let stu = financialItem.Status;
    if (stu === CategoryStatus.Disable) {
      return;
    }
    if (stu === CategoryStatus.Selected) {
      // 2018-12-19 已选择则不处理
      console.log('finacialItem btn is selected');
      return;
    } else {
      // 转化成当前费用列表中具体的费用
      let listProduct = this.data.userChooseRentProductList;
      if (listProduct !== undefined && listProduct instanceof Array) {
        let findResult = listProduct.findIndex(function(element, index, array) {
          return element.totalDays === financialItem.totalDays;
        });

        if (findResult !== -1) {
          userChooseFinancialProduct = listProduct[findResult];
          // 根据选择的金融产品的数据
          payItem = this.dealWithPayItemWithFinancialProduct(userChooseFinancialProduct);
          console.warn('选定的payItem为:' + JSON.stringify(payItem));
        }
      }
      console.log('financeClick', userChooseFinancialProduct, listProduct);
    }

    this.setData({
      userChooseFinancialProduct: userChooseFinancialProduct,
      payChooseItem: payItem
      // financeProductList: userChooseRentProductList
    });
    this.refreashRentStyle();
    this.refreashRentDayBtnsCssStyle();
    this.refreashPayStyle();
    this.refreashFinaProductReleative();
    // this.getBuyoutPrice();
  },

  // 根据选中的金融产品列表 选定对应支付方式的逻辑
  dealWithPayItemWithFinancialProduct(userChooseFinancialProduct) {
    let payStyleArray = this.data.payStyleArray;
    let payItem = {};
    let rentPayStyle = userChooseFinancialProduct && userChooseFinancialProduct['rentPayStyle'];

    // 小程序只有按月支付
    let findResult = payStyleArray.findIndex(function(element, index, array) {
      return element.key === '0';
    });
    if (findResult !== -1) {
      payItem = payStyleArray[findResult];
    }

    // 判断下是否在当前金融产品的是否支持该支付方式
    if (JSON.stringify(payItem) !== '{}') {
      let findResult = rentPayStyle.indexOf(payItem.key);
      if (findResult === -1) {
        return {};
      }
    }

    return payItem;
  },

  //  用于选择支付方式的事件处理
  payItemClick(e) {
    let payItem = e.target.dataset.payItem;
    let payChooseItem = this.data.payChooseItem;
    let stu = payItem.Status;
    if (stu === CategoryStatus.Disable) {
      return;
    }
    if (stu === CategoryStatus.Selected) {
      // 2018-12-19 已选择则不处理
      console.log('payItem btn is selected');
      return;
      // payChooseItem = {};
    } else {
      if (stu === CategoryStatus.Disable) {
      } else {
        payChooseItem = payItem;
      }
    }
    this.setData({
      payChooseItem: payChooseItem
    });
    this.refreashPayStyle();
  },

  /* 更新对应的支付方式列表 */
  refreashPayStyle() {
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;
    let rentPayStyle = userChooseFinancialProduct && userChooseFinancialProduct['rentPayStyle'];
    let payChooseItem = this.data.payChooseItem;
    if (rentPayStyle === undefined) {
      rentPayStyle = '';
    }
    let payStyleArray = this.data.payStyleArray;
    if (payStyleArray !== undefined && payStyleArray instanceof Array) {
      for (let i = 0; i < payStyleArray.length; i++) {
        let payItem = payStyleArray[i];
        let findResult = rentPayStyle.indexOf(payItem.key);
        if (findResult === -1) {
          // 如果不存在添加到该列表中
          payItem.Status = CategoryStatus.Disable;
          payItem.cssName = 'kind-btn btn-gray';
        } else {
          if (payItem.key === payChooseItem.key) {
            payItem.Status = CategoryStatus.Selected;
            payItem.cssName = 'kind-btn btn-golden';
          } else {
            payItem.Status = CategoryStatus.Normal;
            payItem.cssName = 'kind-btn';
          }
        }
      }
    }
    this.setData({
      payStyleArray: payStyleArray
    });
  },

  /* 根据当前的状态更新租赁方式的cssName方式 */
  refreashRentStyle() {
    /* 开始变化对应按钮的状态 */
    let rentStyleArray = this.data.rentStyleArray;
    let listProduct = this.data.userChooseGood && this.data.userChooseGood['listProduct'];
    let userChooseRentItem = this.data.userChooseRentItem;

    /*开始设置租赁方式按钮的css状态*/
    if (listProduct !== undefined && listProduct instanceof Array) {
      for (let i = 0; i < rentStyleArray.length; i++) {
        let rentItem = rentStyleArray[i];
        let findResult = listProduct.findIndex(function(element, index, array) {
          return element.rentSolution === rentItem.rentSolution;
        });
        if (findResult === -1) {
          // 如果不存在添加到该列表中
          rentItem.Status = CategoryStatus.Disable;
          rentItem.cssName = 'kind-btn btn-gray';
        } else {
          if (rentItem.rentSolution === userChooseRentItem.rentSolution) {
            rentItem.Status = CategoryStatus.Selected;
            rentItem.cssName = 'kind-btn btn-golden';
          } else {
            rentItem.Status = CategoryStatus.Normal;
            rentItem.cssName = 'kind-btn';
          }
        }
      }
    } else {
      for (let i = 0; i < rentStyleArray.length; i++) {
        let rentItem = rentStyleArray[i];
        rentItem.Status = CategoryStatus.Disable;
        rentItem.cssName = 'kind-btn btn-gray';
      }
    }

    this.setData({
      rentStyleArray: rentStyleArray
    });
  },

  /* 根据当前的数据更新租赁天数部分按钮状态的函数 */
  refreashRentDayBtnsCssStyle() {
    // let listProduct = this.data.userChooseGood && this.data.userChooseGood['listProduct'];
    let listProduct = this.data.userChooseRentProductList;
    let financeProductList = this.data.financeProductList;
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;
    // console.log('list', financeProductList);

    /*开始设置金融产品列表的 租赁天数部分的css状态*/
    if (listProduct !== undefined && listProduct instanceof Array) {
      for (let i = 0; i < financeProductList.length; i++) {
        let finalProductItem = financeProductList[i];
        let findResult = listProduct.findIndex(function(element, index, array) {
          return element.totalDays === finalProductItem.totalDays;
        });
        if (findResult === -1) {
          // 如果不存在添加到该列表中
          finalProductItem.Status = CategoryStatus.Disable;
          finalProductItem.cssName = 'kind-btn btn-gray';
        } else {
          if (finalProductItem.totalDays === userChooseFinancialProduct.totalDays) {
            finalProductItem.Status = CategoryStatus.Selected;
            finalProductItem.cssName = 'kind-btn btn-golden';
          } else {
            finalProductItem.Status = CategoryStatus.Normal;
            finalProductItem.cssName = 'kind-btn';
          }
        }
      }
    } else {
      for (let i = 0; i < financeProductList.length; i++) {
        let finalProductItem = financeProductList[i];
        finalProductItem.Status = CategoryStatus.Disable;
        finalProductItem.cssName = 'kind-btn btn-gray';
      }
    }
    // console.log('22', financeProductList);

    this.setData({
      financeProductList: financeProductList
    });
  },

  /* 定义一个专门用于更新金融产品列表的函数 */
  refreashFinaProductReleative() {
    let _headInfo = this.data.headInfo;
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;

    // 设置费用选项
    this.setAddedService();
    if (userChooseFinancialProduct) {
      _headInfo.price = userChooseFinancialProduct.avgRentAmt;
      let oneMonthPrice = this.getOneMonthPriceWithDayPrice(userChooseFinancialProduct.avgRentAmt);
      _headInfo.oneMonthPrice = oneMonthPrice;
    } else {
      let leastRentDay = this.data.baseInfo.leastRentDay; //this.data.res.data.leastRentDay;
      let oneMonthPrice = this.getOneMonthPriceWithDayPrice(leastRentDay);
      _headInfo.price = leastRentDay;
      _headInfo.oneMonthPrice = oneMonthPrice;
    }
    console.log('head', _headInfo);
    this.getBuyoutPrice();
    this.setData({
      headInfo: _headInfo
    });
  },
  // 设置增值服务
  setAddedService() {
    let _addedServicesTmp = [];
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;
    if (
      userChooseFinancialProduct &&
      userChooseFinancialProduct.listFeeInfo &&
      userChooseFinancialProduct.listFeeInfo.length > 0
    ) {
      _addedServicesTmp = this.initCurrFeeInfo(userChooseFinancialProduct.listFeeInfo);
    } else {
      _addedServicesTmp = [
        {
          feeName: '意外保障',
          feeDesc: '用机无忧，物主平台提供的意外保障服务',
          imgUrl: '/image/GoodDetail/icon-service_03.png',
          detail: ''
        }
      ];
    }
    this.setData({
      addedServices: _addedServicesTmp
    });
  },
  /* 开始根据当前选定的情况，开始设定对应租赁方式和租赁天数 */
  updateWithShowCatChoose() {
    let _headInfo = this.data.headInfo;
    // 1.判定是否所有的规格已经都选择
    let showCat = this.data.showCat;
    let allChoose = true;
    for (let i = 0; i < showCat.length; i++) {
      let showCatItem = showCat[i];
      if (showCatItem.isClick === false) {
        allChoose = false;
        break;
      }
    }

    // 先清空所有的相关数据
    // console.log('financeProductList = ' + JSON.stringify(this.data.financeProductList));
    // console.log('rentStyleArray = ' + JSON.stringify(this.data.rentStyleArray));
    // console.log('payStyleArray = ' + JSON.stringify(this.data.payStyleArray));
    // let initSomeData = {};
    // if (this.data.financeProductList && this.data.financeProductList.length > 1) {
    //   initSomeData.userChooseFinancialProduct = {};
    // }
    // if (this.data.rentStyleArray && this.data.rentStyleArray.length > 1) {
    //   // initSomeData.userChooseRentItem = {};
    // }
    // if (this.data.payStyleArray && this.data.payStyleArray.length > 1) {
    //   initSomeData.payChooseItem = {};
    // }
    // initSomeData.userChooseGood = {};
    // this.setData(initSomeData);
    this.setData({
      userChooseGood: {},
      // userChooseFinancialProduct: {},
      userChooseRentProductList: [],
      // userChooseRentItem: {}
      payChooseItem: {}
    });

    if (allChoose === true) {
      let userChooseGoodTemp = this.data.userChooseGoodTemp;

      // 租完归还的租赁方式立即选中，更新productlist
      // if (this.data.rentStyleArray.length == 1 && this.data.rentStyleArray[0].rentSolution == '1') {
      // }
      this.updateProductList(userChooseGoodTemp);

      this.setData({
        userChooseGood: userChooseGoodTemp,
        marketPriceCurr: userChooseGoodTemp.marketPrice
      });
      if (userChooseGoodTemp && userChooseGoodTemp.isLimited != 0) {
        // 限量商品开始检查库存
        if (userChooseGoodTemp.commodityNo) {
          this.queryAvaliCommodityStockQty(userChooseGoodTemp.commodityNo, userChooseGoodTemp);
        } else {
          console.log('error!选择的该商品无commodityNo:' + JSON.stringify(userChooseGoodTemp));
        }
      } else {
        // 不限量商品不用检查库存
        console.log('updateWithShowCatChoose no limited goods');
        this.setData({
          'headInfo.inventory': 999,
          'headInfo.describe': '有货',
          isClick: true,
          buttonText: '确定'
        });
      }
      // 开始租赁列表和租期部分内容
      this.refreashRentStyle();
      this.refreashRentDayBtnsCssStyle();
    } else {
      // 开始清空对应选择的数据,强制变成有货
      _headInfo.describe = '有货';
      _headInfo.inventory = 10;
      this.setData({
        headInfo: _headInfo
      });
      this.refreashRentStyle();
      this.refreashRentDayBtnsCssStyle();
    }
    console.log('update', this.data.userChooseGood);
  },
  // 手动更新productlist
  updateProductList(userChooseGoodTemp) {
    // 转化成当前费用列表中具体的费用
    // userChooseRentItem = rentItem;
    // 开始筛选对应的金融产品列表
    let userChooseRentProductList = [];
    let rentItem = this.data.userChooseRentItem;
    let userChooseFinancialProduct = this.data.userChooseFinancialProduct;
    let payChooseItem = {};
    console.log('before', userChooseFinancialProduct);

    let listProduct = userChooseGoodTemp && userChooseGoodTemp['listProduct'];
    if (listProduct !== undefined && listProduct instanceof Array) {
      for (let i = 0; i < listProduct.length; i++) {
        let product = listProduct[i];
        if (product.rentSolution === rentItem.rentSolution) {
          userChooseRentProductList.push(product);
        }
      }
      // 增加开始判断的逻辑，如果只有一个租期符合要求那么久默认选定
      if (userChooseRentProductList.length == 0) {
        this.setData({
          userChooseRentItem: {}
        });
      } else if (userChooseRentProductList.length === 1) {
        userChooseFinancialProduct = userChooseRentProductList[0];
        payChooseItem = this.dealWithPayItemWithFinancialProduct(userChooseFinancialProduct);
      } else {
        if (JSON.stringify(userChooseFinancialProduct) !== '{}') {
          userChooseFinancialProduct = userChooseRentProductList.find(item => {
            return item.totalDays === userChooseFinancialProduct.totalDays;
          });

          payChooseItem = this.dealWithPayItemWithFinancialProduct(userChooseFinancialProduct);
        }
      }
    }
    console.log('up', userChooseFinancialProduct, userChooseRentProductList);

    this.setData({
      // userChooseRentItem: userChooseRentItem,
      userChooseRentProductList: userChooseRentProductList,
      userChooseFinancialProduct: userChooseFinancialProduct,
      // userChooseGood: userChooseGood,
      payChooseItem: payChooseItem,
      marketPriceCurr: userChooseGoodTemp.marketPrice
    });
    this.refreashRentStyle();
    this.refreashRentDayBtnsCssStyle();
    this.refreashPayStyle();
    this.refreashFinaProductReleative();
    // this.getBuyoutPrice();
  },
  // 费用说明等弹框隐藏按钮被点击,注意一定要以on开头，否则会被处理为字符串
  onHideToastClick: function() {
    // console.log('hideToastClick hideToastClick hideToastClick====');
    this.setData({
      showToast: false
    });
  },
  // 买断金说明被点击
  buyoutFeeClick: function(event) {
    let feeItem = event.target.dataset.feeItem;
    this.setData({
      showToast: true,
      toastTitle: '买断尾款',
      toastContent:
        '买断尾款是指商品租赁到期后，客户选择买断商品需支付的款项，如需提前买断，以发起买断时页面展示的支付金额为准。'
    });
  },
  // 费用部分icon被点击
  feeIconClick: function(event) {
    let feeItem = event.target.dataset.feeItem;
    // console.log('费用详细信息被点击了' + JSON.stringify(feeItem))
    this.setData({
      showToast: true,
      toastTitle: feeItem.feeName,
      toastContent: feeItem.feeDesc
    });
  },
  // 引流文字被点击
  leadFlowClick: function(event) {
    let url = event.target.dataset.url;
    // console.log('leadFlowClick url = ' + url);
    if (url) {
      // 如果有url，则跳转到对应的活动页
      my.navigateTo({
        url: '/pages/ActivityHtml/ActivityHtml?url=' + encodeURIComponent(url)
      });
    } else {
      // 如果没有url，则跳转到首页
      gotoIndex();
    }
  },
  // 活动被点击
  activityClick: function(event) {
    let that = this;
    let activity = event.target.dataset.activity;
    // console.log('leadFlowClick activity = ' + JSON.stringify(activity));
    if (activity) {
      this.checkPartByPromotion(activity);
    } else {
      my.showToast({
        content: 'Error!activity is null.'
      });
    }
  },
  // gotoIndex: function() {
  //   // 修改点击店铺返回首页的方式。从外部链接直接进入详情,用navigateBack方法会无法返回首页
  //   let currentPages = getCurrentPages().length;
  //   if (currentPages <= 1) {
  //     my.reLaunch({
  //       url: '/pages/index/index'
  //     });
  //   } else {
  //     my.switchTab({
  //       url: '/pages/index/index'
  //     });
  //   }
  // },
  // 活动点击后处理
  activityDispatch: function(activity) {
    let that = this;
    if (activity) {
      if (activity.aliMiniProgram) {
        goToMiniProgram(activity.aliMiniProgram);
      } else {
        my.confirm({
          title: activity.promotionName,
          content: activity.promotionDetailMsg,
          confirmButtonText: activity.partShortMsg,
          cancelButtonText: '取消',
          success: result => {
            // console.log(result);
            if (result && result.confirm) {
              gotoIndex();
            } else {
              // do something
            }
          }
        });
      }
    } else {
      my.showToast({
        content: 'Error!activity is null.'
      });
    }
  },
  // 查询该用户是否可以参加该活动
  checkPartByPromotion: function(activity) {
    let that = this;
    app.startLogin(
      function(res) {
        // console.log('startLogin success, ' + JSON.stringify(res));
        my.showLoading();
        http
          .post('/wuzhu/user/checkPartByPromotion', {
            channelNo: app.channelNo, // 渠道编号
            promotionNo: activity.promotionNo
          })
          .then(res => {
            my.hideLoading();
            // console.info('checkPartByPromotion res = ' + JSON.stringify(res));
            if (res.code === '00') {
              that.activityDispatch(activity);
            } else {
              my.showToast({
                content: res.msg
              });
            }
          })
          .catch(err => {
            console.error(err);
            my.hideLoading();
          });
      },
      function(err) {
        console.log('startLogin fail, ' + JSON.stringify(err));
      }
    );
  },
  // ****************************
  // 查看是否有可以领取的优惠券
  queryCoupons() {
    http
      .post('/wuzhu/user/queryCustomerReceiveCouponList', {
        channelNo: app.channelNo, // 渠道编号
        categoryCode: this.data.categoryCode,
        partType: 'REC' // 手工主动领取，固定值
      })
      .then(res => {
        // console.info('queryCoupons res = ' + JSON.stringify(res));
        if (res.code === '00') {
          if (res.data) {
            let data = res.data;
            let coupons = {};
            coupons.data = data.receiveCouponListVO; // 优惠券列表
            coupons.name = data.receiveDesc || '领券'; // 领券
            coupons.shortDesc = data.maxReduceDesc; // 领券短说明，最高立减
            this.setData({
              coupons: coupons,
              canGetCoupons: true
            });
            this.setCouponList(coupons.data);
          }
        } else {
          my.showToast({
            content: res.msg
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  },
  // 对优惠券进行分组
  setCouponList(data) {
    // console.log('setCouponList ', data);
    let enCoupons = [];
    let disCoupons = [];
    let nIndex = 0;
    let oIndex = 0;
    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      // showStatus (string, optional): 优惠券展示状态：Y=显示；A=置灰显示；N=不展示
      switch (element.showStatus) {
        case 'Y':
          // receiveStatus (string, optional): 优惠券领取状态：Y=可以领取；N=不可以领取 ,
          // receiveDesc (string, optional): 优惠券领取按钮描述 ,
          let nItem = { ...element };
          nItem['available'] = '0';
          nItem['buttonText'] = element.receiveDesc;
          nItem['loading'] = false;
          nItem['footer'] = `有效期：${formatDateInCN(element.beginTime)}——${formatDateInCN(element.endTime)}`;
          if (element.receiveStatus === 'Y') {
            nItem['operation'] = 'button';
          } else {
            nItem['operation'] = 'received';
          }
          // console.log('nIndex = ' + nIndex);
          nItem['iIndex'] = nIndex++;
          enCoupons.push(nItem);
          break;
        case 'A':
          let oItem = { ...element };
          oItem['available'] = '1';
          oItem['loading'] = false;
          oItem['operation'] = 'received';
          oItem['buttonText'] = element.receiveDesc;
          oItem['footer'] = `有效期：${formatDateInCN(element.beginTime)}——${formatDateInCN(element.endTime)}`;
          oItem['iIndex'] = oIndex++;
          disCoupons.push(oItem);
          break;
        case 'N':
          break;
        default:
          break;
      }
    }
    this.setData({
      enabledCoupons: enCoupons,
      disabledCoupons: disCoupons
    });
  },
  // 领取优惠券
  getCoupon(obj) {
    // console.log('getCoupon ', obj);
    if (obj.type !== 'button') {
      return;
    }
    let that = this;
    app.startLogin(
      function(res) {
        // console.log('startLogin success, ' + JSON.stringify(res));
        if (!that.data.canGetCoupons) {
          return;
        }
        that.setData({
          [`enabledCoupons[${obj.iIndex}].loading`]: true,
          [`enabledCoupons[${obj.iIndex}].buttonText`]: '',
          canGetCoupons: false
        });
        http
          .post('/wuzhu/user/initiativePartPromotion', {
            channelNo: app.channelNo, // 渠道编号
            couponNo: obj.id,
            promotionNo: obj.promotionNo,
            partType: 'REC' // 手工主动领取，固定值
          })
          .then(res => {
            // console.info('getCoupon res = ' + JSON.stringify(res));
            if (res.code === '00' && res.data && res.data.promotionInfoVO) {
              let promotionInfoVO = res.data.promotionInfoVO;
              my.showToast({
                content: promotionInfoVO.partySuccessMsg
              });
            } else {
              that.resetCoupons(obj.iIndex);
              my.showToast({
                content: res.msg
              });
            }
            // 领取后再次查询优惠券
            that.queryCoupons();
          })
          .catch(err => {
            that.resetCoupons(obj.iIndex);
            console.error(err);
          });
      },
      function(err) {
        console.log('startLogin fail, ' + JSON.stringify(err));
      }
    );
  },
  // 重置某个优惠券到初始状态
  resetCoupons(index) {
    this.setData({
      [`enabledCoupons[${index}].loading`]: false,
      [`enabledCoupons[${index}].buttonText`]: '领取',
      canGetCoupons: true
    });
  },
  // 弹出优惠券窗口
  couponsPopup() {
    this.setData({
      showCoupons: true,
      isScroll: 'N'
    });
  },
  // 关闭优惠券的弹窗
  onPopupClose() {
    this.setData({
      showCoupons: false,
      isScroll: 'Y'
    });
  },
  // 显示使用说明
  couponInstruction() {
    if (!this.data.instructionInfo) {
      this.getInstructionInfo();
    } else {
      this.setData({
        showToast: true,
        toastTitle: '使用说明',
        toastContent: this.data.instructionInfo
      });
    }
  },
  // 获取使用说明
  async getInstructionInfo() {
    let params = {
      channelNo: '002'
    };
    try {
      let res = await http.get('/wuzhu/user/queryCouponDetailMsgBychannel', params);
      if (res.code === '00') {
        this.setData({
          showToast: true,
          toastTitle: '使用说明',
          toastContent: res.data,
          instructionInfo: res.data
        });
      } else {
        my.showToast({
          content: res.msg
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
  // ****************************
});
