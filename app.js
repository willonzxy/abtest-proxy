/**
 * @ Author: 伟龙-willon
 * @ Create Time: 2019-08-02 16:49:32
 * @ Modified by: 伟龙-willon
 * @ Modified time: 2021-03-21 11:28:50
 * @ Description:
 */

module.exports = app => {
    app.beforeStart(async () => {
        // 初始化abtest缓存配置
        app.abtest_config = {}
        // 初始化abtest分流层模型
        app.shunt_model = {}
        // 记录分流配置是否有发生变化
        app.abtest_config_md5 = {};
    });
}