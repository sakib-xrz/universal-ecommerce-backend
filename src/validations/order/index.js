const {
    PaymentMethod,
    PlatformOrder,
    OrderStatus
} = require('@prisma/client');
const { z } = require('zod');

const CreateOrder = z.object({
    body: z
        .object({
            user_id: z
                .string({
                    invalid_type_error: 'User ID must be a string'
                })
                .nullable()
                .optional(),
            customer_name: z
                .string({
                    required_error: 'Customer name is required',
                    invalid_type_error:
                        'Customer name must be a string'
                })
                .min(
                    3,
                    'Customer name must be at least 3 characters'
                ),
            email: z
                .string({
                    required_error: 'Email is required',
                    invalid_type_error: 'Email must be a string'
                })
                .email('Invalid email'),
            phone: z
                .string({
                    required_error: 'Phone is required',
                    invalid_type_error: 'Phone must be a string'
                })
                .min(11, 'Phone must be at least 11 characters'),
            is_inside_dhaka: z.boolean({
                required_error: 'Inside/Outside Dhaka is required',
                invalid_type_error:
                    'Inside/Outside Dhaka must be a boolean'
            }),
            address_line: z
                .string({
                    required_error: 'Address is required',
                    invalid_type_error: 'Address must be a string'
                })
                .min(10, 'Address must be at least 10 characters'),
            note: z
                .string({
                    invalid_type_error: 'Note must be a string'
                })
                .nullable()
                .optional(),
            product: z
                .array(
                    z.object({
                        product_id: z.string({
                            required_error: 'Product ID is required',
                            invalid_type_error:
                                'Product ID must be a string'
                        }),
                        variant_id: z.string({
                            required_error:
                                'Product variant id is required',
                            invalid_type_error:
                                'Product variant id must be a string'
                        }),
                        size_id: z
                            .string({
                                invalid_type_error:
                                    'Product size id must be a string'
                            })
                            .nullable(),
                        quantity: z
                            .number({
                                required_error:
                                    'Quantity is required',
                                invalid_type_error:
                                    'Quantity must be a number'
                            })
                            .positive('Quantity must be positive')
                    }),
                    {
                        required_error: 'Product is required',
                        invalid_type_error: 'Product must be an array'
                    }
                )
                .nonempty(),
            platform: z
                .enum(
                    [
                        PlatformOrder.WEBSITE,
                        PlatformOrder.FACEBOOK,
                        PlatformOrder.INSTAGRAM,
                        PlatformOrder.PHONE
                    ],
                    {
                        invalid_type_error: 'Invalid platform'
                    }
                )
                .optional(),
            reference_link: z
                .string({
                    invalid_type_error:
                        'Reference link must be a string'
                })
                .nullable()
                .optional(),
            payment_method: z.enum(
                [
                    PaymentMethod.CASH_ON_DELIVERY
                ],
                {
                    required_error: 'Payment method is required',
                    invalid_type_error: 'Invalid payment method'
                }
            )
        })
});

const UpdateOrderItem = z.object({
    body: z.object({
        quantity: z
            .number({
                required_error: 'Quantity is required',
                invalid_type_error: 'Quantity must be a number'
            })
            .nonnegative('Quantity must be non-negative number')
    })
});

const UpdateOrderStatus = z.object({
    body: z.object({
        status: z.enum(
            [
                OrderStatus.PLACED,
                OrderStatus.CONFIRMED,
                OrderStatus.SHIPPED,
                OrderStatus.PENDING,
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED
            ],
            {
                required_error: 'Status is required',
                invalid_type_error: 'Invalid status'
            }
        )
    })
});

const OrderValidation = {
    CreateOrder,
    UpdateOrderItem,
    UpdateOrderStatus
};

module.exports = OrderValidation;
