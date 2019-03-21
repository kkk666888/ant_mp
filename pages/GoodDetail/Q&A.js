const questions = [
  {
    title: '关于商品',
    qa: [
      {
        question: '1、  二手机器质量如何？',
        answers: ['物主严选手机来源，对租赁的二手机器均会进行专业质检、消毒、包装，竭力为您提供优质的二手手机。'],
        expanded: false
      },
      {
        question: '2、  使用过程中出现轻微划痕怎么办？',
        answers: [' 正常使用手机产生的轻微划痕、磕碰属于自然损耗，不会产生相关费用，不影响商品归还。'],
        expanded: false
      },
      {
        question: ' 3、  商品使用什么快递发货？',
        answers: ['物主租赁的商品均使用顺丰等极速快递发货，偏远地区等特殊情况以实际到达的快递为准。'],
        expanded: false
      }
    ]
  },
  {
    title: '关于租赁',
    qa: [
      {
        question: '1、  租期怎么计算呢？',
        answers: [
          '从物品签收的第二天起计算，到合同约定的租赁期满为止，物流时间不计入租期，租赁期间不支持更改租期，以下单时选择的租期为准。'
        ],
        expanded: false
      },
      {
        question: '2、  商品如何买断？',
        answers: [
          '机器到期时买断，支付买断尾款即可终身拥有；若想提前买断，租期内可在我的订单页面点击买断按钮，确认买断费用后支付成功即可买断商品。'
        ],
        expanded: false
      },
      {
        question: '3、  可以同时下多个订单吗？',
        answers: ['物主不限制客户租赁的数量，您有多款商品需要租赁时，可根据支付宝评估的免押额度来考虑是否租赁。'],
        expanded: false
      }
    ]
  },
  {
    title: '关于售后',
    qa: [
      {
        question: '1、  如何享受意外保障服务呢？',
        answers: [
          '如果您的手机在租赁期间出现故障，请及时联系客服，我们将有专业的维修工程师为您处理，属于意外保障范围内的项目，物主将为您提供免费维修服务。'
        ],
        expanded: false
      },
      {
        question: '2、  租赁过程中，有问题可以联系谁？',
        answers: ['租赁过程中，您有任何问题都可以通过在线客服或拨打热线联系我们，我们将竭诚为您服务。'],
        expanded: false
      }
    ]
  },
  {
    title: '关于费用',
    qa: [
      {
        question: '1、   租金如何计算？',
        answers: ['总租金=日租金*租赁天数，平台展示的月租金为日租金*30天，每月租金账单=每月实际使用天数*日租金。'],
        expanded: false
      },
      {
        question: '2、   买断费用如何计算？',
        answers: ['买断费用=买断尾款+未支付的租金，具体以买断页面展示的金额为准。'],
        expanded: false
      },
      {
        question: '3、  邮费谁来承担？',
        answers: ['除退换货等协议约定的情况外，正常租赁过程中产生的邮费遵循谁寄谁付的原则。'],
        expanded: false
      }
    ]
  }
];
export default questions;
