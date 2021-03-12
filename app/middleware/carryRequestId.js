/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-09-06 16:14:14
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-03-10 15:54:13
 * @ Description:
 */
/** 使得每个请求都带上一个reqId */
module.exports = options =>{
    return async function(ctx,next){
        try {
            let reqId = Date.now() + '_' + ~~( ( 1 + Math.random() ) * 1e6 )
            ctx.reqId = Buffer.from(reqId).toString('base64');
            //ctx.userLogger.info( (ctx.session ? ctx.session.user_name : 'unkown_user_name'),`[${ctx.method}]`,ctx.path)
        } catch (error) {
            //ctx.eclogger.error(error)
        }
        await next();
        // 如果的是非输出二进制流的做合并处理
        if(Object.prototype.toString.call(ctx.body) !== '[object Uint8Array]'){
            ctx.body = {
                ...ctx.body,
                httpStatusCode:ctx.status,
                reqId:ctx.reqId,
            }
        }
    }
}