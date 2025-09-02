const { Router } = require('express');
const authGuard = require('../../middlewares/authGuard');
const { UserRole } = require('@prisma/client');
const OrderController = require('../../controller/order.controller');
const validateRequest = require('../../middlewares/validateRequest.js');
const OrderValidation = require('../../validations/order');

const router = Router();

router
    .route('/')
    .post(
        authGuard(UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
        validateRequest(OrderValidation.CreateOrder),
        OrderController.createOrder
    );

// Guest order creation route (no authentication required)
router
    .route('/guest')
    .post(
        validateRequest(OrderValidation.CreateOrder),
        OrderController.createOrder
    );

router
    .route('/me')
    .get(authGuard(UserRole.CUSTOMER), OrderController.getMyOrders);

router
    .route('/admin')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        OrderController.getAllOrders
    );

router
    .route('/:orderId/admin')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        OrderController.getOrderDetails
    );

router
    .route('/:orderId/status')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(OrderValidation.UpdateOrderStatus),
        OrderController.updateOrderStatus
    );

router
    .route('/:orderId/order-item/:orderItemId')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(OrderValidation.UpdateOrderItem),
        OrderController.updateOrderItem
    );

module.exports = router;
