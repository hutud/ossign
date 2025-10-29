const wechatAPI = require('./wechatAPI');
const videoDownloader = require('./videoDownloader');
const wechatUtils = require('../utils/wechat');
const finderVideoService = require('./finderVideoService');

/**
 * 处理接收到的微信消息
 * @param {Object} message - 解析后的消息对象
 * @returns {Promise<string>} 回复的XML消息
 */
async function handleMessage(message) {
  const { ToUserName, FromUserName, MsgType, MsgId } = message;

  console.log('收到消息:', {
    type: MsgType,
    from: FromUserName,
    msgId: MsgId
  });

  let replyContent = '';

  try {
    switch (MsgType) {
      case 'text':
        // 处理文本消息
        replyContent = await handleTextMessage(message);
        break;

      case 'video':
        // 处理视频消息
        replyContent = await handleVideoMessage(message);
        break;

      case 'shortvideo':
        // 处理小视频消息
        replyContent = await handleShortVideoMessage(message);
        break;

      case 'link':
        // 处理链接消息（可能是视频号链接）
        replyContent = await handleLinkMessage(message);
        break;

      case 'event':
        // 处理事件消息
        replyContent = await handleEventMessage(message);
        break;

      default:
        // 检查是否为视频号消息
        if (finderVideoService.isFinderFeedMessage(message)) {
          replyContent = await handleFinderFeedMessage(message);
        } else {
          replyContent = `收到了 ${MsgType} 类型的消息，暂不支持处理`;
        }
    }
  } catch (error) {
    console.error('处理消息出错:', error);
    replyContent = '处理消息时出错，请稍后重试';
  }

  // 构建回复消息
  const replyMessage = wechatUtils.createTextMessage(
    FromUserName,
    ToUserName,
    replyContent
  );

  return wechatUtils.buildXML(replyMessage);
}

/**
 * 处理文本消息
 * @param {Object} message - 消息对象
 * @returns {Promise<string>} 回复内容
 */
async function handleTextMessage(message) {
  const content = message.Content.trim();

  if (content === '帮助' || content === 'help') {
    return `欢迎使用视频下载服务！\n\n使用方法：\n1. 从视频号转发视频到此公众号\n2. 系统会自动下载视频\n3. 下载完成后会回复下载结果\n\n命令：\n- 输入"帮助"或"help"查看此帮助\n- 输入"列表"查看已下载的视频`;
  }

  if (content === '列表' || content === 'list') {
    const videos = await videoDownloader.listDownloadedVideos();
    if (videos.length === 0) {
      return '暂无已下载的视频';
    }

    let reply = `已下载视频列表（共${videos.length}个）：\n\n`;
    videos.slice(0, 10).forEach((video, index) => {
      reply += `${index + 1}. ${video.filename}\n大小: ${video.sizeMB}MB\n时间: ${video.createdAt.toLocaleString('zh-CN')}\n\n`;
    });

    if (videos.length > 10) {
      reply += `...还有${videos.length - 10}个视频`;
    }

    return reply;
  }

  return `收到您的消息：${content}\n\n请转发视频号视频到此公众号，系统会自动下载。\n输入"帮助"查看使用说明。`;
}

/**
 * 处理视频消息
 * @param {Object} message - 消息对象
 * @returns {Promise<string>} 回复内容
 */
async function handleVideoMessage(message) {
  const { MediaId, MsgId, FromUserName } = message;

  console.log('处理视频消息:', { MediaId, MsgId });

  // 立即回复用户，开始下载
  const processingReply = '收到视频，正在下载中，请稍候...';

  // 异步下载视频，不阻塞响应
  downloadVideoAsync(MediaId, MsgId, FromUserName);

  return processingReply;
}

/**
 * 处理小视频消息
 * @param {Object} message - 消息对象
 * @returns {Promise<string>} 回复内容
 */
async function handleShortVideoMessage(message) {
  const { MediaId, MsgId, FromUserName } = message;

  console.log('处理小视频消息:', { MediaId, MsgId });

  // 立即回复用户
  const processingReply = '收到小视频，正在下载中，请稍候...';

  // 异步下载视频
  downloadVideoAsync(MediaId, MsgId, FromUserName);

  return processingReply;
}

/**
 * 异步下载视频并发送结果消息
 * @param {string} mediaId - 媒体ID
 * @param {string} msgId - 消息ID
 * @param {string} openId - 用户openid
 */
async function downloadVideoAsync(mediaId, msgId, openId) {
  try {
    // 下载视频
    const result = await videoDownloader.downloadVideo(mediaId, msgId);

    let message;
    if (result.success) {
      message = `✅ 视频下载成功！\n\n文件名: ${result.filename}\n文件大小: ${result.sizeMB}MB\n保存路径: ${result.filepath}`;
    } else {
      message = `❌ 视频下载失败\n\n错误信息: ${result.error}`;
    }

    // 使用客服消息接口发送结果（因为已经超过5秒响应时间）
    await wechatAPI.sendCustomMessage(openId, message);
  } catch (error) {
    console.error('异步下载视频失败:', error);
    try {
      await wechatAPI.sendCustomMessage(
        openId,
        `❌ 视频下载失败\n\n错误信息: ${error.message}`
      );
    } catch (sendError) {
      console.error('发送错误消息失败:', sendError);
    }
  }
}

/**
 * 处理链接消息（可能是视频号链接）
 * @param {Object} message - 消息对象
 * @returns {Promise<string>} 回复内容
 */
async function handleLinkMessage(message) {
  const { FromUserName, MsgId, Title, Description, Url } = message;

  console.log('处理链接消息:', { Title, Url });

  // 检查是否为视频号链接
  if (finderVideoService.isFinderFeedMessage(message)) {
    return await handleFinderFeedMessage(message);
  }

  // 普通链接消息
  return `收到链接消息：${Title}\n\n暂不支持处理此类型链接。\n如需下载视频号视频，请直接转发视频号视频到此公众号。`;
}

/**
 * 处理视频号消息
 * @param {Object} message - 消息对象
 * @returns {Promise<string>} 回复内容
 */
async function handleFinderFeedMessage(message) {
  const { FromUserName, MsgId } = message;

  console.log('处理视频号消息:', message);

  // 尝试解析视频号信息
  let finderInfo = finderVideoService.parseFinderFeedMessage(message);

  // 如果从 finderFeed 字段解析失败，尝试从链接中提取
  if (!finderInfo && message.MsgType === 'link') {
    finderInfo = finderVideoService.extractFinderInfoFromLink(message);
  }

  if (!finderInfo || !finderInfo.objectId) {
    return '无法识别视频号视频信息，请重新转发。\n\n提示：请在视频号中点击"分享"，然后选择"发送给朋友"，选择此公众号。';
  }

  console.log('解析到视频号信息:', finderInfo);

  // 立即回复用户
  const processingReply = `收到视频号视频，正在下载中...\n\n视频标题: ${finderInfo.nickname || finderInfo.desc || '未知'}\n请稍候...`;

  // 异步下载视频号视频
  downloadFinderVideoAsync(finderInfo, MsgId, FromUserName);

  return processingReply;
}

/**
 * 异步下载视频号视频并发送结果消息
 * @param {Object} finderInfo - 视频号信息
 * @param {string} msgId - 消息ID
 * @param {string} openId - 用户openid
 */
async function downloadFinderVideoAsync(finderInfo, msgId, openId) {
  try {
    const { objectId, objectNonceId } = finderInfo;

    console.log(`开始异步下载视频号视频: objectId=${objectId}`);

    // 下载视频号视频
    const result = await videoDownloader.downloadFinderVideo(objectId, objectNonceId, msgId);

    let message;
    if (result.success) {
      message = `✅ 视频号视频下载成功！\n\n${result.title ? `标题: ${result.title}\n` : ''}文件名: ${result.filename}\n文件大小: ${result.sizeMB}MB\n保存路径: ${result.filepath}`;
    } else {
      // 下载失败，提供替代方案
      if (result.finderUrl) {
        message = `⚠️ 视频号视频暂时无法自动下载\n\n原因: ${result.message || result.error}\n\n🔗 视频号链接:\n${result.finderUrl}\n\n💡 建议:\n1. 可以在电脑上打开此链接\n2. 使用专业的视频号下载工具\n3. 或联系管理员配置解析服务`;
      } else {
        message = `❌ 视频号视频下载失败\n\n错误信息: ${result.error || result.message}`;
      }
    }

    // 使用客服消息接口发送结果
    await wechatAPI.sendCustomMessage(openId, message);
  } catch (error) {
    console.error('异步下载视频号视频失败:', error);
    try {
      await wechatAPI.sendCustomMessage(
        openId,
        `❌ 视频号视频下载失败\n\n错误信息: ${error.message}\n\n请稍后重试或联系管理员。`
      );
    } catch (sendError) {
      console.error('发送错误消息失败:', sendError);
    }
  }
}

/**
 * 处理事件消息
 * @param {Object} message - 消息对象
 * @returns {Promise<string>} 回复内容
 */
async function handleEventMessage(message) {
  const { Event } = message;

  if (Event === 'subscribe') {
    return `欢迎关注视频下载服务！\n\n🎬 功能说明：\n从视频号转发视频到此公众号，系统会自动为您下载视频。\n\n支持：\n✅ 普通视频（直接发送）\n✅ 视频号视频（转发）\n\n输入"帮助"查看详细使用说明。`;
  }

  if (Event === 'unsubscribe') {
    console.log('用户取消关注:', message.FromUserName);
    return '';
  }

  return '感谢您的关注！';
}

module.exports = {
  handleMessage
};
