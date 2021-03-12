const path = require('path')
const config_path = process.env.ECLANDING_SERVER_PROD_CONFIG;

// 配置分离
module.exports = require(path.resolve(config_path))