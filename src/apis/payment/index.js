const { Router } = require('express');
const authGuard = require('../../middlewares/authGuard');
const { UserRole } = require('@prisma/client');
const validateRequest = require('../../middlewares/validateRequest.js');
const PaymentValidation = require('../../validations/payment/index.js');
const PaymentController = require('../../controller/payment.controller.js');

const router = Router();

router
    .route('/:orderId/status')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(PaymentValidation.UpdatePaymentStatus),
        PaymentController.updatePaymentStatus
    );

module.exports = router;
