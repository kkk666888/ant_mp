Component({
  mixins: [], // minxin 方便复用代码
  data: { // 组件内部数据
  },
  props: { // 可给外部传入的属性添加默认值
    isShowAdvantage: true,
    advTitle: '租赁 iPhone X 全新国行',
    leftDay: 30,
    leftPrice: 400,
    rightPrice: 3000
  },
  didMount() { // 生命周期函数
  },
  didUpdate() {},
  didUnmount() {},
  methods: { // 自定义事件
  },
});