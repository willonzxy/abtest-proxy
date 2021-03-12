/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-07-30 11:37:14
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-03-10 15:24:30
 * @ Description: restful api Class
 */
const Controller = require('egg').Controller;


class RestfulController extends Controller{
    constructor(ctx,{service,rule}){
        super(ctx)
        this.service = service;
        this.rule = rule;
    }
    async index(){
        const ctx = this.ctx;
        let data = [],res_obj = {};
        try {
            data = await ctx.service[this.service].find(ctx.query);
            res_obj = {status:1,data,msg:'success'};
        } catch (err) {
            //ctx.eclogger.error(err)
            res_obj = {status:2,data,msg:'error'};
        }
        ctx.body = res_obj;
    }
    async show(){
        const ctx = this.ctx;
        const id = ctx.params.id;
        const data = await ctx.service[this.service].findById(id);
        ctx.body = data;
    }
    async create(){
        const ctx = this.ctx,rule = this.rule;
        const req_body = ctx.request.body;
        let res_obj = {};
        /** 需要做一层校验 */
        rule && ctx.validate(rule);
        try {
            res_obj = await ctx.service[this.service].create(req_body);
        } catch (err) {
            //ctx.eclogger.error(err)
            res_obj = { status : 2 , msg : 'error' }
        }
        ctx.body = res_obj
    }
    async destroy(){
        const { ctx } = this;
        const id = ctx.params.id;
        if(!id){
            return ctx.body = {status:2,msg:'id is requird'}
        }
        const result = await ctx.service[this.service].destroy(id);
        ctx.body = { status:1,msg:'success' }
    }
    async update(){
        const { ctx } = this;
        const id = ctx.params.id;
        const req_body = ctx.request.body;
        if(!id){
            return ctx.body = {status:2,msg:'id is requird'}
        }
        const result = await ctx.service[this.service].update(req_body,{
            id
        })
        ctx.body = { status:1,msg:'success' }
    }
    
}

module.exports = RestfulController