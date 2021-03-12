/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-09-06 18:46:59
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-03-10 16:30:59
 * @ Description:
 */
const dayJs = require('dayjs');

module.exports = {
    get logger() {
        return this.getLogger('abtestLogger')
    },
    get scheduleLogger() {
        return this.getLogger('scheduleLogger')
    },
    get userLogger() {
        return this.getLogger('userLogger')
    },
    get tableNecessarySeed(){
        return () => {
            let date = dayJs().format('YYYY-MM-DD HH:mm:ss');
            let { user_id } = this.session
            return {
                created_date:date,
                modified_date:date,
                creator_id:user_id,
                modifier_id:user_id,
            }
        }
    }
};