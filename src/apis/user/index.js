const { Router } = require('express');
const UserController = require('../../controller/user.controller');
const validateRequest = require('../../middlewares/validateRequest');
const UserValidation = require('../../validations/user');
const authGuard = require('../../middlewares/authGuard');
const { UserRole } = require('@prisma/client');

const router = Router();

router
    .route('/')
    .post(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(UserValidation.CreateUser),
        UserController.createUser
    )
    .get(authGuard(UserRole.SUPER_ADMIN), UserController.getAllUsers);
router
    .route('/customers')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        UserController.getCustomerList
    );
router
    .route('/:id')
    .delete(
        authGuard(UserRole.SUPER_ADMIN),
        UserController.deleteUser
    );
router
    .route('/:id/status')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(UserValidation.UpdateUserStatus),
        UserController.updateUserStatus
    );

module.exports = router;
