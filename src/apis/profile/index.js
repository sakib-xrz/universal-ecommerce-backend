const { Router } = require('express');
const ProfileController = require('../../controller/profile.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const { upload } = require('../../utils/handelFile.js');

const router = Router();

router.patch(
    '/',
    authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN),
    ProfileController.updateProfile
);

router.get(
    '/me',
    authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN),
    ProfileController.getMyProfile
);

router.patch(
    '/image',
    authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN),
    upload.single('image'),
    ProfileController.changeImage
);

module.exports = router;
