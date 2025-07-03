const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const ApiError = require('../error/ApiError.js');
const { OrderStatus, PaymentStatus } = require('@prisma/client');

const updatePaymentStatus = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
        where: {
            order_id: orderId
        }
    });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Order is cancelled and cannot be updated'
        );
    }

    const payment = await prisma.payment.findUnique({
        where: {
            order_id: orderId
        }
    });

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    if (payment.status === PaymentStatus.PARTIAL) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Payment status is already partial and cannot be updated'
        );
    }

    await prisma.payment.update({
        where: {
            order_id: orderId
        },
        data: {
            status
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Payment status updated successfully'
    });
});

const PaymentController = {
    updatePaymentStatus
};

module.exports = PaymentController;
