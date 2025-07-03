const { PaymentStatus } = require('@prisma/client');
const { z } = require('zod');

const UpdatePaymentStatus = z.object({
    body: z.object({
        status: z.enum([
            PaymentStatus.PENDING,
            PaymentStatus.PARTIAL,
            PaymentStatus.SUCCESS,
            PaymentStatus.FAILED
        ])
    })
});

const PaymentValidation = {
    UpdatePaymentStatus
};

module.exports = PaymentValidation;
