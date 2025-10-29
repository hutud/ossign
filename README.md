# 微信视频号下载服务

一个自动化的微信服务号应用，可以接收从视频号转发的视频，自动下载并保存到服务器，然后通过微信消息反馈下载结果。

## 功能特点

### 核心功能
- ✅ **视频号视频下载**（从视频号转发）
- ✅ 普通视频下载（用户直接发送）
- ✅ 自动识别消息类型
- ✅ 实时反馈下载进度和结果
- ✅ 查看已下载视频列表
- ✅ 提供 RESTful API 接口

### 视频号功能
- ✅ 自动识别视频号链接消息
- ✅ 解析 objectId 和 objectNonceId
- ✅ 支持配置第三方解析API
- ✅ 下载失败时提供视频号链接
- ✅ 可视化配置解析服务

### 后台管理系统
- ✅ 可视化配置管理界面
- ✅ 在线配置微信公众号密钥
- ✅ **视频号解析API配置**
- ✅ 视频列表查看和管理
- ✅ 系统设置和参数配置
- ✅ 管理员密码修改
- ✅ 登录认证保护

## 技术栈

- **运行环境**: Node.js
- **Web框架**: Express.js
- **微信API**: 微信公众平台接口
- **文件操作**: fs-extra
- **HTTP请求**: axios
- **XML解析**: xml2js

## 目录结构

```
ossign/
├── src/
│   ├── config/
│   │   └── index.js            # 配置管理
│   ├── middleware/
│   │   └── auth.js             # 认证中间件
│   ├── routes/
│   │   └── admin.js            # 后台管理路由
│   ├── services/
│   │   ├── configManager.js    # 配置持久化服务
│   │   ├── messageHandler.js   # 消息处理服务
│   │   ├── videoDownloader.js  # 视频下载服务
│   │   └── wechatAPI.js        # 微信API服务
│   ├── utils/
│   │   └── wechat.js           # 微信工具函数
│   └── server.js               # 主服务器文件
├── public/                      # 前端页面
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css       # 样式文件
│   │   └── js/
│   │       └── common.js       # 通用JS
│   ├── login.html              # 登录页面
│   ├── dashboard.html          # 仪表盘
│   ├── config.html             # 配置管理
│   ├── videos.html             # 视频列表
│   └── settings.html           # 系统设置
├── data/
│   └── config.json             # 配置存储文件（自动创建）
├── downloads/                   # 视频下载目录（自动创建）
├── .env.example                # 环境配置示例
├── .gitignore                  # Git忽略配置
├── package.json                # 项目依赖
└── README.md                   # 项目文档
```

## 快速开始

### 1. 前置要求

- Node.js >= 14.0.0
- npm 或 yarn
- 已注册的微信服务号

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务启动后，会显示：
```
🚀 微信视频下载服务已启动
📡 服务地址: http://localhost:3000
📁 下载目录: ./downloads

📱 后台管理:
   访问地址: http://localhost:3000/admin/login
   默认账号: admin
   默认密码: admin123
```

### 4. 配置微信公众号（通过后台管理系统）

1. 访问后台管理系统：`http://localhost:3000/admin/login`
2. 使用默认账号登录（admin / admin123）
3. 进入「配置管理」页面
4. 填写微信公众号配置：
   - **AppID**: 在微信公众平台"开发-基本配置"中查看
   - **AppSecret**: 在微信公众平台"开发-基本配置"中查看
   - **Token**: 自定义token（需与微信后台配置一致）
   - **EncodingAESKey**: 可选，如使用加密模式需填写
5. 点击"保存配置"

### 5. 配置微信公众平台服务器

在微信公众平台后台配置：

1. 进入「开发」-「基本配置」
2. 服务器配置：
   - **URL**: `http://你的域名:3000/wechat`
   - **Token**: 与后台管理系统中配置的Token一致
   - **EncodingAESKey**: 与后台管理系统中配置的一致（可选）
   - **消息加解密方式**: 建议选择"明文模式"或"兼容模式"
3. 点击"提交"并启用配置

## 使用方法

### 用户操作流程

1. **关注服务号**
   - 关注后会收到欢迎消息和使用说明

2. **转发视频**
   - 从微信视频号找到想要下载的视频
   - 点击分享/转发
   - 选择转发到你的服务号

3. **接收下载结果**
   - 系统会立即回复"收到视频，正在下载中..."
   - 下载完成后会发送包含文件名、大小等信息的消息

4. **查看已下载视频**
   - 发送"列表"或"list"查看已下载的视频列表

### 支持的命令

在服务号对话框中发送以下命令：

- `帮助` 或 `help` - 查看使用帮助
- `列表` 或 `list` - 查看已下载的视频列表

## 后台管理系统

### 访问地址

```
http://localhost:3000/admin/login
```

### 默认账号

- **用户名**: admin
- **密码**: admin123

**重要**: 首次登录后，请立即修改默认密码！

### 功能模块

#### 1. 仪表盘 (Dashboard)

- 查看系统统计信息
  - 总视频数
  - 总文件大小
  - 最新下载时间
- 查看最新下载的视频列表
- 快速访问其他功能模块

#### 2. 配置管理 (Config)

**微信公众号配置**
- AppID: 公众号的AppID
- AppSecret: 公众号的AppSecret
- Token: 自定义Token（需与微信后台一致）
- EncodingAESKey: 消息加密密钥（可选）

**配置说明**
- 所有配置保存后立即生效（Token相关配置需与微信后台同步）
- 页面包含详细的配置指引
- 自动显示服务器URL配置地址

#### 3. 视频列表 (Videos)

- 查看所有已下载的视频
- 显示视频信息：
  - 文件名
  - 文件大小
  - 下载时间
  - 文件路径
- 支持自动刷新（每30秒）
- 手动刷新功能

#### 4. 系统设置 (Settings)

**系统配置**
- 服务端口（修改后需重启）
- 下载目录路径
- 最大视频大小限制

**修改密码**
- 修改管理员登录密码
- 密码长度不少于6位
- 修改成功后需重新登录

### 配置文件

所有配置保存在 `data/config.json` 文件中：

```json
{
  "wechat": {
    "appId": "your_app_id",
    "appSecret": "your_app_secret",
    "token": "your_token",
    "encodingAESKey": ""
  },
  "system": {
    "port": 3000,
    "downloadDir": "./downloads",
    "maxVideoSize": "100MB"
  },
  "admin": {
    "username": "admin",
    "password": "$2a$10$..."
  }
}
```

**注意**:
- 配置文件在首次启动时自动创建
- 密码经过 bcrypt 加密存储
- 不要直接编辑配置文件，请通过后台管理界面修改

## API 接口

### 健康检查

```http
GET /health
```

响应：
```json
{
  "status": "ok",
  "service": "微信视频下载服务",
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

### 查看视频列表

```http
GET /api/videos
```

响应：
```json
{
  "success": true,
  "count": 5,
  "videos": [
    {
      "filename": "video_123456_1698765432000.mp4",
      "filepath": "./downloads/video_123456_1698765432000.mp4",
      "size": 5242880,
      "sizeMB": "5.00",
      "createdAt": "2025-10-28T12:00:00.000Z"
    }
  ]
}
```

## 工作原理

### 消息处理流程

```
用户转发视频
  ↓
微信服务器推送消息到 /wechat 接口
  ↓
验证签名 → 解析XML消息
  ↓
识别消息类型（视频/小视频）
  ↓
获取MediaID → 调用微信API下载
  ↓
保存到本地 downloads/ 目录
  ↓
通过客服消息接口发送下载结果
```

### 核心组件

1. **server.js** - Express服务器，处理微信webhook
2. **messageHandler.js** - 消息路由和业务逻辑
3. **videoDownloader.js** - 视频下载和文件管理
4. **wechatAPI.js** - 微信API封装（Access Token、素材下载等）
5. **wechat.js** - 签名验证、XML解析等工具函数

## 微信API说明

### Access Token管理

系统自动管理 Access Token：
- 首次请求时获取
- 缓存在内存中
- 过期前5分钟自动刷新

### 视频下载接口

支持两种获取方式：
1. **临时素材接口**: `/cgi-bin/media/get`
2. **JSSDK接口**: `/cgi-bin/media/get/jssdk`

系统会自动尝试两种方式，确保下载成功。

## 注意事项

### 服务器要求

- 需要有公网IP或域名
- 需要配置防火墙开放服务端口
- 建议使用 HTTPS（微信要求）
- 建议使用进程管理工具（如 PM2）

### 微信限制

- 临时素材有效期为3天
- Access Token 有效期为2小时
- 客服消息有48小时限制（用户最后交互时间）
- 视频大小限制（通常不超过10MB）

### 视频号视频特殊说明

- 视频号视频可能有特殊的格式和权限
- 部分视频可能无法下载（取决于微信接口支持）
- 建议测试不同类型的视频

## 部署建议

### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/server.js --name wechat-video-service

# 查看状态
pm2 status

# 查看日志
pm2 logs wechat-video-service

# 设置开机自启
pm2 startup
pm2 save
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /wechat {
        proxy_pass http://localhost:3000/wechat;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t wechat-video-service .
docker run -d -p 3000:3000 --env-file .env wechat-video-service
```

## 故障排查

### 常见问题

1. **签名验证失败**
   - 检查 Token 配置是否正确
   - 检查服务器时间是否准确

2. **无法下载视频**
   - 检查 Access Token 是否有效
   - 检查 AppID 和 AppSecret 是否正确
   - 查看日志了解具体错误

3. **无法接收消息**
   - 检查微信后台配置是否正确
   - 检查服务器防火墙设置
   - 使用微信接口调试工具测试

### 日志查看

服务器日志会显示：
- 接收到的消息详情
- 下载进度和结果
- API调用情况
- 错误信息

## 安全建议

1. 不要将 `.env` 文件提交到 Git
2. 定期更改 Token 和密钥
3. 使用 HTTPS 保护数据传输
4. 限制下载目录的访问权限
5. 定期清理下载的视频文件

## 许可证

ISC

## 更新日志

### v1.0.0 (2025-10-28)
- 初始版本发布
- 支持视频号视频下载
- 支持消息自动回复
- 提供API接口查询

---

如有问题或建议，欢迎提交 Issue 或 Pull Request。
