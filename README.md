# simple-react-native-hot-code-push-server
## 摘要
配合simple-react-native-hot-code-push的服务器端代码，使用Node.js和Express框架构建
## 业务与功能
服务器将完整的jsbundle包拆分为一个**公共包**和一个**业务包**,拆分使用的是bsDiff算法，(可以自行替换成为google-diff-match-patch,两个算法的比较见https://github.com/MarcusMa/compare-file-diff-tools），更加客户端返回的包的信息发送对应的升级包下载地址。
## 使用方法
1. 安装*node.js*，操作可百度或谷歌;
2. 进入到本项目根目录，执行`npm install`;
> 如`npm`不能很好使用，请切换成`cnpm`;
3. 在根目录下执行`node index`, 完成服务器启动;

## 接口说明

### checkForUpdate
检查jsbundle是否有更新接口

