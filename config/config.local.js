/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-07-30 10:39:21
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-05-08 10:41:25
 * @ Description:
 */
const path = require('path');
module.exports = {
    mysql:{
        client: {
            host: 'localhost',
            port: '3306',
            user: 'root',
            password: 'root',
            database: 'abtest',
        },
        app:true, 
        agent:true, // 实例挂载到agent进程上
    },
    redis:{
        client:{
            port:6379,
            host:'localhost',
            password:'',
            db:0
        }
    },
    cors:{
        credentials: true, // 允许跨域请求携带cookies
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
    },
    alinode:{
        enable:false,
        appid: '81594',
        secret: 'e28f335f57f6e1f2e4df527d3c798d337ab94296',
    },
    // acl:{
    //     enable:true,
    // },
    logger:{
        dir:path.resolve(__dirname,'../logs/abtest-server'),
        consoleLevel: 'WARN',
    }
}