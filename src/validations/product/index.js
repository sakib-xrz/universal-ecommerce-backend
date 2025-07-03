const { z } = require('zod');

const CreateProduct = z.object({
    body: z
        .object({
            category_id: z.string({
                required_error: 'Category is required',
                invalid_type_error: 'Category must be a string'
            }),
            name: z.string({
                required_error: 'Product title is required',
                invalid_type_error: 'Product title must be a string'
            }),
            sku: z.string({
                required_error: 'Product SKU is required',
                invalid_type_error: 'SKU must be a string'
            }),
            short_description: z
                .string({
                    invalid_type_error:
                        'Short description must be a string'
                })
                .optional(),
            full_description: z
                .string({
                    invalid_type_error:
                        'Full description must be a string'
                })
                .optional(),
            delivery_policy: z
                .string({
                    invalid_type_error:
                        'Delivery policy must be a string'
                })
                .optional(),
            youtube_video_link: z
                .string({
                    invalid_type_error:
                        'Youtube video link must be a string'
                })
                .optional(),
            buy_price: z.number({
                required_error: 'Product buy price is required',
                invalid_type_error: 'Buy price must be a number'
            }),
            cost_price: z.number({
                required_error: 'Product cost price is required',
                invalid_type_error: 'Cost price must be a number'
            }),
            sell_price: z.number({
                required_error: 'Product sell price is required',
                invalid_type_error: 'Sell price must be a number'
            }),
            discount: z
                .number({
                    invalid_type_error: 'Discount must be a number'
                })
                .optional(),
            discount_type: z
                .enum(['PERCENTAGE', 'FLAT'], {
                    invalid_enum_error:
                        'Discount type must be PERCENTAGE or FLAT'
                })
                .optional()
        })
        .refine(
            data => {
                if (data.discount_type === 'PERCENTAGE') {
                    return (
                        data.discount === undefined ||
                        data.discount <= 100
                    );
                }
                if (
                    data.discount_type === 'FLAT' &&
                    data.sell_price !== undefined
                ) {
                    return (
                        data.discount === undefined ||
                        data.discount <= data.sell_price
                    );
                }
                return true;
            },
            {
                message:
                    'Discount must align with the type and sell price',
                path: ['discount']
            }
        )
});

const UpdateProduct = z.object({
    body: z
        .object({
            name: z
                .string({
                    invalid_type_error:
                        'Product title must be a string'
                })
                .optional(),
            sku: z
                .string({
                    invalid_type_error: 'SKU must be a string'
                })
                .optional(),
            short_description: z
                .string({
                    invalid_type_error:
                        'Short description must be a string'
                })
                .nullable()
                .optional(),
            full_description: z
                .string({
                    invalid_type_error:
                        'Full description must be a string'
                })
                .nullable()
                .optional(),
            delivery_policy: z
                .string({
                    invalid_type_error:
                        'Delivery policy must be a string'
                })
                .nullable()
                .optional(),
            youtube_video_link: z
                .string({
                    invalid_type_error:
                        'Youtube video link must be a string'
                })
                .nullable()
                .optional(),
            buy_price: z
                .number({
                    invalid_type_error: 'Buy price must be a number'
                })
                .optional(),
            cost_price: z
                .number({
                    invalid_type_error: 'Cost price must be a number'
                })
                .optional(),
            sell_price: z
                .number({
                    invalid_type_error: 'Sell price must be a number'
                })
                .optional(),
            discount: z
                .number({
                    invalid_type_error: 'Discount must be a number'
                })
                .optional(),
            discount_type: z
                .enum(['PERCENTAGE', 'FLAT'], {
                    invalid_enum_error:
                        'Discount type must be PERCENTAGE or FLAT'
                })
                .optional()
        })
        .refine(
            data => {
                if (data.discount_type === 'PERCENTAGE') {
                    return (
                        data.discount === undefined ||
                        data.discount <= 100
                    );
                }
                if (
                    data.discount_type === 'FLAT' &&
                    data.sell_price !== undefined
                ) {
                    return (
                        data.discount === undefined ||
                        data.discount <= data.sell_price
                    );
                }
                return true;
            },
            {
                message:
                    'Discount must align with the type and sell price',
                path: ['discount']
            }
        )
});

const ProductValidation = {
    CreateProduct,
    UpdateProduct
};

module.exports = ProductValidation;
