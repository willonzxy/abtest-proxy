'use strict';

const { Controller } = require("egg");

/**
 * @param {Egg.Application} app - egg application
 * all restful api
 */
module.exports = app => {
  const { router , controller } = app;
  router.get('/layer/:id',controller.layer.index)
  router.get('/app/:id',controller.app.index)
};
