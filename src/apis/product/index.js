const { Router } = require('express');
const ProductController = require('../../controller/product.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const validateRequest = require('../../middlewares/validateRequest.js');
const ProductValidation = require('../../validations/product/index.js');

const router = Router();

router
    .route('/')
    .post(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(ProductValidation.CreateProduct),
        ProductController.createProduct
    );

router
    .route('/category/:slug')
    .get(ProductController.getProductsByCategory);

router
    .route('/admin')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        ProductController.getAdminProducts
    );

router
    .route('/:id/admin')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        ProductController.getAdminProduct
    );

router.patch(
    '/:id/publish-status',
    authGuard(UserRole.SUPER_ADMIN),
    ProductController.updatePublishedStatus
);

router.route('/search').get(ProductController.globalSearchProducts);

router.route('/:slug').get(ProductController.getCustomerProduct);

router
    .route('/:id')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(ProductValidation.UpdateProduct),
        ProductController.updateProduct
    )
    .delete(
        authGuard(UserRole.SUPER_ADMIN),
        ProductController.deleteProduct
    );

module.exports = router;
