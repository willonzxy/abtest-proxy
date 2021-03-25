/** 定时清空分流配置 */
module.exports = {
    schedule: {
      //cron: '0 0 23 * * *', // 晚上23点执行clear_job
      interval: '1m',
      type: 'all',
      env:['test','prod']
    },
    task(ctx) {
        try {
            ctx.app.abtest_config = {};
            console.log('已清除配置')
            //ctx.scheduleLogger.info('local clear job finish.............');
        } catch (err) {
            //ctx.scheduleLogger.error(err)
        }
    }
};