/**
 * 图片压缩脚本，需安装tinify的包，不支持gif格式
 * 压缩目录image，输出目录dist
 * Created time: 2019-01-15, by hcg
 */

const fs = require('fs');
const tinify = require('tinify');
const mkdirp = require('mkdirp');

// 调用服务的key，个人申请，加密请求
tinify.key = 'X98dnQDXMZx0MGDpw7cltvTXZkNr26wS';
// 要压缩的图片目录，输出为同级 dist 目录
const img = './image';

// 递归读取文件夹
function readDir(path) {
  fs.readdir(path, (err, files) => {
    if (err) {
      throw err;
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let filePath = path + '/' + file;
      fs.stat(filePath, (err, stats) => {
        if (err) {
          throw err;
        }
        if (stats.isDirectory()) {
          readDir(filePath);
          mkdirs(filePath);
        } else {
          miniFile(filePath);
        }
      });
    }
  });
}

// mkdir -p 创建目录及子目录
function mkdirs(path) {
  let distDir = path.replace('/image/', '/dist/');
  mkdirp(distDir, () => {});
}

// 压缩图片并输出到 dist 目录
function miniFile(file) {
  console.log('file', file);
  try {
    const source = tinify.fromFile(file);
    let newDir = file.replace('/image/', '/dist/');
    source.toFile(newDir);
  } catch (error) {
    console.log('err', error);
  }
}

readDir(img);
