const Config = {
  active: 'test',
  test: {
    // 测试环境
    appid: '2018051160089323',
    channelNo: '002',
    _hoststr: 'https://wuzhusle.woozhu.cn'
  },
  dev: {
    // 开发环境
    appid: '2018051160089323',
    channelNo: '002',
    // _hoststr: 'http://10.35.40.125:9093', // 毛总
    _hoststr: 'http://192.168.1.9:9093/' // 余兵
    // _hoststr: 'http://qianyi.s1.natapp.cc' // 钱毅
    // _hoststr: 'http://192.168.0.188:9093' // 钱毅
  },
  product: {
    // 生产环境
    appid: '2018051160089323',
    channelNo: '002',
    _hoststr: 'https://wuzhu.woozhu.cn'
  }
};

export default Config[Config.active];
