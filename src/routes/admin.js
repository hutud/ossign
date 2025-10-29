const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const configManager = require('../services/configManager');
const videoDownloader = require('../services/videoDownloader');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ==================== 登录相关 ====================

/**
 * 登录页面
 */
router.get('/login', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

/**
 * 登录处理
 */
router.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const adminConfig = await configManager.getAdminConfig();

    // 验证用户名
    if (username !== adminConfig.username) {
      return res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, adminConfig.password);
    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 设置 session
    req.session.isAuthenticated = true;
    req.session.username = username;

    res.json({
      success: true,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

/**
 * 退出登录
 */
router.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('退出登录错误:', err);
    }
    res.json({
      success: true,
      message: '已退出登录'
    });
  });
});

// ==================== 后台页面 ====================

/**
 * 仪表盘页面
 */
router.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

/**
 * 配置管理页面
 */
router.get('/config', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/config.html'));
});

/**
 * 视频列表页面
 */
router.get('/videos', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/videos.html'));
});

/**
 * 系统设置页面
 */
router.get('/settings', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/settings.html'));
});

// ==================== API 接口 ====================

/**
 * 获取当前配置
 */
router.get('/api/config', requireAuth, async (req, res) => {
  try {
    const config = await configManager.getConfig();
    // 不返回密码
    delete config.admin.password;
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('获取配置错误:', error);
    res.json({
      success: false,
      message: '获取配置失败'
    });
  }
});

/**
 * 更新微信配置
 */
router.post('/api/config/wechat', requireAuth, async (req, res) => {
  try {
    const { appId, appSecret, token, encodingAESKey } = req.body;

    const success = await configManager.updateWechatConfig({
      appId,
      appSecret,
      token,
      encodingAESKey
    });

    if (success) {
      res.json({
        success: true,
        message: '微信配置已更新'
      });
    } else {
      res.json({
        success: false,
        message: '更新失败'
      });
    }
  } catch (error) {
    console.error('更新微信配置错误:', error);
    res.json({
      success: false,
      message: '更新失败'
    });
  }
});

/**
 * 更新视频号配置
 */
router.post('/api/config/finder', requireAuth, async (req, res) => {
  try {
    const { enabled, parseApiUrl, apiKey, apiSecret, fallbackMethod } = req.body;

    const success = await configManager.updateFinderConfig({
      enabled,
      parseApiUrl,
      apiKey,
      apiSecret,
      fallbackMethod
    });

    if (success) {
      res.json({
        success: true,
        message: '视频号配置已更新'
      });
    } else {
      res.json({
        success: false,
        message: '更新失败'
      });
    }
  } catch (error) {
    console.error('更新视频号配置错误:', error);
    res.json({
      success: false,
      message: '更新失败'
    });
  }
});

/**
 * 更新系统配置
 */
router.post('/api/config/system', requireAuth, async (req, res) => {
  try {
    const { port, downloadDir, maxVideoSize } = req.body;

    const success = await configManager.updateSystemConfig({
      port,
      downloadDir,
      maxVideoSize
    });

    if (success) {
      res.json({
        success: true,
        message: '系统配置已更新，重启服务后生效'
      });
    } else {
      res.json({
        success: false,
        message: '更新失败'
      });
    }
  } catch (error) {
    console.error('更新系统配置错误:', error);
    res.json({
      success: false,
      message: '更新失败'
    });
  }
});

/**
 * 修改管理员密码
 */
router.post('/api/admin/password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.json({
        success: false,
        message: '旧密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.json({
        success: false,
        message: '新密码长度不能少于6位'
      });
    }

    // 验证旧密码
    const adminConfig = await configManager.getAdminConfig();
    const isOldPasswordValid = await bcrypt.compare(oldPassword, adminConfig.password);

    if (!isOldPasswordValid) {
      return res.json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const success = await configManager.updateAdminPassword(hashedPassword);

    if (success) {
      res.json({
        success: true,
        message: '密码修改成功，请重新登录'
      });

      // 销毁当前 session
      req.session.destroy();
    } else {
      res.json({
        success: false,
        message: '密码修改失败'
      });
    }
  } catch (error) {
    console.error('修改密码错误:', error);
    res.json({
      success: false,
      message: '密码修改失败'
    });
  }
});

/**
 * 获取视频列表
 */
router.get('/api/videos', requireAuth, async (req, res) => {
  try {
    const videos = await videoDownloader.listDownloadedVideos();
    res.json({
      success: true,
      count: videos.length,
      videos: videos
    });
  } catch (error) {
    console.error('获取视频列表错误:', error);
    res.json({
      success: false,
      message: '获取视频列表失败'
    });
  }
});

/**
 * 获取系统统计信息
 */
router.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const videos = await videoDownloader.listDownloadedVideos();
    const totalSize = videos.reduce((sum, video) => sum + video.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      stats: {
        totalVideos: videos.length,
        totalSize: totalSize,
        totalSizeMB: totalSizeMB,
        latestVideo: videos.length > 0 ? videos[0] : null
      }
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

module.exports = router;
