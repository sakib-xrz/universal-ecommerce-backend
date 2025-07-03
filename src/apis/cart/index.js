const { Router } = require('express');

const CartController = require('../../controller/cart.controller.js');

const router = Router();

router.post('/', CartController.getCart);

module.exports = router;
