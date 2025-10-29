const axios = require('axios');

/**
 * 解析视频号消息中的 objectId 和 objectNonceId
 * @param {Object} message - 微信消息对象
 * @returns {Object|null} 包含 objectId 和 objectNonceId 的对象，如果不是视频号消息则返回 null
 */
function parseFinderFeedMessage(message) {
  try {
    // 检查是否包含 finderFeed 信息
    // 视频号消息可能在 link 类型中，或者作为独立字段
    let finderFeed = null;

    // 方式1: 直接在消息中查找 finderFeed 字段
    if (message.finderFeed) {
      finderFeed = message.finderFeed;
    }

    // 方式2: 在 Content 或其他字段中查找
    if (!finderFeed && message.Content) {
      // 尝试从 Content 中解析（某些情况下可能是JSON字符串）
      try {
        const contentObj = JSON.parse(message.Content);
        if (contentObj.finderFeed) {
          finderFeed = contentObj.finderFeed;
        }
      } catch (e) {
        // Content 不是JSON，继续其他方式
      }
    }

    if (!finderFeed) {
      return null;
    }

    // 提取 objectId 和 objectNonceId
    const objectId = finderFeed.objectId || finderFeed.objectid;
    const objectNonceId = finderFeed.objectNonceId || finderFeed.objectNonceid;

    if (!objectId) {
      console.log('未找到 objectId');
      return null;
    }

    return {
      objectId: objectId,
      objectNonceId: objectNonceId || '',
      nickname: finderFeed.nickname || '',
      desc: finderFeed.desc || '',
      feedType: finderFeed.feedType || finderFeed.feedtype || ''
    };
  } catch (error) {
    console.error('解析视频号消息失败:', error);
    return null;
  }
}

/**
 * 通过多种方式解析视频号视频地址
 * @param {string} objectId - 视频对象ID
 * @param {string} objectNonceId - 视频Nonce ID
 * @returns {Promise<Object>} 包含视频信息的对象
 */
async function parseFinderVideoUrl(objectId, objectNonceId) {
  console.log(`开始解析视频号视频: objectId=${objectId}, objectNonceId=${objectNonceId}`);

  // 方法1: 使用第三方解析API（示例）
  try {
    const response = await axios.post(
      'https://video-api.dddming.com/api/process',
      {
        objectId: objectId,
        objectNonceId: objectNonceId
      },
      {
        timeout: 15000,
        validateStatus: false
      }
    );

    if (response.data && response.data.videoUrl) {
      return {
        success: true,
        videoUrl: response.data.videoUrl,
        title: response.data.title || '',
        coverUrl: response.data.coverUrl || '',
        method: 'api-1'
      };
    }
  } catch (error) {
    console.log('API-1 解析失败:', error.message);
  }

  // 方法2: 尝试备用API
  try {
    const response = await axios.post(
      'http://localhost:30001/GetFinderNewURL',
      {
        objectId: objectId,
        objectNonceId: objectNonceId
      },
      {
        timeout: 15000,
        validateStatus: false
      }
    );

    if (response.data && response.data.url) {
      return {
        success: true,
        videoUrl: response.data.url,
        method: 'api-2'
      };
    }
  } catch (error) {
    console.log('API-2 解析失败:', error.message);
  }

  // 方法3: 构造微信视频号直接访问链接（可能需要进一步处理）
  // 注意：这种方式可能返回的不是直接的视频文件，而是播放页面
  const finderUrl = `https://channels.weixin.qq.com/video/${objectId}`;

  return {
    success: false,
    videoUrl: null,
    finderUrl: finderUrl,
    message: '无法直接获取视频下载地址，需要使用专用工具',
    objectId: objectId,
    objectNonceId: objectNonceId
  };
}

/**
 * 从URL下载视频文件
 * @param {string} videoUrl - 视频URL
 * @param {string} filename - 保存的文件名
 * @returns {Promise<Buffer>} 视频文件Buffer
 */
async function downloadVideoFromUrl(videoUrl, filename) {
  console.log(`开始从URL下载视频: ${videoUrl}`);

  try {
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://channels.weixin.qq.com/'
      }
    });

    return response.data;
  } catch (error) {
    console.error('从URL下载视频失败:', error.message);
    throw error;
  }
}

/**
 * 检测消息是否为视频号消息
 * @param {Object} message - 微信消息对象
 * @returns {boolean}
 */
function isFinderFeedMessage(message) {
  // 检查是否包含 finderFeed 字段
  if (message.finderFeed) {
    return true;
  }

  // 检查链接消息中是否包含视频号特征
  if (message.MsgType === 'link') {
    const url = message.Url || '';
    const title = message.Title || '';
    const desc = message.Description || '';

    // 检查URL是否为视频号链接
    if (url.includes('channels.weixin.qq.com') || url.includes('finder')) {
      return true;
    }

    // 检查描述中是否包含视频号关键词
    if (title.includes('视频号') || desc.includes('视频号')) {
      return true;
    }
  }

  return false;
}

/**
 * 从链接消息中提取视频号信息
 * @param {Object} message - 链接类型的微信消息
 * @returns {Object|null} 视频号信息
 */
function extractFinderInfoFromLink(message) {
  try {
    const url = message.Url || '';

    // 尝试从URL中提取ID
    // 示例: https://channels.weixin.qq.com/video/xxx
    const videoIdMatch = url.match(/channels\.weixin\.qq\.com\/video\/([^/?]+)/);
    if (videoIdMatch) {
      return {
        objectId: videoIdMatch[1],
        objectNonceId: '',
        nickname: message.Title || '',
        desc: message.Description || '',
        url: url
      };
    }

    // 尝试从URL参数中提取
    const urlObj = new URL(url);
    const feedId = urlObj.searchParams.get('feedId') || urlObj.searchParams.get('feed_id');
    const finderUsername = urlObj.searchParams.get('finderUsername') || urlObj.searchParams.get('finder_username');

    if (feedId || finderUsername) {
      return {
        objectId: feedId || finderUsername,
        objectNonceId: '',
        nickname: message.Title || '',
        desc: message.Description || '',
        url: url
      };
    }

    return null;
  } catch (error) {
    console.error('从链接中提取视频号信息失败:', error);
    return null;
  }
}

module.exports = {
  parseFinderFeedMessage,
  parseFinderVideoUrl,
  downloadVideoFromUrl,
  isFinderFeedMessage,
  extractFinderInfoFromLink
};
