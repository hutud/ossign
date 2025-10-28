const express = require('express');
const config = require('./config');
const wechatUtils = require('./utils/wechat');
const messageHandler = require('./services/messageHandler');
const videoDownloader = require('./services/videoDownloader');

const app = express();

// 解析 XML 请求体
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
app.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  console.log('收到微信验证请求:', { signature, timestamp, nonce });

  // 验证签名
  if (wechatUtils.verifySignature(config.wechat.token, timestamp, nonce, signature)) {
    console.log('签名验证成功');
    res.send(echostr);
  } else {
    console.log('签名验证失败');
    res.status(403).send('签名验证失败');
  }
});

/**
 * 微信消息接收接口（POST）
 * 用于接收用户发送的消息
 */
app.post('/wechat', async (req, res) => {
  const { signature, timestamp, nonce } = req.query;

  // 验证签名
  if (!wechatUtils.verifySignature(config.wechat.token, timestamp, nonce, signature)) {
    console.log('签名验证失败');
    return res.status(403).send('签名验证失败');
  }

  try {
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
    // 初始化下载目录
    await videoDownloader.initDownloadDir();

    // 验证配置
    if (!config.wechat.appId || !config.wechat.appSecret || !config.wechat.token) {
      console.error('错误: 请配置微信相关环境变量');
      console.error('请复制 .env.example 为 .env 并填写配置信息');
      process.exit(1);
    }

    // 启动服务器
    app.listen(config.server.port, () => {
      console.log('=================================');
      console.log('🚀 微信视频下载服务已启动');
      console.log(`📡 服务地址: http://localhost:${config.server.port}`);
      console.log(`🔧 环境: ${config.server.env}`);
      console.log(`📁 下载目录: ${config.download.dir}`);
      console.log('=================================');
      console.log('\n微信服务器配置URL:');
      console.log(`http://your-domain.com:${config.server.port}/wechat`);
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
