const { Router } = require('express');
const authGuard = require('../../middlewares/authGuard');
const { UserRole } = require('@prisma/client');
const PathaoController = require('../../controller/pathao.controller');
const validateRequest = require('../../middlewares/validateRequest.js');
const PathaoValidation = require('../../validations/pathao');
const { default: axios } = require('axios');
const pathaoService = require('../../services/pathao.service.js');

const router = Router();

router
    .route('/create-store')
    .post(authGuard(UserRole.SUPER_ADMIN), async (req, res) => {
        try {
            const storeData = req.body;
            const result = await pathaoService.createStore(storeData);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });
        }
    });

// Create Pathao order for existing order
router
    .route('/order')
    .post(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(PathaoValidation.CreatePathaoOrder),
        PathaoController.createPathaoOrder
    );

// Create bulk Pathao orders
router
    .route('/orders/bulk')
    .post(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(PathaoValidation.CreateBulkPathaoOrder),
        PathaoController.createBulkPathaoOrders
    );

// Calculate delivery price
router
    .route('/price/calculate')
    .post(
        authGuard(UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
        validateRequest(PathaoValidation.CalculatePrice),
        PathaoController.calculateDeliveryPrice
    );

// Get all Pathao orders (admin only)
router
    .route('/orders')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        PathaoController.getAllPathaoOrders
    );

// Get Pathao order details by order ID
router
    .route('/orders/:orderId')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        PathaoController.getPathaoOrderDetails
    );

// Update Pathao order status
router
    .route('/orders/:orderId/status')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        PathaoController.updatePathaoOrderStatus
    );

// Get Pathao order info by consignment ID
router
    .route('/orders/info/:consignmentId')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(PathaoValidation.GetOrderInfo),
        PathaoController.getPathaoOrderInfo
    );

// Get cities
router
    .route('/cities')
    .get(
        authGuard(UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
        PathaoController.getCities
    );

// Get valid price combinations
router
    .route('/price/valid-combinations')
    .get(
        authGuard(UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
        PathaoController.getValidPriceCombinations
    );

// Get zones for a city
router
    .route('/cities/:cityId/zones')
    .get(
        authGuard(UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
        validateRequest(PathaoValidation.GetZones),
        PathaoController.getZones
    );

// Get areas for a zone
router
    .route('/zones/:zoneId/areas')
    .get(
        authGuard(UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
        validateRequest(PathaoValidation.GetAreas),
        PathaoController.getAreas
    );

// Get merchant stores
router
    .route('/stores')
    .get(authGuard(UserRole.SUPER_ADMIN), PathaoController.getStores);

module.exports = router;
