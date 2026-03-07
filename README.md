# 发个东西
一个局域网文字/文件P2P传输工具
> 项目中仅在线用户列表和WebRTC信令迫不得已需要一个轻量化的服务，其他数据传输都采用了基于WebRTC的点对点传输，不经过中间服务器，所以局域网内互传一些文字/文件都比较快。

demo演示：https://fagedongxi.com

## 优点
无需安装任何软件，打开浏览器，无需登录直接传输。

## 模式说明
### 1) 局域网模式（默认）
* 直接进入，无需配置
* 自动按内网频道聚合在线列表

### 2) 公共房间模式
* 在页面中切换到「公共房间」后可查看房间列表
* 支持创建并进入公共房间（无密码）
* 公共房间最多同时存在 `5` 个
* 房间内最后一人退出后自动解散
* 前端使用 hash 记录模式状态，刷新后可保持当前模式/房间

### 3) 私有房间模式（隐藏入口）
* 仅通过 URL 路由进入（如 `/{roomId}`）
* 仍通过 `room_pwd.json` 做密码校验与可选 TURN 配置

## 缺点
接收大文件比较吃内存（单文件几百兆一般没问题）

## 场景：
比如新装的win系统需要从mac系统传一些需要🪜才能下载的软件或者搜到的一些东西

## 部署/启动
> 自`1.1.0`版本后，不再需要单独部署网页端了，仅启动一个服务端即可

参考视频：https://v.douyin.com/zp_dXkV1fys/

### 源码方式
1. 安装nodejs，node版本没有测试，我用的是 `16.20.2`
2. 下载源码
3. 进入 项目根目录，运行 `npm install`
4. 运行 `npm run start [port]` ，例如 `npm run start 8081`

### 二进制方式
* 下载对应平台的可执行文件，直接执行即可
* 默认监听 `8081` 端口，可通过参数指定端口，例如 `./internal-chat-linux 8082`
* 如果你用windows，可参考 https://v.douyin.com/CeiJahpLD/ 注册成服务

## 房间配置
* 配置文件名：`room_pwd.json`
* 存放目录：应用同级目录
* 格式：参考样例 `.room_pwd.json`

## 常见问题：
在线列表看见对方，但一直处于断开的状态且无法发送消息：
* 原因一：浏览器不支持WebRTC（目前最新版已经在用户打开后自动检测并加入提示），旧版没有检测功能可以临时用这个进行测试：https://space.coze.cn/s/qDNpw1y7MJw/
* 原因二：网络环境不支持互相访问，详见：https://v.douyin.com/IPoHlTBzngg/
  > 解决方案：
  >  1. 私有部署「发个东西」+「TURN中转服务coturn」
  >  2. 配置房间增加TURN支持（ `.room_pwd.json` 样例文件中有TURN的配置格式）

## 视频通话
* 支持房间内用户之间发起 WebRTC 视频通话
* 若 P2P 建连失败，仅显示连接失败状态，不会自动降级为中继

## 高级网络选项（局域网模式）
* 自动读取本机网段并以下拉框选择，无需手填 VPN/网卡信息
* 选择网段后，系统自动设置局域网分组并过滤候选，优先局域网直连
* 支持展示当前探测到的全部 Local IP
* 支持手动输入 LAN 分组键/候选前缀作为兜底

## 连接状态展示
* 用户列表显示 WebRTC 连接状态（连接中/已连接/失败等）
* 已连接用户显示实时传输速率（上行/下行）与 RTT

### nginx代理配置样例
```
server
{
  server_name fagedongxi.com;
  index index.html;
  listen 80;

  location / {
    proxy_pass  http://127.0.0.1:8081/;
  }

  location /ws/ {
      proxy_pass http://127.0.0.1:8081/ws/;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

}
```
## 免责声明：
本项目仅用于学习交流，请勿用于非法用途，否则后果自负。
