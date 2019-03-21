Component({
  props: {
    title: '',
    onTap: () => {},
    subTitle: '',
    type: '',
    buttonText: '',
    id: '', // 优惠券编号
    amount: '',
    status: '',
    promotionNo: '' // 优惠券所属活动编号
  },
  didMount() {},
  didUpdate(prevProps, prevData) {
    // console.log('222', prevProps, this.props, prevData, this.data);
  },
  methods: {
    onCardClick() {
      const info = { ...this.props };
      this.props.onTap(info);
    }
  }
});
