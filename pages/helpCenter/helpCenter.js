import questions from './questions.js';
const app = getApp();
Page({
  data: {
    questions: questions
  },
  // 分享
  onShareAppMessage() {
    return app.shareObj.common;
  }
});
