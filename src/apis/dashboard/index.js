const { Router } = require('express');

const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const DashboardController = require('../../controller/dashboard.controller.js');

const router = Router();

router.get(
    '/customer-analytics',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getCustomerAnalytics
);

router.get(
    '/order-analytics',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getOrderAnalytics
);

router.get(
    '/sales-analytics',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getSalesAnalytics
);

module.exports = router;
