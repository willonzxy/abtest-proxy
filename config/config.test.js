/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-07-30 10:39:21
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-03-12 19:15:41
 * @ Description:
 */
const path = require('path')
module.exports = {
    mysql:{
        client: {    // 请运维填写生产环境时mysql的配置信息
            host: '10.17.2.212',
            port: '3306',
            user: 'oss',
            password: '000000',
            database: 'abtest',
        },
        app:true,
        agent:true,
    },
    security:{
        csrf:{
            enable:false,
            ignore:ctx=>ctx.url === '/upload'
        },
    },
    alinode:{
        enable:true,
        appid: '81597',
        secret: 'b258cd56a7d3958483a91b2547d78fbe87625991',
    },
    logger:{
        dir:path.resolve(__dirname,'../logs/abtest-proxy'),
        consoleLevel: 'NONE',
    },
}