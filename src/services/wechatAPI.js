const axios = require('axios');
const configManager = require('./configManager');

// Access Token 缓存
let accessToken = null;
let tokenExpireTime = 0;

/**
 * 获取微信 Access Token
 * @returns {Promise<string>} Access Token
 */
async function getAccessToken() {
  // 如果token还没过期，直接返回缓存的token
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken;
  }

  try {
    // 从配置文件读取微信配置
    const wechatConfig = await configManager.getWechatConfig();

    if (!wechatConfig.appId || !wechatConfig.appSecret) {
      throw new Error('微信配置未完成，请先在后台管理系统配置 AppID 和 AppSecret');
    }

    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: wechatConfig.appId,
        secret: wechatConfig.appSecret
      }
    });

    if (response.data.access_token) {
      accessToken = response.data.access_token;
      // 提前5分钟过期，避免边界情况
      tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
      console.log('Access Token 获取成功');
      return accessToken;
    } else {
      throw new Error('获取 Access Token 失败: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('获取 Access Token 错误:', error.message);
    throw error;
  }
}

/**
 * 获取临时素材（视频）
 * @param {string} mediaId - 媒体ID
 * @returns {Promise<Buffer>} 视频文件Buffer
 */
async function getMedia(mediaId) {
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/media/get', {
      params: {
        access_token: token,
        media_id: mediaId
      },
      responseType: 'arraybuffer'
    });

    return response.data;
  } catch (error) {
    console.error('获取媒体文件错误:', error.message);
    throw error;
  }
}

/**
 * 获取高清语音素材（用于视频号视频）
 * @param {string} mediaId - 媒体ID
 * @returns {Promise<Buffer>} 视频文件Buffer
 */
async function getJssdk(mediaId) {
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/media/get/jssdk', {
      params: {
        access_token: token,
        media_id: mediaId
      },
      responseType: 'arraybuffer'
    });

    return response.data;
  } catch (error) {
    console.error('获取JSSDK媒体文件错误:', error.message);
    throw error;
  }
}

/**
 * 发送客服消息
 * @param {string} openId - 用户openid
 * @param {string} content - 消息内容
 */
async function sendCustomMessage(openId, content) {
  try {
    const token = await getAccessToken();
    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`,
      {
        touser: openId,
        msgtype: 'text',
        text: {
          content: content
        }
      }
    );

    if (response.data.errcode === 0) {
      console.log('客服消息发送成功');
    } else {
      console.error('客服消息发送失败:', response.data);
    }

    return response.data;
  } catch (error) {
    console.error('发送客服消息错误:', error.message);
    throw error;
  }
}

module.exports = {
  getAccessToken,
  getMedia,
  getJssdk,
  sendCustomMessage
};
