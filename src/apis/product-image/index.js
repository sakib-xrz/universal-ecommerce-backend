const { Router } = require('express');
const ProductImageController = require('../../controller/product-image.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const { upload } = require('../../utils/handelFile.js');

const router = Router();

router.post(
    '/',
    authGuard(UserRole.SUPER_ADMIN),
    upload.single('image'),
    ProductImageController.createProductImage
);

router.post(
    '/multiple',
    authGuard(UserRole.SUPER_ADMIN),
    upload.array('images', 4),
    ProductImageController.createProductImages
);

router.delete(
    '/:id',
    authGuard(UserRole.SUPER_ADMIN),
    ProductImageController.deleteProductImage
);

module.exports = router;
