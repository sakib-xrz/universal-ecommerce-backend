const { Router } = require('express');
const ProductVariantController = require('../../controller/product-variant.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');

const router = Router();

router
    .route('/')
    .post(
        authGuard(UserRole.SUPER_ADMIN),
        ProductVariantController.createProductVariant
    );

router
    .route('/:id')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        ProductVariantController.updateProductVariant
    )
    .delete(
        authGuard(UserRole.SUPER_ADMIN),
        ProductVariantController.deleteProductVariant
    );

module.exports = router;
