module.exports = function requestLogger(req, res, next) {
  try {
    const bodyPreview = req.body && Object.keys(req.body).length ? JSON.stringify(req.body).slice(0, 500) : '';
    const authFlag = req.headers.authorization ? 'Authorization present' : 'no-auth';
    console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ${authFlag} ${bodyPreview}`);
  } catch (e) {
  }
  next();
};
