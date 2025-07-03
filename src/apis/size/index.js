const { Router } = require('express');
const SizeController = require('../../controller/size.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');

const router = Router();

router
    .route('/')
    .post(authGuard(UserRole.SUPER_ADMIN), SizeController.createSize)
    .get(authGuard(UserRole.SUPER_ADMIN), SizeController.getSizes);

router
    .route('/:id')
    .delete(
        authGuard(UserRole.SUPER_ADMIN),
        SizeController.deleteSize
    );

module.exports = router;
