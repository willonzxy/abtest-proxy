const Controller = require('egg').Controller;
const md5 = require('md5');
class BaseController extends Controller{
    constructor(ctx){
        super(ctx)
        this.service_name = 'base'
    }
    /**
     * 
     * @param {Number} app_id 
     * @param {Number} layer_id 
     * @param {String} salt 
     * return Boolean
     */
    checkLayerUrlHash(app_id,layer_id,hash){
        if(!app_id || !layer_id || !hash){
            return false
        }
        let result = md5(app_id + layer_id + salt).substr(0,4);
        return result === hash
    }
    checkAppUrlHash(app_id,hash){
        if(!app_id || !hash){
            return false
        }
        let result = md5(app_id + salt).substr(0,4);
        return result === hash
    }
    /**
     * 先从url上获取uid,
     * 再从cookie上获取uid
     */
    getUid(type){
        const { ctx } = this;
        let uid = ctx.query.uid || ctx.cookies.get('x-abtest-uid');
        // web类型的应用场景
        // if(uid || type === ctx.config.DEV_TYPE.WEB){

        // }
        return uid
    }
    getConfigByAppId(app_id){
        let ctx = this;
        let app = ctx.app;
        let config = await ctx.service[this.service_name].getConfigByAppId(app_id);
        return config;
    }
    getConfigByLayerId(layer_id){
        let ctx = this;
        let app = ctx.app;
        let config = await ctx.service[this.service_name].getConfigByLayerId(layer_id);
        return config;
    }
}

module.exports = BaseController;