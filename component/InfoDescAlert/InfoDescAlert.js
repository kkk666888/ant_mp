Component({
  mixins: [],
    data: {
    },
  props: {
      dialogTitle: '',
      dialogContent: '',
      onHideBtnClick: () => console.log('隐藏dialog')
  },
  didMount(){
      // 根据当前的屏幕设置最大的高度 真机上是 667 模拟器上是 624
      // let screenHeight = my.getSystemInfoSync().screenHeight
      // let pixelRatio = my.getSystemInfoSync().pixelRatio
      // let realRpxH = screenHeight * 1.0 * pixelRatio
      // let max_content_height = screenHeight - 102 - 154 - 64 * 2 - 150 * 2
      // let contentEle = my.createSelectorQuery().select('.contentDetail')
      // contentEle.style['max-height'] = max_content_height
      // console.log('contentEle ====== ' + JSON.stringify(contentEle))
      //
      // console.log('screenHeight ============' + screenHeight)
      // console.log('pixelRatio ============' + pixelRatio)
      // console.log('realRpxH ============' + realRpxH)
  },
  didUpdate(){},
  didUnmount(){},
  methods: {
      // 关闭费用说明的弹框
      closeFeeDesc: function () {
          console.log('关闭的按钮被点击')
          this.props.onHideBtnClick()
      },
  },
})
