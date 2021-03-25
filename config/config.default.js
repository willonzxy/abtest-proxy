/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path')
const verbose = require('./verbose.js')
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  // abtest-server的key一致
  config.keys = appInfo.name + '_1615358289384_1479_abtest';
  // add your middleware config here
  config.middleware = [];
  // add your user config here
  const userConfig = {
    // 提示语
    VERBOSE:verbose,
    // 分流桶的数量
    BUCKET_NUM:10000,
    ABTEST_UID_COOKIE_NAME:'baioo-abtest-uid',
    ABTEST_TRACE_ID_COOKIE_NAME:'baioo-abtest-trace-id',
    // 3天
    ABTEST_COOKIE_ALIVE_TIME:1000 * 60 * 60 * 24 * 3,
    acl:{
      match(ctx){
        if(/^\/(layer|app)\//.test(ctx.path)){
          return true
        }
      }
    },
    autoUpdateDate:{
      match(ctx){
        if(ctx.method === 'POST' || ctx.method === 'PUT'){
          return true
        }
      }
    },
    customLogger: {
      abtestLogger : {
        file: `${appInfo.name}-web.log`,
        // ctx logger 函数名有讲究 注意
        contextFormatter(meta) {
          return `[${meta.date} ${meta.level}]\n[${meta.ctx.helper.getLocalIP()} ${meta.ctx.reqId} ]\n[${meta.ctx.ip} ${meta.ctx.method} ${meta.ctx.url} ]\n[${JSON.stringify(meta.ctx.request.header,null,'\t')}]\n${meta.message}\n`;
        },
      },
      scheduleLogger : {
        file: `${appInfo.name}-clear-job-schedule.log`,
        contextFormatter(meta) {
          return `[${meta.date} ${meta.level}]\n[${meta.ctx.helper.getLocalIP()}]\n${meta.message}\n`;
        },
      },
      // 记录用户触发的api ，目前在中间件carryRequestId 与 用户登录成功时打点
      userLogger:{
        file: `${appInfo.name}-user-operation.log`,
        contextFormatter(meta) {
          return `[${meta.date} ${meta.level}]\n[${meta.ctx.helper.getLocalIP()}]\n${meta.message}\n`;
        },
      },
    },
    multipart:{
      fileExtensions:['.ico','.wav'], // 为让egg支持更多上传文件后缀名
    },
    session:{
      key: 'ECLANDING_EGG_SESS',
      maxAge: 12 * 3600 * 1000, // 半天
      httpOnly: true,
      encrypt: true,
    },
    bodyParser:{
      jsonLimit:'10mb',
    },
    io:{
      init: { }, // passed to engine.io
      namespace: {
        '/': {
          connectionMiddleware: ['connection'],
        }
      },
    }
  };

  return {
    ...config,
    ...userConfig,
  };
};
