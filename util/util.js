// 数组去重
export function Unique(arr) {
  let res = [];
  for (let i = 0; i < arr.length; i++) {
    if (res.indexOf(arr[i]) == -1) {
      res.push(arr[i]);
    }
  }
  return res;
}

// 数组取交集 -- 入参为数组
export function Intersect() {
  let res = [];
  let obj = {};
  for (let i = 0; i < arguments.length; i++) {
    // 获取到传入的参数 arguments[i]
    for (let j = 0; j < arguments[i].length; j++) {
      // 遍历数组
      let str = arguments[i][j];
      if (!obj[str]) {
        obj[str] = 1;
      } else {
        obj[str]++;
        if (obj[str] == arguments.length) {
          // 取交集 -- 每个 arr 都有
          res.push(str);
        }
      }
    }
  }
  return res;
}

// 数组取并集 -- 入参为数组
export function Union() {
  let res = [];
  let obj = {};
  for (let i = 0; i < arguments.length; i++) {
    for (let j = 0; j < arguments[i].length; j++) {
      let str = arguments[i][j];
      if (!obj[str]) {
        obj[str] = 1;
        res.push(str);
      }
    }
  }
  return res;
}

/**
 * 日期转字符串
 * @param fmt
 * @returns
 */
export function setDateFormat() {
  Date.prototype.Format = function(fmt) {
    var o = {
      'M+': this.getMonth() + 1, // 月份
      'd+': this.getDate(), // 日
      'h+': this.getHours(), // 小时
      'm+': this.getMinutes(), // 分
      's+': this.getSeconds(), // 秒
      'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
      S: this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
      }
    }
    return fmt;
  };
}

/**
 * 日期转年月日
 * @param {String} dateStr 格式 2018-01-01 10:00:00
 * @returns fmt 格式  2019年1月1日
 */
export const formatDateInCN = dateStr => {
  if (dateStr) {
    let arr = dateStr.split(/[- : \/]/);
    let timeTmp = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
    let fmt = `${timeTmp.getFullYear()}年${timeTmp.getMonth() + 1}月${timeTmp.getDate()}日`;
    return fmt;
  }
};

//兼容苹果浏览器 date的格式为2018-01-01 10:00:00 || 2018/01/01 10:00:00
export function dateFormat(dateStr, fmt) {
  if (dateStr) {
    let arr = dateStr.split(/[- : \/]/);
    let date = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
    return date.Format(fmt);
  }
}

// '1,000.00' -> 1000.00 -- 价格转化
export function removeSeparator(num) {
  if (!num.length) {
    return 0;
  }
  let fixNum;
  let decimal = num.indexOf('.') ? num.substring(num.indexOf('.')) : 0;
  if (decimal - 0 > 0) {
    fixNum = num;
  } else {
    fixNum = num.substring(0, num.indexOf('.'));
  }
  fixNum = fixNum.toString().indexOf(',') !== -1 ? fixNum.toString().replace(/,/gi, '') : fixNum;
  return parseFloat(fixNum);
}

// '1000.00' -> '1,000.00' -- 价格转化
export function addSeparator(str) {
  if (!str) return '0.00';
  let num = parseFloat(str).toFixed(3);
  let s = num.substring(0, num.length - 1);
  return (
    s &&
    s.toString().replace(/(\d)(?=(\d{3})+\.)/g, function($0, $1) {
      return $1 + ',';
    })
  );
}

// 小数减法
export const accSub = (arg1, arg2) => {
  var r1, r2, m, n;
  try {
    r1 = arg1.toString().split('.')[1].length;
  } catch (e) {
    r1 = 0;
  }
  try {
    r2 = arg2.toString().split('.')[1].length;
  } catch (e) {
    r2 = 0;
  }
  m = Math.pow(10, Math.max(r1, r2)); //last modify by deeka //动态控制精度长度
  n = r1 >= r2 ? r1 : r2;
  return ((arg1 * m - arg2 * m) / m).toFixed(n);
};
