Component({
  props: {
    title: '',
    questions: [],
    onTap: () => {}
  },
  didMount() {
    // console.log('collapse', this.props);
  },
  didUpdate(prevProps, prevData) {},
  methods: {
    onTitleTap(e) {
      const info = { ...this.props };
      this.props.onTap(e, info);
    }
  }
});
