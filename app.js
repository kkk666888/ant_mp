import http from '/util/http';
import Config from '/util/config';
import { setDateFormat } from '/util/util';
import { uploadThirdInterfaceLog } from '/util/wuzhuUtil';

App({
  appid: Config.appid,
  myRecommeCode: null, // 自己的邀请码，暂时无用
  recommendCode: '', // 别人的邀请码，通过此邀请码进入小程序
  Token: null,
  channelNo: Config.channelNo,
  userInfo: {},
  isLogonRequest: false, // 确保至少请求一次登陆接口
  shareObj: {
    // 分享默认设置
    common: {
      title: '物主潮品租赁',
      desc: '全系苹果，租金低至￥2.4/天，比买更省，轻松换新',
      imageUrl: '/image/logo.png',
      path: 'pages/index/index'
    },
    commodityDetail: {
      title: '',
      desc: '',
      imageUrl: ''
    }
  },
  sdkVersion: '',
  systemInfo: '',
  onLaunch(options) {
    console.log('app onLaunch options:' + JSON.stringify(options));
    if (my.request) {
      console.log('my.request ok.');
    } else {
        // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样提示
      my.alert({
        title: '温馨提示',
        content: '当前支付宝版本过低，部分功能将无法使用，请升级最新版本支付宝',
        success: () => {
        },
      });
    }

    // 小程序初始化
    this.setInvitationCode(options);
    this.setCategoryCode(options);
    this.setFavoriteInfo(options);
    this.getShareInfo();
    setDateFormat(); // 扩展 Date prototype
    this.getLocation();
  },
  onShow(options) {
    // console.log('onShow options:' + JSON.stringify(options));
    this.setInvitationCode(options);
    this.setCategoryCode(options);
    this.setFavoriteInfo(options);
  },
  onHide() {
    // 小程序隐藏
  },
  onError(msg) {
    console.error(msg);
  },
  getLocation() {
    let that = this;
    console.log('canIUse getLocation : ' + my.canIUse('getLocation'));
    if (my.canIUse('getLocation')) {
      my.getLocation({
        // 获取用户位置信息
        success(res) {
          that.userInfo.location = {
            longitude: res.longitude,
            latitude: res.latitude
          };
        },
        fail(err) {
          console.log('getLocation fail err = ' + JSON.stringify(err));
          let opt = {
            uniqueIdenty: 'getLocation',
            type: '15',
            requestParam: '',
            responseParam: JSON.stringify(err),
            status: '2' // 状态：1成功2失败
          };
          that.uploadLog(opt);
        }
      });
    }
  },
  hasLogin() {
    if (this.isLogonRequest && this.Token) {
      return true;
    } else {
      return false;
    }
  },
  startLogin(callback, errCallback) {
    if (!this.hasLogin()) {
      console.log('startLogin go to login.');
      this.getUserInfoNew(callback, errCallback);
    } else {
      console.log('startLogin hasLogin, go.');
      callback && callback();
    }
  },
  getUserInfoNew(callback, errCallback) {
    my.showLoading();
    let that = this;
    my.getAuthCode({
      scopes: ['auth_user'], // 主动授权-弹框:auth_user，静默授权(不弹框):auth_base
      success: res => {
        console.log('getAuthCode res = ' + JSON.stringify(res));
        console.log('userInfo.authCode = ' + that.userInfo.authCode);
        if (that.userInfo.authCode === res.authCode) {
          console.warn('userInfo.authCode = res.authCode');
        }
        that.userInfo.authCode = res.authCode;
        my.getAuthUserInfo({
          success: res => {
            console.log('getAuthUserInfo res = ' + JSON.stringify(res));
            that.userInfo.nickName = res.nickName;
            that.userInfo.avatar = res.avatar;
            console.log('getAuthUserInfo that.userInfo = ' + JSON.stringify(that.userInfo));
            that.aliLogin(that.userInfo, callback, errCallback);
          },
          fail: err => {
            console.log('getAuthUserInfo fail err = ' + JSON.stringify(err));
            let opt = {
              uniqueIdenty: 'getAuthUserInfo',
              type: '17',
              requestParam: '',
              responseParam: JSON.stringify(err),
              status: '2' // 状态：1成功2失败
            };
            that.uploadLog(opt);

            my.hideLoading();
            errCallback && errCallback(err);
          },
          complete: res => {
            console.log('getAuthUserInfo complete res = ' + JSON.stringify(res));
          }
        });
      },
      fail: err => {
        console.log('getAuthCode fail err = ' + JSON.stringify(err));
        let opt = {
          uniqueIdenty: 'getAuthCode',
          type: '16',
          requestParam: '{"scopes":["auth_user"]}',
          responseParam: JSON.stringify(err),
          status: '2' // 状态：1成功2失败
        };
        that.uploadLog(opt);

        my.hideLoading();
        // my.showToast({ content: '用户授权失败' });
        errCallback && errCallback(err);
      }
    });
  },
  getUserInfo(callback, errCallback) {
    return new Promise((resolve, reject) => {
      my.getAuthCode({
        scopes: ['auth_user'], // 主动授权-弹框:auth_user，静默授权(不弹框):auth_base
        success: authcode => {
          for (let i in authcode) {
            this.userInfo[i] = authcode[i];
          }
          my.getAuthUserInfo({
            success: res => {
              for (let i in res) {
                this.userInfo[i] = res[i];
              }
              resolve(this.userInfo);
              callback && callback(this.userInfo);
            },
            fail: err => {
              reject(err);
              errCallback && errCallback(err);
            }
          });
        },
        fail: err => {
          reject(err);
          errCallback && errCallback(err);
        }
      });
    });
  },
  // 登陆
  aliLogin(user, callback, errCallback) {
    // my.showLoading();
    let that = this;
    let _logDO = {
      logNo: '',
      memebershipNo: '',
      loginDate: '',
      loginChannel: '',
      loginIp: '',
      deviceName: '', // 登录设备名称
      deviceId: '', // 登录设备 ID
      gpsLongitude: that.userInfo.location && that.userInfo.location.longitude, // 经度
      gpsLatitude: that.userInfo.location && that.userInfo.location.latitude, // 纬度
      gpsAddress: '', // 经纬度 地址
      gpsProvince: '', // 经纬度 省份
      gpsCity: '', // 经纬度 城市
      gpsCounty: '' // 经纬度 区县
    };
    let _recommCode = null;
    let storeRes = my.getStorageSync({ key: 'invitationCode' }); // undefined or {}
    if (storeRes) {
      _recommCode = storeRes.data;
    }
    let params = {
      authCode: user && user.authCode,
      channelNo: that.channelNo,
      recommCode: _recommCode, // 别人的邀请码
      strMembershipLoginLogDO: JSON.stringify(_logDO)
    };
    http
      .post('/wuzhu/user/aliLogin', params)
      .then(res => {
        my.hideLoading();
        console.log('aliLogin res, ' + JSON.stringify(res));
        if (res && res.code === '00' && res.data) {
          that.myRecommeCode = res.data.myRecommeCode;
          that.Token = res.data.Token;
          that.userInfo.openId = res.data.openId;
          that.isLogonRequest = true;
          console.info('Token = ' + res.data.Token);
          my.setStorageSync({
            key: 'HttpData',
            data: {
              Token: that.Token
            }
          });
          callback && callback(res);
        } else {
          my.showToast({ content: res && res.msg });
          errCallback && errCallback(err);
        }
      })
      .catch(err => {
        my.hideLoading();
        console.error(err);
        errCallback && errCallback(err);
      });
  },
  //从query中保存邀请码
  setInvitationCode(options) {
    if (options.query && options.query.invitationCode) {
      my.setStorageSync({
        key: 'invitationCode',
        data: options.query.invitationCode
      });
    }
    let storeRes = my.getStorageSync({
      key: 'invitationCode'
    });
    if (storeRes) {
      this.recommendCode = storeRes.data;
    }
    console.log('setInvitationCode recommendCode = ' + this.recommendCode);
  },
  //从query中保存品类编码
  setCategoryCode(options) {
    if (options.query && options.query.categoryCode) {
      my.setStorageSync({
        key: 'outCategoryCode',
        data: options.query.categoryCode
      });
    } else {
      my.setStorageSync({
        key: 'outCategoryCode',
        data: ''
      });
    }
  },
  //从query中保存收藏有礼的信息
  setFavoriteInfo(options) {
    let query = options.query;
    if (query && query.doFavorite === '1') {
      let favoriteInfo = query;
      console.log('favoriteInfo = ' + JSON.stringify(favoriteInfo));
      my.setStorageSync({
        key: 'favoriteInfo',
        data: favoriteInfo
      });
    } else {
      my.setStorageSync({
        key: 'favoriteInfo',
        data: ''
      });
    }
  },
  // 获取分享配置信息
  getShareInfo() {
    let params = {
      channelNo: this.channelNo
    };
    http
      .get('/wuzhu/page/getShareData', params)
      .then(res => {
        if (res.code === '00') {
          if (res.data.common && res.data.common.title) {
            this.shareObj.common = { ...res.data.common };
            this.shareObj.common.bgImgUrl = res.data.common.imageUrl;
          }
          if (res.data.commodityDetail && res.data.commodityDetail.title) {
            this.shareObj.commodityDetail = { ...res.data.commodityDetail };
            this.shareObj.commodityDetail.bgImgUrl = res.data.commodityDetail.imageUrl;
          }
        } else {
          console.warn(res);
        }
        // 加上邀请码
        let storeRes = my.getStorageSync({
          key: 'invitationCode'
        });
        if (storeRes) {
          this.shareObj.common.path = 'pages/index/index?from=share&invitationCode=' + storeRes.data;
        } else {
          this.shareObj.common.path = 'pages/index/index?from=share';
        }
      })
      .catch(err => {
        console.error(err);
      });
  },
  getSystemInfo() {
    try {
      this.sdkVersion = my.SDKVersion;
      console.log('SDKVersion:' + this.sdkVersion);
      my.getSystemInfo({
        success: res => {
          this.systemInfo = res;
          console.log('getSystemInfo:', this.systemInfo);
        },
        fail(error) {
          console.error(error);
        }
      });
    } catch (error) {
      console.err(error);
    }
  },
  // 上传日志
  uploadLog(opt) {
    opt.logSource = '0'; // 请求发起来源 0:前端发起；1=后端发起
    console.log('uploadLog params:' + JSON.stringify(opt));
    uploadThirdInterfaceLog(opt);
  }
});
