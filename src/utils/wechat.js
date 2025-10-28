const crypto = require('crypto');
const xml2js = require('xml2js');

/**
 * 微信签名验证
 * @param {string} token - 微信配置的token
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机数
 * @param {string} signature - 微信签名
 * @returns {boolean} 验证是否通过
 */
function verifySignature(token, timestamp, nonce, signature) {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  return sha1.digest('hex') === signature;
}

/**
 * 解析微信XML消息
 * @param {string} xml - XML字符串
 * @returns {Promise<Object>} 解析后的对象
 */
async function parseXML(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.xml);
      }
    });
  });
}

/**
 * 构建微信XML响应
 * @param {Object} message - 消息对象
 * @returns {string} XML字符串
 */
function buildXML(message) {
  const builder = new xml2js.Builder({
    rootName: 'xml',
    cdata: true,
    headless: true
  });
  return builder.buildObject(message);
}

/**
 * 创建文本回复消息
 * @param {string} toUser - 接收用户openid
 * @param {string} fromUser - 公众号ID
 * @param {string} content - 消息内容
 * @returns {Object} 消息对象
 */
function createTextMessage(toUser, fromUser, content) {
  return {
    ToUserName: toUser,
    FromUserName: fromUser,
    CreateTime: Math.floor(Date.now() / 1000),
    MsgType: 'text',
    Content: content
  };
}

module.exports = {
  verifySignature,
  parseXML,
  buildXML,
  createTextMessage
};
