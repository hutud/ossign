require('dotenv').config();

module.exports = {
  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
    token: process.env.WECHAT_TOKEN,
    encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY
  },

  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // 下载配置
  download: {
    dir: process.env.DOWNLOAD_DIR || './downloads',
    maxSize: process.env.MAX_VIDEO_SIZE || '100MB'
  }
};
