import Config from './config';

function setError(err) {
  switch (err.error) {
    case 11:
      console.error('httpRequest 无权跨域, 错误编码: ' + err.error);
      break;
    case 12:
      console.error('httpRequest 网络出错, 错误编码: ' + err.error);
      break;
    case 13:
      console.error('httpRequest 超时, 错误编码: ' + err.error);
      break;
    case 14:
      console.error('httpRequest 解码失败, 错误编码: ' + err.error);
      break;
    case 19:
      console.error('httpRequest HTTP错误, 错误编码: ' + err.error);
      break;
    default:
      console.error('httpRequest 请求错误, 错误编码: ' + err.error);
  }
  // my.alert({ content: '网络错误，请稍后再试:' + err.error });
  my.hideLoading();
  my.showToast({
    type: 'none',
    content: '网络错误，请稍后再试:' + err.error,
    duration: 2000
  });
}

const Http = {
  _hoststr: Config._hoststr,
  _timeout: 30000,
  reConstruct: function(url, headers) {
    let isAPImode = false; // 匹配 url -- 开头以 /wuzhu/ 形式
    if (url.length > 6 && url.substring(0, 6) === 'wuzhu/') {
      url = '/' + url;
    }
    if (url.length > 7 && url.substring(0, 7) === '/wuzhu/') {
      isAPImode = true;
    }
    if (isAPImode) {
      url = this._hoststr + url;
    }

    // 增加 headers['Token']
    if (typeof headers !== 'object') {
      console.error('Http: headers is not object!!');
    } else {
      headers['Content-Type'] = 'application/json;charset=UTF-8';
      headers['channel_no'] = '002'; // 在headers 中传渠道号 -- 支付宝小程序
      headers['ChannelNo'] = '002'; // 在headers 中传渠道号 -- 支付宝小程序
      if (!headers.hasOwnProperty('Token')) {
        let Token = null;
        let storeRes = my.getStorageSync({ key: 'HttpData' }); // undefined or {}
        if (storeRes && storeRes.data) {
          Token = storeRes.data.Token;
        }
        if (Token) {
          headers['Token'] = Token;
        }
      }
    }
    return [url, headers];
  },
  get: (url, params = {}, headers = {}, usrTimeout = null, errorCallback, completeCallback) => {
    [url, headers] = Http.reConstruct(url, headers);
    params._t = new Date().getTime();
    return new Promise((resolve, reject) => {
      my.httpRequest({
        url: url,
        method: 'GET',
        data: params,
        timeout: usrTimeout || Http._timeout,
        headers: headers,
        dataType: 'json',
        success: function(res) {
          if (res.data) {
            if (res.data.code == '1001') {
              // 用户未登陆的错误编码
              // my.confirm({
              //    content: '未登陆。点击 “确认” 按钮将重新授权登陆',
              //    confirmButtonText: '确认',
              //    cancelButtonText: '取消',
              //    success: (result) => {
              //      if (result.confirm) { // true or false

              //      }
              //    },
              //  });
              resolve(res.data);
            } else {
              resolve(res.data);
            }
          } else {
            reject(res);
            setError(res);
          }
        },
        fail: function(err) {
          reject(err);
          setError(err);
          if (typeof errorCallback === 'function') {
            errorCallback(err);
          }
        },
        complete: function(res) {
          if (typeof completeCallback === 'function') {
            completeCallback(res);
          }
        }
      });
    });
  },
  post: (url, data = {}, headers = {}, usrTimeout = null, errorCallback) => {
    [url, headers] = Http.reConstruct(url, headers);
    return new Promise((resolve, reject) => {
      my.httpRequest({
        url: url,
        method: 'POST',
        data: JSON.stringify(data),
        timeout: usrTimeout || Http._timeout,
        headers: headers,
        dataType: 'json',
        success: function(res) {
          if (res.data) {
            resolve(res.data);
          } else {
            reject(res);
            setError(res);
          }
        },
        fail: function(err) {
          reject(err);
          setError(err);
          if (typeof errorCallback === 'function') {
            errorCallback(err);
          }
        },
        complete: function(res) {
          if (typeof completeCallback === 'function') {
            completeCallback(res);
          }
        }
      });
    });
  }
};

export default Http;
