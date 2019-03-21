//  将列表中所有的租期获取处理啊并且进行去重复操作<并且获取对应的租赁方式列表>
// 创建一个用于枚举的对象
export let CategoryStatus = {};
CategoryStatus.Normal = 0;   // 存在该机型的设备，但是被没有被用户选定
CategoryStatus.Disable = 1;  // 无对应机型的设备
CategoryStatus.Selected = 2; // 存在着该机型，且已经被用户选定

// 入参: 商品详情部分的https的返回结果报文
export function parseRentDayList(data) {
    let termDayArray = [];
    let rentStyleArray = [];
    let goodslist = data['listCommodity'];
    let maxDay = 0;
    if (goodslist !== undefined && goodslist instanceof Array) {
      for (let g = 0; g < goodslist.length; g++) {
        let tempGood = goodslist[g];
        let listProduct = tempGood && tempGood['listProduct']
        if (listProduct !== undefined && listProduct instanceof Array) {
          for (let p = 0; p < listProduct.length; p++) {
            let product = listProduct[p]
            // productNo 是金融产品的唯一标识
            let findResult = termDayArray.findIndex(function(element, index, array) {
              return element.totalDays === product.totalDays;
            });
            let rentResult = rentStyleArray.findIndex(function(element, index, array) {
              return element.rentSolution === product.rentSolution
            })
            if (findResult === -1) {
              // 如果不存在添加到该列表中
              termDayArray.push({
                productNo: product.productNo,
                totalDays: product.totalDays,
                Status: CategoryStatus.Normal,
                cssName: 'kind-btn btn-gray',
                termShortDes: product.termShortDes
              })
              if (maxDay < product.totalDays) {
                maxDay = product.totalDays
              }
            }
            if (rentResult === -1) {
              // 如果不存在添加到该列表中
              rentStyleArray.push({
                rentSolution: product.rentSolution,
                rentSolutionName: product.rentSolutionName,
                Status: CategoryStatus.Normal,
                cssName: 'kind-btn btn-gray'
              })
            }
          }
        }
      }
    }
    let financeProductList = termDayArray;
    // 采用元祖的方式返回，返回租赁方式列表和 租赁天数的列表
    return [financeProductList, rentStyleArray];
  }


  // 建立对象模型
export class CategoryClass {
    constructor(props) {
      // 请传入对应服务器给定的json
      this.categorySpecCode = props.categorySpecCode || '';
      this.specName = props.specName || '';
      this.specContent = props.specContent || '';
      this.recommendNo = props.recommendNo || '';
      this.Status = CategoryStatus.Normal;
      this.MyGoods = []; // 该类型下，对应的商品类型
    }
  
    equalWithcategorySpecCode(otherObj) {
      if (this.categorySpecCode === otherObj.categorySpecCode) {
        return true;
      } else {
        return false;
      }
    }
  
    isTheSameType(otherObj) {
      if (this.specName === otherObj.specName) {
        return true;
      } else {
        return false;
      }
    }
  
    // 用于判断当前的类的配置 的同一品类是否在当前商品的列表内
    // 如果存在返回对应其在列表中下标，否则返回 -1
    // 该函数并不会对数组进行改变，所以没必要用纯函数
    findMyCategoryFamilyIndex(chooseList) {
      let sameTypeIndex = -1;
      // 过滤掉数组里面对应同一种类型的数据<不是同一种类型就保存>
      for (let i = 0; i < chooseList.length; i++) {
        let tempItem = chooseList[i];
        if (this.isTheSameType(tempItem)) {
          sameTypeIndex = i;
          break; // 由于数组的特殊性所以可以直接返回
        }
      }
      return sameTypeIndex;
    }
  
    // 判断当前商品列表中是否存在用户选择的品类组合  （类似js自身的查找逻辑）
    // 如果存在 返回对应产品的下标  如果是不存在 返回 -1
    findGoodsIndexOfMyGoods(chooseList) {
      let indexOfGoods = -1;
      for (let i = 0; i < this.MyGoods.length; i++) {
        let currentGood = this.MyGoods[i];
        let goodsCategorySpecList = currentGood['listCommoditySpec'];
        let currentResult = true;
        for (let j = 0; j < chooseList.length; j++) {
          let categortyItem = chooseList[j];
          let findResult = goodsCategorySpecList.findIndex(function(element, index, array) {
            return element.categorySpecCode === categortyItem.categorySpecCode;
          });
          // 只要有一个不存在，那么就可以判定不存在着，这样的商品组合
          if (findResult === -1) {
            currentResult = false;
            break;
          }
        }
        // 如果找到，那么可以直接结束，返回对应的结果
        if (currentResult === true) {
          indexOfGoods = i;
          break;
        }
      }
      return indexOfGoods;
    }
  
    // ChooseList里面包含的内容为
    // specName: item.specName,
    // Array: sunArray,<CategoryClass *>
    // SelectedItem: {}
    // 实现纯函数  ==== "JS里面的深拷贝和浅拷贝的意思？？"
    getMyStatus(chooseList) {
      var tempChooseList = JSON.parse(JSON.stringify(chooseList));
      let isInChooseList = false;
      let isInSameTypeIn = false;
      let sameTypeIndex = -1;
      // 过滤掉数组里面对应同一种类型的数据<不是同一种类型就保存>
      for (let i = 0; i < tempChooseList.length; i++) {
        let tempItem = tempChooseList[i];
        if (this.isTheSameType(tempItem)) {
          isInSameTypeIn = true;
          sameTypeIndex = i;
          if (this.equalWithcategorySpecCode(tempItem)) {
            isInChooseList = true; // 不做任何更改，只需要将对应状态变成选定状态
            break;
          }
        }
      }
  
      // 如果当前项目已经存在约当前选择列表中
      if (isInChooseList) {
        this.Status = CategoryStatus.Selected;
      } else {
        if (isInSameTypeIn) {
          tempChooseList.splice(sameTypeIndex, 1, this);
        } else {
          tempChooseList.push(this);
        }
  
        // 开始找对应的下标
        let result = this.findGoodsIndexOfMyGoods(tempChooseList);
        if (result === -1) {
          this.Status = CategoryStatus.Disable;
        } else {
          this.Status = CategoryStatus.Normal;
        }
      }
    }
  }
  
  // 用于解析服务器返回的数据的类
  export class ParseData {
    // 用于解析从服务器返回的数据
    constructor(props) {
      // 请传入对应服务器给定的json
      let goodDetail = props;
      this.commodities = goodDetail;
      let DetailImgList = goodDetail && goodDetail['detailImgList'].split(',');
      let bannerList = [];
      if (DetailImgList !== undefined && DetailImgList instanceof Array) {
        for (var i = 0; i < DetailImgList.length; i++) {
          bannerList.push({
            url: 'https://www.baidu.com',
            img: DetailImgList[i]
          });
        }
      }
      this.bannerList = bannerList;
      this.categoryTable = [];
      this.financeProductList = [];         // 租期列表
      this.rentStyleArray = [];             // 租赁方式列表
    }
    // 获取图文详情的文件列表
    getImageTxtList() {
      let detailImageListStr = this.commodities && this.commodities['detailImg'];
      let DetailImgList = detailImageListStr.split(',');
      if (DetailImgList !== undefined && DetailImgList instanceof Array) {
        return DetailImgList;
      } else {
        return [];
      }
    }
    // 获取租赁说明的文件列表
    getRentImageList() {
      // 租赁说明的图文详情
      let detailImgUrlsStr = this.commodities && this.commodities['detailImgUrls'];
      let detailImgUrls = detailImgUrlsStr.split(',');
      if (detailImgUrls !== undefined && detailImgUrls instanceof Array) {
        return detailImgUrls;
      } else {
        return [];
      }
    }
    //  用于将后天返回的json装成
    //  specName Array SelectedItem 这样的数组
    parseCategoryList() {
      let categorylist = this.commodities['listCommodityCategorySpec'];
      let tempList = [];
      let exist = false;
      // 判断该对象是否为数组对象
      if (categorylist !== undefined && categorylist instanceof Array) {
        for (let i = 0; i < categorylist.length; i++) {
          let item = categorylist[i];
          exist = false;
          for (let j = 0; j < tempList.length; j++) {
            let obj = tempList[j];
            if (obj.specName === item.specName) {
              let categortyItem = new CategoryClass(item);
              obj.Array.push(categortyItem);
              exist = true;
              break;
            }
          }
          if (exist === false) {
            let sunArray = [];
            let categortyItem = new CategoryClass(item);
            sunArray.push(categortyItem);
            tempList.push({
              specName: item.specName,
              Array: sunArray,
              SelectedItem: {},
              recommendNo: item.recommendNo
            });
          }
        }
      }
      tempList = this.sortCategoryList(tempList);
      this.categoryTable = tempList; // 解析完成之后赋值给该对象
      return tempList;
    }
    // 根据对应的推荐细数来指定对应的排序内容
    sortCategoryList(originList) {
      // 决定最终的比较顺序
      function sortMethod(item0, item1) {
        // eslint-disable-line
        let re0 = item0.recommendNo;
        let re1 = item1.recommendNo;
        if (re0 > re1) {
          return -1;
        }
        if (re0 < re1) {
          return 1;
        }
        return 0;
      }
      let sortList = originList;
      if (originList !== undefined && originList instanceof Array) {
        for (let i = 0; i < originList.length; i++) {
          let Item = originList[i];
          let sonArray = Item.Array.sort(sortMethod);
          Item.Array = sonArray;
        }
        sortList = originList.sort(sortMethod);
      }
      return sortList;
    }
    //  用于将后台返回的json装成
    //  specName Array SelectedItem 给对应的Array里面的 CategoryClassd 对象绑定 myGoodsList
    parseGoodsList() {
      let goodslist = this.commodities['listCommodity'];
      if (goodslist !== undefined && goodslist instanceof Array) {
        for (let i = 0; i < this.categoryTable.length; i++) {
          let sectionItem = this.categoryTable[i];
          let array = sectionItem.Array;
          for (let j = 0; j < array.length; j++) {
            let categortyItem = array[j];
            for (let g = 0; g < goodslist.length; g++) {
              let currentGood = goodslist[g];
              let goodsCategorySpecList = currentGood['listCommoditySpec'];
              let findResult = goodsCategorySpecList.findIndex(function(element, index, array) {
                return element.categorySpecCode === categortyItem.categorySpecCode;
              });
              if (findResult !== -1) {
                // 只添加对应该商品的规格列表和对应的对应的数组编号进入数组
                categortyItem.MyGoods.push({
                  goodsIndex: g,
                  commodityNo: currentGood.commodityNo,
                  listCommoditySpec: currentGood.listCommoditySpec
                })
                // categortyItem.MyGoods.push(currentGood);
              }
            }
          }
        }
      }
    }
    //  将列表中所有的租期获取处理啊并且进行去重复操作<并且获取对应的租赁方式列表>
    parseRentDayList() {
      let termDayArray = [];
      let rentStyleArray = [];
      let goodslist = this.commodities['listCommodity'];
      let maxDay = 0;
      if (goodslist !== undefined && goodslist instanceof Array) {
        for (let g = 0; g < goodslist.length; g++) {
          let tempGood = goodslist[g];
          let listProduct = tempGood && tempGood['listProduct']
          if (listProduct !== undefined && listProduct instanceof Array) {
            for (let p = 0; p < listProduct.length; p++) {
              let product = listProduct[p]
              // productNo 是金融产品的唯一标识
              let findResult = termDayArray.findIndex(function(element, index, array) {
                return element.totalDays === product.totalDays;
              });
              let rentResult = rentStyleArray.findIndex(function(element, index, array) {
                return element.rentSolution === product.rentSolution
              })
              if (findResult === -1) {
                // 如果不存在添加到该列表中
                termDayArray.push({
                  productNo: product.productNo,
                  totalDays: product.totalDays,
                  Status: CategoryStatus.Normal,
                  termShortDes: product.termShortDes
                })
                console.log('termDayArray = ' + JSON.stringify(termDayArray))
                if (maxDay < product.totalDays) {
                  maxDay = product.totalDays
                }
              }
              if (rentResult === -1) {
                // 如果不存在添加到该列表中
                rentStyleArray.push({
                  rentSolution: product.rentSolution,
                  rentSolutionName: product.rentSolutionName,
                  Status: CategoryStatus.Normal
                })
              }
            }
          }
        }
      }
      this.financeProductList = termDayArray;
      this.rentStyleArray = rentStyleArray;
      this.maxDay = maxDay;
      console.info('financeProductList ==== ' + JSON.stringify(termDayArray))
    }
  }