const Controller = require('egg').Controller;
const md5 = require('md5');
const URL = require('url');
class BaseController extends Controller {
    constructor(ctx) {
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
    // checkLayerUrlHash(app_id, layer_id, hash) {
    //     if (!app_id || !layer_id || !hash) {
    //         return false
    //     }
    //     let result = md5(app_id + layer_id + salt).substr(0, 4);
    //     return result === hash
    // }
    // checkAppUrlHash(app_id, hash) {
    //     if (!app_id || !hash) {
    //         return false
    //     }
    //     let result = md5(app_id + salt).substr(0, 4);
    //     return result === hash
    // }
    verifyUrl(){
        const { ctx , app } = this;
        let app_id = ctx.params.id;
        let sign = ctx.query.sign;
        return (!sign || sign !== md5(app_id + app.config.keys)) ? false : true;
    }
    /**
     * 先从url上获取uid,
     * 再从cookie上获取uid
     */
    getUid() {
        const {
            ctx,
            app
        } = this;
        let uid = ctx.query.uid || ctx.cookies.get(app.config.ABTEST_UID_COOKIE_NAME);
        // web类型的应用场景
        // if(uid || type === ctx.config.DEV_TYPE.WEB){

        // }
        return uid
    }
    async getConfigByAppId(app_id) {
        return await this.ctx.service[this.service_name].getConfigByAppId(app_id);
    }
    shuntModelMapping(app_id, config) {
        return this.ctx.service[this.service_name].shuntModelMapping(app_id, config);
    }
    getHitInfo(app_id, shunt_model, hash_id, uid) {
        return this.ctx.service[this.service_name].getHitInfo(app_id, shunt_model, hash_id, uid)
    }
    setCookies(app_id, uid, trace_id) {
        const {
            ctx,
            app
        } = this;
        let hostname = ctx.request.hostname;
        let domain = ctx.helper.isIpHostName(hostname) ? hostname : hostname.replace(/(.+)(?=\..+\..+\b)/, '');
        ctx.cookies.set(app.config.ABTEST_UID_COOKIE_NAME, uid, {
            maxAge: app.config.ABTEST_COOKIE_ALIVE_TIME,
            // set 在主域上
            domain,
            httpOnly: false
        })
        // set trace_id in cookie
        ctx.cookies.set(app.config.ABTEST_TRACE_ID_COOKIE_NAME + '-' + app_id, trace_id, {
            maxAge: app.config.ABTEST_COOKIE_ALIVE_TIME,
            domain,
            httpOnly: false
        })
    }
    /**
     * 根据query string 返回命中的实验信息
     * @param {*} hit_info 
     * @returns 
     */
    async dynamicResponse(hit_info) {
        const {
            ctx,
            app
        } = this;
        let {
            layer_id,
            res_type,
            cb
        } = ctx.query;
        let layer = layer_id ? hit_info.layer[layer_id] : '';
        let layer_api = layer ? layer.hit_exp_api : '';
        if (!layer_id && res_type === '302') {
            return ctx.throw(400, 'layer_id is requird')
        }
        if (layer && res_type === '302') {
            return layer_api && ctx.redirect(layer_api)
        }
        if (layer && res_type === 'proxy') {
            // let url_obj = URL.parse(layer_api);
            // console.log(url_obj);
            // return ctx.proxyRequest(url_obj.host, {
            //     rewrite(obj) {
            //         obj.host = url_obj.host
            //         obj.path = url_obj.path;
            //         return obj
            //     },
            // });
        }
        if (res_type === 'detail') {
            if (layer) {
                try {
                    let res = await app.curl(layer_api);
                    layer.hit_exp_data = JSON.parse(res.data.toString())
                    hit_info.layer = {
                        [layer_id]: layer
                    }
                } catch (error) {
                    return ctx.throw(500, 'experiment api request handle error')
                }

            } else {
                try {
                    for (let _layer_id in hit_info.layer) {
                        let layer_data = hit_info.layer[_layer_id];
                        let res = await app.curl(layer_data.hit_exp_api);
                        layer_data.hit_exp_data = JSON.parse(res.data.toString());
                    }
                } catch (error) {
                    console.log(error);
                    return ctx.throw(500, 'experiment api request handle error')
                }
            }
        }
        if (!!cb) {
            return ctx.body = `${cb}(${JSON.stringify(hit_info)})`
        }
        ctx.body = {
            code: 0,
            data: hit_info
        }
    }
}

module.exports = BaseController;