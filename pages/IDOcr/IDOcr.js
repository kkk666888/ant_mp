import http from '/util/http';
import Config from '/util/config';
import { gotoIndex } from '/util/wuzhuUtil';
import * as Utils from '/util/util';

const app = getApp();

Page({
  data() {
    return {
      orderType: 0,
      orderNo: '', // 我方的订单号
      frontDatas: {},
      backDatas: {},
      imgOrder: 0, // 0 身份证正面，1
      isNotOcrDeal: false,
      ocrMsg: {
        name: '',
        number: '' // 身份证号码
      },
      imgFront: {
        name: '',
        path: '/image/idocr/id_front.png'
      },
      imgBack: {
        name: '',
        path: '/image/idocr/id_back.png'
      }
    };
  },
  onLoad(query) {
    console.info('传过来的 query === ' + JSON.stringify(query));
    let result = query.result;
    this.setData({
      orderNo: query.orderNo
    });
    // TODO
    // let protocolUrl = 'https://wzimages.oss-cn-shenzhen.aliyuncs.com/wz_delivery_bucket_2019/%E7%94%A8%E6%88%B7%E7%A7%9F%E8%B5%81%E5%8F%8A%E6%9C%8D%E5%8A%A1%E5%8D%8F%E8%AE%AE%E4%B9%8B%E8%A1%A5%E5%85%85%E5%8D%8F%E8%AE%AE-%E6%94%AF%E4%BB%98%E5%AE%9DV1.3.pdf?Expires=1870670421&OSSAccessKeyId=LTAIf7TXxdt77bnG'
    // let protocolUrl = 'https://openapi.bestsign.info/openapi/v2/dist_v3/index.html#/donePage?developerId=1965831777222132321&data=FZiLywyKAh9Xywiiydj6jIf5mIv4nYf3mYDZnIjWnYjYnIfJkdiIA250DNeICfKLjIPJnsv1msb2nIjYpsbWncbXncbWjJXJCNKKC1q5DhvJpJiXDNu2Bxu3jJXJywGXBwiKrwrJpJjWmsH2mIH0mIn5jJXJygaOjIPJnsHXjJXJD2KMANuZjIPJDgK5zxO1ALbWmInVz29SjJXJDwuGAhK0Ftj6jIfXndi9'
    // let protocolUrl = 'https://wzimages.oss-cn-shenzhen.aliyuncs.com/wz_delivery_bucket_2019/abc.htm'
    // let protocolUrl = 'https://wzimages.oss-cn-shenzhen.aliyuncs.com/wz_delivery_bucket_2019/041516255581.html'
    // protocolUrl = encodeURIComponent(protocolUrl);
    // my.navigateTo({
    //   url: './../ProtocolHtml/ProtocolHtml?protocol=' + 'test' + '&protocolUrl=' + protocolUrl
    // });
    // return false;
  },
  onShow() {},
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  },
  // 拍摄照片或者从相册选择
  chooseImage(e) {
    let side = e.target.dataset.side;
    console.log('chooseImage side = ' + side + ',' + typeof side);
    my.chooseImage({
      sourceType: ['camera', 'album'],
      success: res => {
        console.log('res = ' + JSON.stringify(res));
        if (res && res.apFilePaths.length > 0) {
          console.log('ok');
        } else {
          // my.showToast({
          //   type: 'fail',
          //   content: '请重新选择照片'
          // });
          return;
        }
        let filePath = res.apFilePaths[0];
        console.log('filePath = ' + filePath);
        let tmpArr = filePath.split('/');
        let fileName = tmpArr[tmpArr.length - 1];
        console.log('fileName = ' + fileName);
        // if (side === 'front') {
        //   this.setData({
        //     'imgFront.path': filePath
        //   });
        // } else {
        //   this.setData({
        //     'imgBack.path': filePath
        //   });
        // }

        // 上传文件，后台需要支持.image格式的图片
        my.uploadFile({
          url: Config._hoststr + '/wuzhu/common/uploadFileAli',
          header: { 'Content-Type': 'application/x-www-form-urlencoded' },
          fileType: 'image',
          fileName: 'image',
          filePath: filePath,
          success: res => {
            console.log('success', res);
            if (res.statusCode == 200) {
              let resData = JSON.parse(res.data);
              console.log('data,', resData);

              if (resData.code === '00') {
                if (side === 'front') {
                  this.setData({
                    'imgFront.path': resData.data.filePath,
                    'imgFront.name': resData.data.imageName
                  });
                } else {
                  this.setData({
                    'imgBack.path': resData.data.filePath,
                    'imgBack.name': resData.data.imageName
                  });
                }
                console.log('img', this.data.imgFront, this.data.imgBack);

                my.showToast({
                  content: '上传成功'
                });
              } else {
                this.resetImg(side);
                my.alert({
                  content: resData.msg
                });
              }
            } else {
              this.resetImg(side);
              my.alert({
                content: '上传失败,请重新上传'
              });
            }
          },
          fail: res => {
            console.log('fail res = ' + JSON.stringify(res));
            my.alert({
              content: 'fail.' + JSON.stringify(res)
            });
            this.resetImg(side);
          }
        });
      },
      fail: res => {
        console.log('chooseImage fail res = ' + JSON.stringify(res));
      }
    });
  },
  resetImg(side) {
    if (side === 'front') {
      this.setData({
        'imgFront.path': '/image/idocr/id_front.png',
        'imgFront.name': ''
      });
    } else {
      this.setData({
        'imgBack.path': '/image/idocr/id_back.png',
        'imgBack.name': ''
      });
    }
  },
  // 进行ocr认证
  sub() {
    let that = this;
    if (!that.data.imgFront.name) {
      my.alert({
        content: '请上传正确的身份证人像面照片'
      });
      return false;
    }
    if (!that.data.imgBack.name) {
      my.alert({
        content: '请上传正确的身份证国徽面照片'
      });
      return false;
    }
    // TODO
    // app.startLogin(
    //   function(res) {
    //     console.log('startLogin success, ' + JSON.stringify(res));
    //     that.checkOCRIDCard();
    //   },
    //   function(err) {
    //     console.log('startLogin fail, ' + JSON.stringify(err));
    //   }
    // );
    that.checkOCRIDCard();
  },
  // OCR 识别
  async checkOCRIDCard() {
    let that = this;
    let checkUrl = '/wuzhu/reservationController/checkOCRIDCardForAli';
    let param = {list : [{
      filePath: that.data.imgFront.path,
      imageName: 'frontImg',
      side: 'front'
    },
    {
      filePath: that.data.imgBack.path,
      imageName: 'backImg',
      side: 'back'
    }]};
    my.showLoading();
    // console.log('param = ' + JSON.stringify(param));
    http
      .post(checkUrl, param)
      .then(res => {
        my.hideLoading();
        console.log('====== checkOCRIDCard res ' + JSON.stringify(res));
        if (res && res.code === '00') {
          my.showToast({
            type: 'success',
            content: '认证成功',
            duration: 1000,
            success: () => {
              that.gotoNewOrderWait();
            }
          });
        } else {
          that.resetImg('front');
          that.resetImg('back');
          my.showToast({
            type: 'fail',
            content: res && res.msg,
            duration: 2000,
              success: () => {}
            });
        }
      })
      .catch(err => {
        my.hideLoading();
      });
  },
  // 进入新订单生成等待页
  gotoNewOrderWait() {
    my.reLaunch({
      url: '/pages/NewOrderWait/NewOrderWait?orderNo=' + this.data.orderNo
    });
  }
});
