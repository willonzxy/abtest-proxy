/*
 * @Author: willon 伟龙 
 * @Date: 2019-08-05 23:54:33 
 * @Last Modified by: 伟龙
 * @Last Modified time: 2020-02-17 21:39:04
 */
const qiniu = require('qiniu');
const path = require('path');
const fs = require('fs');

module.exports = app => {
    app.addSingleton('btqiniu', initQiniu);
}
/**
 * @param  {Object} config   
 * @param  {Application} app 当前的应用
 * @return {Object}          返回实例
 */
function initQiniu({AK,SK,BN,SERVER,PROTOCOL,OVERSEA_BN,OVERSEA_SERVER,OVERSEA_PROTOCOL}, app) {
    return {
        '100bt':new Qiniu(AK,SK,BN,SERVER,PROTOCOL),
        'ubeejoy':new Qiniu(AK,SK,OVERSEA_BN,OVERSEA_SERVER,OVERSEA_PROTOCOL) 
    }
}

class Qiniu {
    constructor(AK,SK,BN,SERVER,PROTOCOL){
        this.AK = AK;
        this.SK = SK;
        this.BN = BN;
        this.SERVER = SERVER;
        this.PROTOCOL = PROTOCOL;
    }
    getMeta(){
        const mac = new qiniu.auth.digest.Mac(this.AK, this.SK);
        const options = {
            scope: this.BN,
            returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
        };
        const putPolicy = new qiniu.rs.PutPolicy(options);
        const uploadToken = putPolicy.uploadToken(mac);
        const config = new qiniu.conf.Config();
        const formUploader = new qiniu.form_up.FormUploader(config);
        const putExtra = new qiniu.form_up.PutExtra();
        return {
            uploadToken,
            putExtra,
            formUploader,
        }
    }
    putStream(key,file_stream){
        /** 每次都要获取当前的Token */
        const { uploadToken , putExtra , formUploader } = this.getMeta();
        return new Promise((resolve,reject) => {
            formUploader.putStream(uploadToken, key, file_stream, putExtra, (respErr,respBody, respInfo)=>{
                if (respErr) {
                    return reject(respErr)
                }
                resolve({...respInfo,uri:`${this.PROTOCOL}://${this.SERVER}/${key}`,uploadToken,ts:Date.now()})
            });
        })
    }
    putFile(key,file_path){
        if(!fs.existsSync(file_path)){
            return { status : 2 , msg : '文件路径不存在' }                
        }
        const { uploadToken , putExtra , formUploader } = this.getMeta();
        return new Promise((resolve,reject) => {
            formUploader.putFile(uploadToken, key, file_path, putExtra, (respErr,respBody, respInfo)=>{
                if (respErr) {
                    return reject(respErr)
                }
                resolve({...respInfo,uri:`${this.PROTOCOL}://${this.SERVER}/${key}`,uploadToken,ts:Date.now()})
            });
        })
    }
}