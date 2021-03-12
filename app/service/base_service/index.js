/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-07-30 15:25:28
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-03-12 20:27:15
 * @ Description:
 */
const Service = require('egg').Service;
const node_uuid = require('uuid');
const qs = require('querystring');

class BaseService extends Service {
    constructor(ctx,table_name) {
      super(ctx);
      this.table_name = table_name;
    }
    async find(options){
        const { app } = this;
        let { pageNum = 1 , pageSize = 10 , regExp = '', order_by='created_date', sort_way='DESC',time_sort_by = '', start_time = '', end_time = '', attrs , ...rest} = options;
        let limit = +pageSize === 0 ? 1 : +pageSize,offset = ( pageNum - 1 ) * pageSize;
        let data = [];
        let time_query_str = '' , like_query_arr = [] , qstr = '' , base_sql = '',sql = '';
        try {
            if(attrs){
                attrs = attrs.toString()
            }else{
                attrs = '*'
            }
            try {
                typeof regExp === 'string' && ( regExp = JSON.parse(regExp))
            } catch (error) {
                
            }
            if(Array.isArray(regExp)){
                for(let key of regExp){
                    if(options[key]){
                        like_query_arr.push(`${key} REGEXP '.*${options[key]}.*'`)
                        delete options[key]
                        delete rest[key]
                    }
                    
                }
            }else if(regExp){
                like_query_arr.push(`${regExp} REGEXP '.*${options[regExp]}.*'`)
                delete options[regExp]
                delete rest[regExp]
            }

            if(time_sort_by && start_time && end_time){
                time_query_str = `${time_sort_by} BETWEEN STR_TO_DATE('${start_time}', '%Y-%m-%d %H:%i:%S' ) AND STR_TO_DATE('${end_time}', '%Y-%m-%d %H:%i:%S')`
            }
            for(let k in rest){
                if(typeof rest[k] === 'string'){
                    rest[k] = `'${rest[k]}'`
                }
            }
            qstr = Object.keys(rest).length > 0 ? decodeURIComponent(qs.stringify(rest)).replace(/&/g,' AND ').replace(/\\/g,'') : '';
            base_sql = `SELECT ${attrs} from ${this.table_name}`;
            if(qstr){
                sql += ` WHERE ${qstr}`
            }
            if(like_query_arr.length){
                if(sql.includes('WHERE')){
                    sql += ` AND ${like_query_arr.join('AND ')}`
                }else{
                    sql += ` WHERE ${like_query_arr.join('AND ')}`
                }
            }
            if(time_query_str){
                if(sql.includes('WHERE')){
                    sql += ` AND ${time_query_str}`;
                }else{
                    sql += ` WHERE ${time_query_str}`;
                }
            }
            let bundle_sql = base_sql + sql + ` ORDER BY ${order_by} ${sort_way} LIMIT ${offset}, ${limit};`;
            data = await app.mysql.query(bundle_sql);
            let numTotal = 0;
            if(data.length){
                let count_sql = `SELECT COUNT(*) as count from ${this.table_name} ${sql}`
                /** 返回格式 [{count:10}] */
                let result = await app.mysql.query(count_sql); 
                numTotal = result[0].count;
                // 翻译user_id
                data = await this.translateUserId(data);
            }
            return {
                list:data,
                numTotal,
                currentPage:pageNum,
                count:data.length,
                pageTotal: numTotal > 0 ? ~~( (numTotal - 1) / pageSize ) + 1 : 0
            }
        } catch (err) {
            //this.ctx.eclogger.error(err)
        }
        return {
            list:[],
            numTotal:0,
            currentPage:pageNum,
            count:0,
            pageTotal:0
        }
    }
    async findById(id){
        const data = await this.app.mysql.get(this.table_name,{id:id})
        return data;
    }
    async findOne(query){
        const data = await this.app.mysql.get(this.table_name,query)
        return data;
    }
  }

  module.exports = BaseService;