const { Router } = require('express');

const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const DashboardController = require('../../controller/dashboard.controller.js');

const router = Router();

// Existing routes
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

router.get(
    '/stats',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getDashboardStats
);

// New enhanced routes
router.get(
    '/inventory-insights',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getInventoryInsights
);

router.get(
    '/top-performing-products',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getTopPerformingProducts
);

router.get(
    '/profit-analysis',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getProfitAnalysis
);

router.get(
    '/recent-activity',
    authGuard(UserRole.SUPER_ADMIN),
    DashboardController.getRecentActivity
);

module.exports = router;
