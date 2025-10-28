const fs = require('fs-extra');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/config.json');
const DEFAULT_CONFIG = {
  wechat: {
    appId: '',
    appSecret: '',
    token: '',
    encodingAESKey: ''
  },
  system: {
    port: 3000,
    downloadDir: './downloads',
    maxVideoSize: '100MB'
  },
  admin: {
    // 默认密码: admin123 (已加密)
    username: 'admin',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  }
};

/**
 * 初始化配置文件
 */
async function initConfig() {
  try {
    await fs.ensureDir(path.dirname(CONFIG_FILE));

    if (!await fs.pathExists(CONFIG_FILE)) {
      await fs.writeJson(CONFIG_FILE, DEFAULT_CONFIG, { spaces: 2 });
      console.log('配置文件已创建:', CONFIG_FILE);
    }
  } catch (error) {
    console.error('初始化配置文件失败:', error);
    throw error;
  }
}

/**
 * 读取配置
 * @returns {Promise<Object>} 配置对象
 */
async function getConfig() {
  try {
    await initConfig();
    const config = await fs.readJson(CONFIG_FILE);
    return config;
  } catch (error) {
    console.error('读取配置失败:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * 更新配置
 * @param {Object} newConfig - 新配置
 * @returns {Promise<boolean>} 是否成功
 */
async function updateConfig(newConfig) {
  try {
    await initConfig();
    const currentConfig = await getConfig();
    const mergedConfig = { ...currentConfig, ...newConfig };
    await fs.writeJson(CONFIG_FILE, mergedConfig, { spaces: 2 });
    console.log('配置已更新');
    return true;
  } catch (error) {
    console.error('更新配置失败:', error);
    return false;
  }
}

/**
 * 获取微信配置
 * @returns {Promise<Object>} 微信配置
 */
async function getWechatConfig() {
  const config = await getConfig();
  return config.wechat || DEFAULT_CONFIG.wechat;
}

/**
 * 更新微信配置
 * @param {Object} wechatConfig - 微信配置
 * @returns {Promise<boolean>} 是否成功
 */
async function updateWechatConfig(wechatConfig) {
  try {
    const config = await getConfig();
    config.wechat = { ...config.wechat, ...wechatConfig };
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    console.log('微信配置已更新');
    return true;
  } catch (error) {
    console.error('更新微信配置失败:', error);
    return false;
  }
}

/**
 * 获取系统配置
 * @returns {Promise<Object>} 系统配置
 */
async function getSystemConfig() {
  const config = await getConfig();
  return config.system || DEFAULT_CONFIG.system;
}

/**
 * 更新系统配置
 * @param {Object} systemConfig - 系统配置
 * @returns {Promise<boolean>} 是否成功
 */
async function updateSystemConfig(systemConfig) {
  try {
    const config = await getConfig();
    config.system = { ...config.system, ...systemConfig };
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    console.log('系统配置已更新');
    return true;
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return false;
  }
}

/**
 * 获取管理员配置
 * @returns {Promise<Object>} 管理员配置
 */
async function getAdminConfig() {
  const config = await getConfig();
  return config.admin || DEFAULT_CONFIG.admin;
}

/**
 * 更新管理员密码
 * @param {string} hashedPassword - 加密后的密码
 * @returns {Promise<boolean>} 是否成功
 */
async function updateAdminPassword(hashedPassword) {
  try {
    const config = await getConfig();
    config.admin.password = hashedPassword;
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    console.log('管理员密码已更新');
    return true;
  } catch (error) {
    console.error('更新管理员密码失败:', error);
    return false;
  }
}

module.exports = {
  initConfig,
  getConfig,
  updateConfig,
  getWechatConfig,
  updateWechatConfig,
  getSystemConfig,
  updateSystemConfig,
  getAdminConfig,
  updateAdminPassword
};
