const { Router } = require('express');
const AuthController = require('../../controller/auth.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post(
    '/change-password',
    authGuard(UserRole.CUSTOMER, UserRole.SUPER_ADMIN),
    AuthController.changePassword
);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;
