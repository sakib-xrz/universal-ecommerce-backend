const { z } = require('zod');

const CreatePathaoOrder = z.object({
    body: z.object({
        order_id: z.string({
            required_error: 'Order ID is required',
            invalid_type_error: 'Order ID must be a string'
        }),
        recipient_name: z
            .string({
                required_error: 'Recipient name is required',
                invalid_type_error: 'Recipient name must be a string'
            })
            .min(3, 'Recipient name must be at least 3 characters')
            .max(
                100,
                'Recipient name must not exceed 100 characters'
            ),
        recipient_phone: z
            .string({
                required_error: 'Recipient phone is required',
                invalid_type_error: 'Recipient phone must be a string'
            })
            .refine(
                val =>
                    /^01\d{9}$/.test(val) ||
                    /^\+8801\d{9}$/.test(val),
                {
                    message:
                        'Recipient phone must be 11 digits (e.g., 017XXXXXXXX) or with country code +880 (e.g., +88017XXXXXXXX)'
                }
            ),
        recipient_secondary_phone: z
            .string({
                invalid_type_error:
                    'Recipient secondary phone must be a string'
            })
            .length(
                11,
                'Recipient secondary phone must be exactly 11 characters'
            )
            .optional(),
        recipient_address: z
            .string({
                required_error: 'Recipient address is required',
                invalid_type_error:
                    'Recipient address must be a string'
            })
            .min(
                10,
                'Recipient address must be at least 10 characters'
            )
            .max(
                220,
                'Recipient address must not exceed 220 characters'
            ),
        delivery_type: z
            .number({
                invalid_type_error: 'Delivery type must be a number'
            })
            .int()
            .refine(val => val === 48 || val === 12, {
                message:
                    'Delivery type must be 48 (Normal) or 12 (On Demand)'
            })
            .optional(),
        item_type: z
            .number({
                invalid_type_error: 'Item type must be a number'
            })
            .int()
            .refine(val => val === 1 || val === 2, {
                message:
                    'Item type must be 1 (Document) or 2 (Parcel)'
            })
            .optional(),
        special_instruction: z
            .string({
                invalid_type_error:
                    'Special instruction must be a string'
            })
            .max(
                500,
                'Special instruction must not exceed 500 characters'
            )
            .optional(),
        item_quantity: z
            .number({
                invalid_type_error: 'Item quantity must be a number'
            })
            .int()
            .positive('Item quantity must be positive')
            .optional(),
        item_weight: z
            .number({
                invalid_type_error: 'Item weight must be a number'
            })
            .refine(
                val => {
                    const weight = parseFloat(val);
                    return weight >= 0.5 && weight <= 10;
                },
                {
                    message:
                        'Item weight must be between 0.5 and 10 kg'
                }
            )
            .optional(),
        item_description: z
            .string({
                invalid_type_error:
                    'Item description must be a string'
            })
            .max(
                500,
                'Item description must not exceed 500 characters'
            )
            .optional(),
        amount_to_collect: z
            .number({
                invalid_type_error:
                    'Amount to collect must be a number'
            })
            .int()
            .min(0, 'Amount to collect must be non-negative')
            .optional()
    })
});

const CreateBulkPathaoOrder = z.object({
    body: z.object({
        orders: z
            .array(
                z.object({
                    order_id: z.string({
                        required_error: 'Order ID is required',
                        invalid_type_error:
                            'Order ID must be a string'
                    }),
                    recipient_name: z
                        .string({
                            required_error:
                                'Recipient name is required',
                            invalid_type_error:
                                'Recipient name must be a string'
                        })
                        .min(
                            3,
                            'Recipient name must be at least 3 characters'
                        )
                        .max(
                            100,
                            'Recipient name must not exceed 100 characters'
                        ),
                    recipient_phone: z
                        .string({
                            required_error:
                                'Recipient phone is required',
                            invalid_type_error:
                                'Recipient phone must be a string'
                        })
                        .refine(
                            val =>
                                /^01\d{9}$/.test(val) ||
                                /^\+8801\d{9}$/.test(val),
                            {
                                message:
                                    'Recipient phone must be 11 digits (e.g., 017XXXXXXXX) or with country code +880 (e.g., +88017XXXXXXXX)'
                            }
                        ),
                    recipient_secondary_phone: z
                        .string({
                            invalid_type_error:
                                'Recipient secondary phone must be a string'
                        })
                        .length(
                            11,
                            'Recipient secondary phone must be exactly 11 characters'
                        )
                        .optional(),
                    recipient_address: z
                        .string({
                            required_error:
                                'Recipient address is required',
                            invalid_type_error:
                                'Recipient address must be a string'
                        })
                        .min(
                            10,
                            'Recipient address must be at least 10 characters'
                        )
                        .max(
                            220,
                            'Recipient address must not exceed 220 characters'
                        ),
                    delivery_type: z
                        .number({
                            invalid_type_error:
                                'Delivery type must be a number'
                        })
                        .int()
                        .refine(val => val === 48 || val === 12, {
                            message:
                                'Delivery type must be 48 (Normal) or 12 (On Demand)'
                        })
                        .optional(),
                    item_type: z
                        .number({
                            invalid_type_error:
                                'Item type must be a number'
                        })
                        .int()
                        .refine(val => val === 1 || val === 2, {
                            message:
                                'Item type must be 1 (Document) or 2 (Parcel)'
                        })
                        .optional(),
                    special_instruction: z
                        .string({
                            invalid_type_error:
                                'Special instruction must be a string'
                        })
                        .max(
                            500,
                            'Special instruction must not exceed 500 characters'
                        )
                        .optional(),
                    item_quantity: z
                        .number({
                            invalid_type_error:
                                'Item quantity must be a number'
                        })
                        .int()
                        .positive('Item quantity must be positive')
                        .optional(),
                    item_weight: z
                        .string({
                            invalid_type_error:
                                'Item weight must be a string'
                        })
                        .refine(
                            val => {
                                const weight = parseFloat(val);
                                return weight >= 0.5 && weight <= 10;
                            },
                            {
                                message:
                                    'Item weight must be between 0.5 and 10 kg'
                            }
                        )
                        .optional(),
                    item_description: z
                        .string({
                            invalid_type_error:
                                'Item description must be a string'
                        })
                        .max(
                            500,
                            'Item description must not exceed 500 characters'
                        )
                        .optional(),
                    amount_to_collect: z
                        .number({
                            invalid_type_error:
                                'Amount to collect must be a number'
                        })
                        .int()
                        .min(
                            0,
                            'Amount to collect must be non-negative'
                        )
                        .optional()
                }),
                {
                    required_error: 'Orders array is required',
                    invalid_type_error: 'Orders must be an array'
                }
            )
            .min(1, 'At least one order is required')
            .max(50, 'Maximum 50 orders allowed in bulk operation')
    })
});

const CalculatePrice = z.object({
    body: z.object({
        item_type: z
            .number({
                invalid_type_error: 'Item type must be a number'
            })
            .int()
            .refine(val => val === 1 || val === 2, {
                message:
                    'Item type must be 1 (Document) or 2 (Parcel)'
            })
            .optional(),
        delivery_type: z
            .number({
                invalid_type_error: 'Delivery type must be a number'
            })
            .int()
            .refine(val => val === 48 || val === 12, {
                message:
                    'Delivery type must be 48 (Normal) or 12 (On Demand)'
            })
            .optional(),
        item_weight: z
            .string({
                invalid_type_error: 'Item weight must be a string'
            })
            .refine(
                val => {
                    const weight = parseFloat(val);
                    return weight >= 0.5 && weight <= 10;
                },
                {
                    message:
                        'Item weight must be between 0.5 and 10 kg'
                }
            )
            .optional(),
        recipient_city: z
            .number({
                required_error: 'Recipient city is required',
                invalid_type_error: 'Recipient city must be a number'
            })
            .int()
            .positive('Recipient city must be positive'),
        recipient_zone: z
            .number({
                required_error: 'Recipient zone is required',
                invalid_type_error: 'Recipient zone must be a number'
            })
            .int()
            .positive('Recipient zone must be positive')
    })
});

const GetOrderInfo = z.object({
    params: z.object({
        consignmentId: z.string({
            required_error: 'Consignment ID is required',
            invalid_type_error: 'Consignment ID must be a string'
        })
    })
});

const GetZones = z.object({
    params: z.object({
        cityId: z
            .string({
                required_error: 'City ID is required',
                invalid_type_error: 'City ID must be a string'
            })
            .refine(val => !isNaN(parseInt(val)), {
                message: 'City ID must be a valid number'
            })
    })
});

const GetAreas = z.object({
    params: z.object({
        zoneId: z
            .string({
                required_error: 'Zone ID is required',
                invalid_type_error: 'Zone ID must be a string'
            })
            .refine(val => !isNaN(parseInt(val)), {
                message: 'Zone ID must be a valid number'
            })
    })
});

const PathaoValidation = {
    CreatePathaoOrder,
    CreateBulkPathaoOrder,
    CalculatePrice,
    GetOrderInfo,
    GetZones,
    GetAreas
};

module.exports = PathaoValidation;
