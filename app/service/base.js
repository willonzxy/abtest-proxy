const Service = require('egg').Service;
const murmurHash3 = require("murmurhash3js");
const md5 = require('md5');

let count = {

}
class BaseService extends Service {
    constructor(ctx, table_name) {
        super(ctx);
        this.table_name = table_name;
    }
    async getConfigByAppId(app_id) {
        let config = this.app.abtest_config[app_id]
        if (!config) {
            // get config from rpc
            console.log('获取配置从远程服务')
            config = await this.getConfigByRPC(app_id);
        }
        return config;
    }
    async getConfigByRPC(app_id) {
        // const {
        //     app,
        //     ctx
        // } = this;
        // let db_api = `http://cms-api-test.100bt.com/res/222?sign=7656d4cc98df16c16b94ab3326c36303&app_id=${app_id}`;
        // let res = undefined;
        // try {
        //     res = await app.curl(db_api);
        //     res = JSON.parse(res.data.toString())
        //     res = res.data.data
        // } catch (error) {
        //     console.log(error);
        //     res = undefined
        // }
        // return res
        return [
            // 一个场景下的实验分流配置
            {
                "app_id": "10086",  // 应用id  ( id不一定要为数字类型，字符串类型亦可 )
                "layer_id": "10086_001", // 场景id
                "ref_exp_id": "10086_001_001", // 对照实验组id
                "ref_exp_api": "http://img4.a0bi.com/upload/articleResource/20200716/1594889281698.png", // 对照实验组的数据接口
                "hit": 1, // 参与实验的流量占，也叫抽样流量
                "version":1,
                "exp_set": [  // 实验组配置，数组长度要 >=2 ，且各实验的流量占比加起来要为1
                    {
                        "exp_id": "10086_001_001",
                        "exp_api": "http://img4.a0bi.com/upload/articleResource/20200716/1594889281698.png",
                        "_weight": 0.5  // 在抽样流量中的占比，取值区间[0,1]
                    },
                    {
                        "exp_id": "10086_001_002",
                        "exp_api": "http://resource.a0bi.com/aoqisy/yuyue/img/yuyue/4.png?__rev=221d99b",
                        "_weight": 0.5
                    }
                ]
            },
            // 另一个场景下的实验分流配置如下，数据结构同上
            {
                "app_id": "10086",  // 应用id  ( id不一定要为数字类型，字符串类型亦可 )
                "layer_id": "10086_002", // 场景id
                "ref_exp_id": "10086_002_001", // 对照实验组id
                "ref_exp_api": "http://cms-api-test.100bt.com/res/149?sign=a9326fb557232e75dc041fa19947a431", // 对照实验组的数据接口
                "hit": 1, // 参与实验的流量占，也叫抽样流量
                "version":1,
                "exp_set": [  // 实验组配置，数组长度要 >=2 ，且各实验的流量占比加起来要为1
                    {
                        "exp_id": "10086_002_001",
                        "exp_api": "http://cms-api-test.100bt.com/res/149?sign=a9326fb557232e75dc041fa19947a431",
                        "_weight": 0.5  // 在抽样流量中的占比，取值区间[0,1]
                    },
                    {
                        "exp_id": "10086_002_002",
                        "exp_api": "http://cms-api-test.100bt.com/res/165?sign=1B9NLwxwmhqt1sFNBYEmSVvhWaKa5PCuU1",
                        "_weight": 1
                    }
                ]
            },
        ]
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
        } = this;
        let shunt_model = app.shunt_model[app_id];
        let content_md5 = md5(JSON.stringify(config));
        try {// 如果分流模型存在那就调整分流模型即可，无则需要创建
            if (!!shunt_model) {
                // 如果分流配置发生了变化才需要调整分流模型
                if(content_md5 === app.abtest_config_md5[app_id]){
                    console.log('分流配置与此前的一致，无需调整分流模型')
                }else{
                    // 调整分流模型
                    shunt_model = this.adjustAppShuntModel(app_id,shunt_model, config);
                }
            }else{
                shunt_model = this.createAppShuntModel(app_id, config)
            }
        } catch (error) {
            console.log(error);
        }
        app.abtest_config_md5[app_id] = content_md5
        app.abtest_config[app_id] = config
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
                        bucket:[],
                        version
                    },
                    exp_set:{
                        100:{
                            url:'',
                            bucket:[],
                            version
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
                version,
                exp_set,
                ref_exp_api
            } = item;
            // 对照组的分流桶生成
            app.shunt_model[app_id].layer[layer_id] = {
                ref_exp: {
                    api:ref_exp_api,
                    bucket:this.getBucket(0, (1 - hit) * app.config.BUCKET_NUM),
                    version
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
                let bucket = this.getBucket(index, len);
                app.shunt_model[app_id].layer[layer_id].exp_set[exp_id] = {
                    api:exp_api,
                    bucket,
                    version
                }
                index = len;
                // 流量占比100%的实验，将该场景提升到launch层
                if(_weight === 1){
                    console.log('流量推全的实验'+exp_id)
                    app.shunt_model[app_id].launch_layer[layer_id] = {
                        api:exp_api,
                        exp_id,
                        version
                    }
                }
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
    adjustAppShuntModel(app_id,shunt_model,new_config) {
        // free记录各场景空闲桶的
        let free = {},BUCKET_NUM = this.app.config.BUCKET_NUM;
        for (let {
                layer_id,
                version,
                hit,
                exp_set,
                ref_exp_api
            } of new_config) {
            // 直接重新分配对照组的流量桶
            shunt_model.layer[layer_id].ref_exp = {
                api:ref_exp_api,
                bucket:this.getBucket(0, (1 - hit) * BUCKET_NUM),
                version
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
                old_exp_set[exp_id].version = version;
                // 更新launch layer
                if(_weight === 1){
                    shunt_model.launch_layer[layer_id] = {
                        api:exp_api,
                        exp_id,
                        version
                    }
                    console.log('流量推全的实验'+exp_id)
                }
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
        // 删除被移除的场景
        let old_config = this.app.abtest_config[app_id]
        for(let {layer_id} of old_config){
            if( new_config.some(i=>i.layer_id !== layer_id)){
                delete shunt_model.layer[layer_id];
                delete shunt_model.launch_layer[layer_id];
                console.log(layer_id+'已被删除');
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
    getHitInfo(app_id,shunt_model,hash_id,uid){
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
                let { api , exp_id , version } = shunt_model.launch_layer[layer_id];
                hit_info.layer[layer_id] = {
                    hit_exp_api:api,
                    hit_exp_id:exp_id,
                    version
                }
                console.log('命中launch layer层',layer_id)
                hit_info.trace_id.push(`${app_id}~${layer_id}~${exp_id}~${version}`)
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
                    version:layer_shunt_model.ref_exp.version
                }
                
                count['ref_exp'] ? count['ref_exp']++ : (count['ref_exp'] = 1);
                
                console.table(count)
            }else{
                // 进入实验的流量重新hash打散
                let hash = murmurHash3.x86.hash32(hash_id + layer_id);
                let mod = hash % BUCKET_NUM;
                let exp_set = layer_shunt_model.exp_set;
                for(let exp_id in exp_set){
                    // 命中桶的记录下来
                    if(exp_set[exp_id].bucket.some(i=>i === mod)){
                        let { version,api } = exp_set[exp_id]
                        hit_info.layer[layer_id] = {
                            hit_exp_api:api,
                            hit_exp_id:exp_id,
                            version:version
                        }
                        count[exp_id] ? count[exp_id]++ : (count[exp_id] = 1);
                        console.table(count)
                        hit_info.trace_id.push(`${app_id}~${layer_id}~${exp_id}~${version}`)
                        break;
                    }
                }
            }
        }
        hit_info.trace_id = hit_info.trace_id.join('|')
        hit_info.uid = uid;
        return hit_info
    }
}

module.exports = BaseService;