const { Router } = require('express');
const MenuController = require('../../controller/menu.controller.js');

const router = Router();

router.get('/', MenuController.getMenus);

module.exports = router;
