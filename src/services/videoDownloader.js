const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const wechatAPI = require('./wechatAPI');

/**
 * 初始化下载目录
 */
async function initDownloadDir() {
  await fs.ensureDir(config.download.dir);
  console.log(`下载目录已创建: ${config.download.dir}`);
}

/**
 * 下载视频文件
 * @param {string} mediaId - 微信媒体ID
 * @param {string} msgId - 消息ID（用于文件命名）
 * @returns {Promise<Object>} 包含文件路径和大小的对象
 */
async function downloadVideo(mediaId, msgId) {
  try {
    console.log(`开始下载视频，MediaID: ${mediaId}`);

    // 尝试获取视频数据
    let videoBuffer;
    try {
      // 先尝试使用普通接口
      videoBuffer = await wechatAPI.getMedia(mediaId);
    } catch (error) {
      console.log('普通接口失败，尝试使用 JSSDK 接口');
      // 如果失败，尝试使用 jssdk 接口
      videoBuffer = await wechatAPI.getJssdk(mediaId);
    }

    // 生成文件名
    const timestamp = new Date().getTime();
    const filename = `video_${msgId}_${timestamp}.mp4`;
    const filepath = path.join(config.download.dir, filename);

    // 保存文件
    await fs.writeFile(filepath, videoBuffer);

    const stats = await fs.stat(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`视频下载成功: ${filepath}, 大小: ${fileSizeMB}MB`);

    return {
      success: true,
      filepath: filepath,
      filename: filename,
      size: stats.size,
      sizeMB: fileSizeMB
    };
  } catch (error) {
    console.error('下载视频失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取下载目录中的所有视频文件
 * @returns {Promise<Array>} 文件列表
 */
async function listDownloadedVideos() {
  try {
    const files = await fs.readdir(config.download.dir);
    const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.mov'));

    const fileDetails = await Promise.all(
      videoFiles.map(async (file) => {
        const filepath = path.join(config.download.dir, file);
        const stats = await fs.stat(filepath);
        return {
          filename: file,
          filepath: filepath,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime
        };
      })
    );

    return fileDetails;
  } catch (error) {
    console.error('读取下载目录失败:', error.message);
    return [];
  }
}

module.exports = {
  initDownloadDir,
  downloadVideo,
  listDownloadedVideos
};
