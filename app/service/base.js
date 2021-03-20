/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-07-30 15:25:28
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-03-20 20:45:02
 * @ Description:
 */
const Service = require('egg').Service;
const murmurHash3 = require("murmurhash3js");

class BaseService extends Service {
    constructor(ctx, table_name) {
        super(ctx);
        this.table_name = table_name;
    }
    async getConfigByAppId(app_id) {
        let config = this.app.abtest_config[app_id]
        if (!config) {
            // get config from rpc
            config = await this.getConfigFromRPC(app_id);
        }
        this.app.abtest_config[app_id] = config
        return config;
    }
    async getConfigFromRPC(app_id) {
        const {
            app,
            ctx
        } = this;
        let db_api = `http://cms-api-test.100bt.com/res/222?sign=7656d4cc98df16c16b94ab3326c36303&app_id=${app_id}`;
        let res = undefined;
        try {
            res = await app.curl(db_api);
            res = JSON.parse(res.data.toString())
            res = res.data
        } catch (error) {
            console.log(error);
            res = undefined
        }
        return res
    }
    /**
     * 
     * @param {*} app_id 
     * @param {*} config 
     * 1 根据app_id查出分流模型
     * 2 没有就新建，有就调整
     */
    shuntModelMapping(app_id, config) {
        const {
            app
        } = this
        let shunt_model = app.shunt_model[app_id];
        try {
            if (!!shunt_model) {
                // 调整分流模型
                shunt_model = this.adjustAppShuntModel(shunt_model, config)
            }
            shunt_model = this.createAppShuntModel(app_id, config)
        } catch (error) {
            
        }
        return shunt_model
    }
    /**
     * 
     * @param {Number|String} app_id
     * @param {Array} config
     * return
     * app.shunt_model[app_id] = {
            launch_layer:{
                [layer_id]:api,
            },
            layer:{
                [layer_id]:{
                    ref_exp:{
                        api:'',
                        bucket:[]
                    },
                    exp_set:{
                        100:{
                            url:'',
                            bucket:[]
                        }
                    }
                }
            }
        };
     */
    createAppShuntModel(app_id, config) {
        const {
            app
        } = this;
        app.shunt_model[app_id] = {
            launch_layer: {},
            layer: {}
        };
        for (let item of config) {
            let {
                hit,
                layer_id,
                exp_set,
                ref_exp_api
            } = item;
            // 对照组的分流桶生成
            app.shunt_model[app_id].layer[layer_id] = {
                ref_exp: {
                    api:ref_exp_api,
                    bucket:this.getBucket(0, (1 - hit) * app.config.BUCKET_NUM)
                },
                exp_set: {}
            };
            let index = 0;
            // 实验组的分流桶生成
            for (let exp_item of exp_set) {
                let {
                    exp_id,
                    exp_api,
                    _weight
                } = exp_item;
                let len = _weight * app.config.BUCKET_NUM;
                console.log(exp_id)
                let bucket = this.getBucket(index, len);
                app.shunt_model[app_id].layer[layer_id].exp_set[exp_id] = {
                    api:exp_api,
                    bucket
                }
                console.log(bucket)
                index = len
            }
        }
        return app.shunt_model[app_id]
    }
    /** 
     * 1 同样是先整理该app各自场景的抽样流量情况
     * 2 在整理各场景内的实验组的流量桶
     * 3 先收到桶
     * 4 再分配桶
     */
    adjustAppShuntModel(shunt_model,new_config) {
        // free记录各场景空闲桶的
        let free = {},BUCKET_NUM = this.app.config.BUCKET_NUM;
        for (let {
                layer_id,
                hit,
                exp_set,
                ref_exp_api
            } of new_config) {
            // 直接重新分配对照组的流量桶
            shunt_model.layer[layer_id].ref_exp = {
                api:ref_exp_api,
                bucket:this.getBucket(0, (1 - hit) * BUCKET_NUM)
            }
            // 旧的实验组
            let old_exp_set = shunt_model.layer[layer_id].exp_set;
            // 当前场景下有哪些实验
            let now_layer_exp_set = new Set();
            // 流量占比被增大的实验组
            let now_layer_shunt_expand_exp_set = {}
            // 收回占比缩小的，将其放进空闲桶中
            for (let {
                    exp_id,
                    _weight,
                    exp_api
                } of exp_set) {
                now_layer_exp_set.add(exp_id);
                // 如果新配置加多了一个实验组，那么就要为为旧分流模型初始化一个实验组
                let old_exp_bucket_len = old_exp_set[exp_id] ? old_exp_set[exp_id].bucket.length : (old_exp_set[exp_id] = { api:'',bucket:[] }).bucket.length;
                let new_exp_bucket_len = _weight * BUCKET_NUM
                let diff = new_exp_bucket_len - old_exp_bucket_len;
                if (diff < 0) {
                    !free[layer_id] && ( free[layer_id] = [] );
                    free[layer_id] = free[layer_id].concat(old_exp_set[exp_id].bucket.splice(0, Math.abs(diff)));
                }
                // 收集流量有扩大的实验，稍后为他们分配更多的流量桶
                if (diff > 0) {
                    now_layer_shunt_expand_exp_set[exp_id] = diff
                }
                // 更新api
                old_exp_set[exp_id].api = exp_api;
            }
            // 如果新配置中删除了某个实验，那么将收回该场景的所有流量桶
            for( let old_exp_id in old_exp_set ){
                if(!now_layer_exp_set.has(old_exp_id)){
                    free[layer_id] = free[layer_id].concat(old_exp_set[old_exp_id].bucket)
                    old_exp_set[old_exp_id].exp_api = '';
                    delete old_exp_set[old_exp_id];
                }
            }

            // 回收了当前场景的所有空闲桶之后，再分配桶给流量被扩大的实验组
            for(let exp_id in now_layer_shunt_expand_exp_set){
                old_exp_set[exp_id].bucket = old_exp_set[exp_id].bucket.concat(free[layer_id].splice(0, diff))
            }
        }
        return shunt_model
    }
    getBucket(start = 0, len) {
        let arr = [],
            i = start;
        while (len--) {
            arr.push(i);
            i++
        }
        return arr;
    }
    getHitInfo(app_id,shunt_model,hash_id){
        let hit_info = {
            layer:{

            },
            trace_id:[]
        };
        const BUCKET_NUM = this.app.config.BUCKET_NUM;
        // 如果layer_id存在，只输出该输指定场景下的命中信息
        // 否则就输出多场景的命中信息
        let layers = shunt_model.layer;
        for(let layer_id in layers){
            let layer_shunt_model = layers[layer_id];
            if(shunt_model.launch_layer[layer_id]){
                // 记录对应场景所命中实验数据api
                hit_info.layer[layer_id] = shunt_model.launch_layer[layer_id]
                continue
            }
            // 如果没有在launch_layer层那就走分流逻辑
            let hash = murmurHash3.x86.hash32(hash_id);
            let mod = hash % BUCKET_NUM;
            // 看能否命中空白对照组
            if( layer_shunt_model.ref_exp.bucket.some(i=>i===mod) ){
                hit_info.layer[layer_id] = {
                    hit_exp_api:layer_shunt_model.ref_exp.api,
                    hit_exp_id:'',
                }
            }else{
                // 进入实验的流量重新hash打散
                let hash = murmurHash3.x86.hash32(hash_id + layer_id);
                let mod = hash % BUCKET_NUM;
                let exp_set = layer_shunt_model.exp_set;
                for(let exp_id in exp_set){
                    if(exp_set[exp_id].bucket.some(i=>i === mod)){
                        hit_info.layer[layer_id] = {
                            hit_exp_api:exp_set[exp_id].api,
                            hit_exp_id:exp_id
                        }
                        hit_info.trace_id.push(`${app_id}~${layer_id}~${exp_id}`)
                        break;
                    }
                }
            }
        }
        hit_info.trace_id = hit_info.trace_id.join('|')
        return hit_info
    }
}

module.exports = BaseService;