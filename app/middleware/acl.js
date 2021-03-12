module.exports = options =>{
    return async function(ctx,next){
        try {
            if(!ctx.session.is_login){
                return ctx.body = { code : 2 , msg : '禁止访问' }
            }
            await next()
        } catch (error) {
            //ctx.eclogger.error(error)
            ctx.body = { code : -500 , msg : error.message }
        }
    }
}
