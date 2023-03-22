// eslint-disable-next-line import/no-extraneous-dependencies
const { createProxyMiddleware } = require('http-proxy-middleware');

const base_url = "localhost:3001" //"https://notekemper99.db.in.tum.de";

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: base_url,
      changeOrigin: true,
    }),
  );
};
