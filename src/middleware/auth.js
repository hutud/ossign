/**
 * 认证中间件 - 验证用户是否已登录
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }

  // 如果是 API 请求，返回 JSON
  if (req.path.startsWith('/admin/api/')) {
    return res.status(401).json({
      success: false,
      message: '未登录或登录已过期'
    });
  }

  // 否则重定向到登录页
  res.redirect('/admin/login');
}

/**
 * 检查登录状态中间件
 */
function checkAuth(req, res, next) {
  res.locals.isAuthenticated = req.session && req.session.isAuthenticated;
  next();
}

module.exports = {
  requireAuth,
  checkAuth
};
