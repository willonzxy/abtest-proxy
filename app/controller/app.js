const BaseController = require('./base.js');
class AppController extends BaseController {
    constructor(ctx) {
        super(ctx)
    }
    async index() {
        this.ctx.body = {  }
    }
}

module.exports = AppController;