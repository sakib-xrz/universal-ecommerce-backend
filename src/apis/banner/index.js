const { Router } = require('express');

const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const { upload } = require('../../utils/handelFile.js');
const BannerController = require('../../controller/banner.controller.js');

const router = Router();

router.post(
    '/',
    authGuard(UserRole.SUPER_ADMIN),
    upload.single('image'),
    BannerController.createBannerImage
);

router.get('/', BannerController.getBannerImages);

router.put(
    '/:id',
    authGuard(UserRole.SUPER_ADMIN),
    upload.single('image'),
    BannerController.updateBannerImage
);

router.delete(
    '/:id',
    authGuard(UserRole.SUPER_ADMIN),
    BannerController.deleteBannerImage
);

module.exports = router;
