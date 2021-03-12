const BaseController = require('./base.js');
class LayerController extends BaseController {
    constructor(ctx) {
        super(ctx)
    }
    async index() {
        const { ctx } = this;
        let id = ctx.params.id;
        if(!id){
            return ctx.body = ctx.helper.url_leak_id
        }
        let [ app_id,layer_id,hash ] = id.split('_');
        // 检验url是否合法
        if(!this.checkLayerUrlHash(app_id,layer_id,hash)){
            return ctx.body = ctx.config.error_verbose.url_invaild
        }
        // 获取uid
        let uid = this.getUid();
        if(!uid){
            return ctx.body = ctx.config.error_verbose.leak_uid
        }
        // 校验uid是否存在
        let config = this.getConfigByAppId(app_id);
        // 分流
        
        // api
        
    }
}

module.exports = LayerController;