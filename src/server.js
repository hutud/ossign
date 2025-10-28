const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const wechatUtils = require('./utils/wechat');
const messageHandler = require('./services/messageHandler');
const videoDownloader = require('./services/videoDownloader');
const configManager = require('./services/configManager');
const adminRouter = require('./routes/admin');

const app = express();

// 中间件配置
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session 配置
app.use(session({
  secret: 'wechat-video-download-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 静态文件服务
app.use('/admin/static', express.static(path.join(__dirname, '../public/static')));

// 后台管理路由
app.use('/admin', adminRouter);

// 解析 XML 请求体（用于微信消息）
app.use(express.text({ type: 'text/xml' }));
app.use(express.text({ type: 'application/xml' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '微信视频下载服务',
    timestamp: new Date().toISOString()
  });
});

/**
 * 微信服务器验证接口（GET）
 * 用于微信服务器验证URL的有效性
 */
app.get('/wechat', async (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  console.log('收到微信验证请求:', { signature, timestamp, nonce });

  try {
    // 从配置文件读取 token
    const wechatConfig = await configManager.getWechatConfig();

    if (!wechatConfig.token) {
      console.log('Token未配置');
      return res.status(500).send('Token未配置，请先在后台管理系统配置');
    }

    // 验证签名
    if (wechatUtils.verifySignature(wechatConfig.token, timestamp, nonce, signature)) {
      console.log('签名验证成功');
      res.send(echostr);
    } else {
      console.log('签名验证失败');
      res.status(403).send('签名验证失败');
    }
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).send('服务器错误');
  }
});

/**
 * 微信消息接收接口（POST）
 * 用于接收用户发送的消息
 */
app.post('/wechat', async (req, res) => {
  const { signature, timestamp, nonce } = req.query;

  try {
    // 从配置文件读取 token
    const wechatConfig = await configManager.getWechatConfig();

    if (!wechatConfig.token) {
      console.log('Token未配置');
      return res.status(500).send('Token未配置');
    }

    // 验证签名
    if (!wechatUtils.verifySignature(wechatConfig.token, timestamp, nonce, signature)) {
      console.log('签名验证失败');
      return res.status(403).send('签名验证失败');
    }

    // 解析 XML 消息
    const xmlData = req.body;
    const message = await wechatUtils.parseXML(xmlData);

    console.log('收到微信消息:', JSON.stringify(message, null, 2));

    // 处理消息并获取回复
    const replyXml = await messageHandler.handleMessage(message);

    // 返回 XML 响应
    res.type('application/xml');
    res.send(replyXml);
  } catch (error) {
    console.error('处理消息出错:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * 查看已下载的视频列表（API接口）
 */
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await videoDownloader.listDownloadedVideos();
    res.json({
      success: true,
      count: videos.length,
      videos: videos
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 初始化配置文件
    await configManager.initConfig();

    // 初始化下载目录
    await videoDownloader.initDownloadDir();

    // 获取系统配置
    const systemConfig = await configManager.getSystemConfig();
    const wechatConfig = await configManager.getWechatConfig();
    const port = systemConfig.port || config.server.port;

    // 启动服务器
    app.listen(port, () => {
      console.log('=================================');
      console.log('🚀 微信视频下载服务已启动');
      console.log(`📡 服务地址: http://localhost:${port}`);
      console.log(`🔧 环境: ${config.server.env}`);
      console.log(`📁 下载目录: ${systemConfig.downloadDir || config.download.dir}`);
      console.log('=================================');
      console.log('\n📱 后台管理:');
      console.log(`   访问地址: http://localhost:${port}/admin/login`);
      console.log('   默认账号: admin');
      console.log('   默认密码: admin123');
      console.log('\n📡 微信服务器配置URL:');
      console.log(`   http://your-domain.com:${port}/wechat`);

      if (!wechatConfig.appId || !wechatConfig.appSecret || !wechatConfig.token) {
        console.log('\n⚠️  警告: 微信配置未完成');
        console.log('   请登录后台管理系统完成配置');
      }

      console.log('\n等待接收消息...\n');
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});
