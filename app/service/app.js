const BaseService = require('./base.js');
class AppService extends BaseService {
    constructor(ctx) {
        super(ctx,'base')
    }
}

module.exports = AppService;