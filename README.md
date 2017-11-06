# simple-react-native-hot-code-push-server

## 摘要 (Abstract)

配合simple-react-native-hot-code-push的服务器端代码，使用Node.js和Express框架构建。

> 注意：由于本项目使用了bsdiff进行分包操作，而bsdiff的命令行目前只支持了Mac和Linux，故不能在Window系统中运行。

This project builded for providing ths management service of react native. Node.js and Express.js was used in this project.

> NOTICE: As for using bsdiff algrithm in the this project, the cmd of bsdiff only  be supported with MAC and Linux system, **NOT** with Window system.

## 业务与功能 (Functions)

服务器将完整的jsbundle包拆分为一个**公共包**和一个**业务包**,拆分使用的是bsDiff算法，(可以自行替换成为google-diff-match-patch,两个算法的比较见[compare-file-diff-tools](https://github.com/MarcusMa/compare-file-diff-tools)，客户端检查更新时，服务器端会根据客户端包的信息发送对应的升级包下载地址和哈希值。

The sever can diff your jsbundle to a small patch file named "**business package**" with a common jsbundle file named "**common package**". I compare two different algrithm: *google-diff-match-patch* and *bsdiff*, and I choose the *bsdiff* finally, as the performance is good in the client side (more deials about the compatition, please see [compare-file-diff-tools](https://github.com/MarcusMa/compare-file-diff-tools)). When the client requests to the server for checking, the server would response the update information (include download url and hashcode of the file).

## 使用方法 (Usage)

1. 环境要求 Mac 或者 Linux 系统
1. 安装 *node.js*，操作可百度或谷歌;
1. 进入到本项目根目录，执行`npm install`（若`npm`不能使用，可切换成`cnpm`）;
1. 在根目录下执行`node index`, 完成服务器启动;
1. 若有要测试新的更新包，请将文件防止在`public/original/business`目录下，同时命名方式参照该目录下已有的文件格式，之后重启服务即可完成新包的发布。

> 注意: 如果你使用了不同版本的RN，你也新生成一个common包，并将它放置到`public/original/`下, 但需要诸多配置（服务器端和客户端都需要做相应修改），在未完全理解该文件的使用方法的情况下建议无需更改。

1. Supported system environment: Mac or Linux.
1. Install *node.js*.
1. Entry the root dir of project, and execute `npm install` in the terminal.
1. Start the server by execute `node index` in the terminal.
1. Put your rewrited jsbundle file in the dir `public/original/business`, please notice the formate of your filename, and restart the server.

> NOTICE: It is **NOT** Nececessary to update the *common_min.bundle* file, event if you used differnt version of the React Native.

## 接口说明 (API)

### /checkForUpdate

* 接口请求示例 (Example for Request in the client)

```
{
    businessList:[
        {
            id:"AAF047B7-E816-2AE0-949A-D5FB4CE40245"
            hashcode:"01824139386045ca6739dd52b3bfb74a76b9b99fefb336f4e1a147a182cad6ba"
        }
    ]
}
```

* 接口返回示例 (Example for Response in the server)

```
{
    success: 1,
    msg: "成功"
    data: [{
            id: "AAF047B7-E816-2AE0-949A-D5FB4CE40245",
            verifyHashCode: "01824139386045ca6739dd52b3bfb74a76b9b99fefb336f4e1a147a182cad6ba",
            latestPatch: {
                hashCode: "c1bbdc02200b5e5a72cf97bbdc3339165e71182c61f",
                downloadUrl: "http://download.marcusma.com/rn/marcusma.patch",
            }
        }
    ]
}
```
