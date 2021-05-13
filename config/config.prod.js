const path = require('path')
const config_path = process.env.ABTEST_PROXY_PROD_CONFIG;

// 配置分离
module.exports = require(path.resolve(__dirname,config_path))