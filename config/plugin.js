'use strict';
const path = require('path')
/** @type Egg.EggPlugin */
module.exports = {
  static: {
    enable: true,
    // dir:path.join(__dirname,'../public'),
    // prefix:'/public/'
  },
  cors:{
    enable: true,
    package: 'egg-cors',
  },
  mysql:{
    enable:true,
    package:'egg-mysql'
  },
  validate:{
    enable: true,
    package: 'egg-validate',
  },
  // btqiniu:{
  //   enable:true,
  //   path:path.resolve(__dirname,'../lib/plugin/btqiniu')
  // },
  alinode:{
    enable:true,
    package:'egg-alinode'
  },
  httpProxy:{
    enable: true,
    package: '@eggjs/http-proxy',
  }
};
