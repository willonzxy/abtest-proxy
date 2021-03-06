const BaseController = require('./base.js');
const { v4: uuidv4 } = require('uuid');
class AppController extends BaseController {
    constructor(ctx) {
        super(ctx)
    }
    /**
     * 1 判断请求是否合法
     * 2 判断当前进程是否存在当前appid缓存
     * 3 没有就去拉配置
     * 4 还是没有就返回400
     * 5 
     */
    async index() {
        const { ctx , app } = this;
        const app_id = ctx.params.id;
        const layer_id = ctx.query.layer_id;
        if(!this.verifyUrl()){
            return ctx.body = app.config.VERBOSE.ERROR_TOAST.URL_INVALID
        }
        let uid = this.getUid();
        if(!uid){
            uid = uuidv4();
        }
        let config = await this.getConfigByAppId(app_id);
        if(!config || config.length === 0){
            delete app.shunt_model[app_id];
            return ctx.body = app.config.VERBOSE.ERROR_TOAST.LEAK_CONFIG
        }
        // 从实验数据中整理出分流模型
        let shunt_model = this.shuntModelMapping(app_id,config);
        // 生成hash因子，获取分流信息
        let hash_id = `${uid}_${decodeURIComponent(ctx.request.protocol + '://' + ctx.request.host + ctx.request.path)}`
        let hit_info  = this.getHitInfo(app_id,layer_id,shunt_model,hash_id,uid);
        // set uid trace_idin cookie
        this.setCookies(app_id,uid,hit_info.trace_id);
        // 根据query string 来动态响应内容
        await this.dynamicResponse(hit_info);
    }
}

module.exports = AppController;