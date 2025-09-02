const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const ApiError = require('../error/ApiError.js');
const generateOrderId = require('../utils/generateOrderId.js');
const config = require('../config/index.js');
const calculateTotalPrice = require('../utils/calculateTotalPrice.js');
const { emitNewOrderNotification } = require('../config/socket.js');
const {
    PlatformOrder,
    UserRole,
    ProductImageType,
    OrderStatus,
    PaymentStatus
} = require('@prisma/client');
const calculatePagination = require('../helpers/calculatePagination.js');
const pick = require('../utils/pick.js');
const bcrypt = require('bcrypt');

const createOrder = catchAsync(async (req, res) => {
    let {
        user_id,
        customer_name,
        email,
        phone,
        is_inside_dhaka,
        address_line,
        note,
        product,
        payment_method
    } = req.body;

    let profile = await prisma.profile.findUnique({
        where: {
            email
        }
    });

    // For unauthenticated users, we allow orders even if email exists
    // For authenticated users, we require user_id if profile exists
    if (profile && !user_id && req.user) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'User already exists please provide user id'
        );
    }

    const result = await prisma.$transaction(
        async transactionClient => {
            if (!profile) {
                const hashedPassword = await bcrypt.hash(
                    Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15),
                    Number(config.bcrypt_salt_rounds)
                );

                const user = await transactionClient.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        role: UserRole.CUSTOMER,
                        need_password_change: true
                    }
                });

                user_id = user.id;

                profile = await transactionClient.profile.create({
                    data: {
                        user_id,
                        name: customer_name,
                        email,
                        phone
                    }
                });
            } else if (profile && !user_id) {
                // For unauthenticated users with existing profile, use the existing user_id
                user_id = profile.user_id;
            }

            const order_id = generateOrderId();

            // Create initial order
            const initialOrder = await transactionClient.order.create(
                {
                    data: {
                        order_id,
                        user_id,
                        customer_name,
                        email,
                        phone,
                        is_inside_dhaka,
                        address_line,
                        note,
                        platform:
                            req.body.platform ||
                            PlatformOrder.WEBSITE,
                        reference_link:
                            req.body.reference_link || null
                    }
                }
            );

            // Query all products in one go
            const productIds = product.map(el => el.product_id);
            const allProducts =
                await transactionClient.product.findMany({
                    where: {
                        id: { in: productIds },
                        is_published: true,
                        is_deleted: false
                    },
                    include: {
                        variants: {
                            include: {
                                size: true
                            }
                        }
                    }
                });

            const uniqueProductLength = new Set(productIds)?.size;

            // Check for missing products
            if (allProducts.length !== uniqueProductLength) {
                const missingProductIds = productIds.filter(
                    id => !allProducts.some(p => p.id === id)
                );
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Product(s) not found: ${missingProductIds.join(', ')}`
                );
            }

            // Separate products with and without size
            const productsWithSize = product.filter(el => el.size_id);
            const productsWithoutSize = product.filter(
                el => !el.size_id
            );

            const orderItemsData = [];
            const stockUpdates = [];

            // Process products with sizes
            for (const el of productsWithSize) {
                const currentProduct = allProducts.find(
                    p => p.id === el.product_id
                );
                const matchingVariant = currentProduct?.variants.find(
                    v => v.size_id === el.size_id
                );

                if (
                    !matchingVariant ||
                    matchingVariant.stock < el.quantity
                ) {
                    throw new ApiError(
                        httpStatus.BAD_REQUEST,
                        `Stock not available for "${currentProduct.name}" (Size: ${matchingVariant.size.name})`
                    );
                }

                const total_price = calculateTotalPrice(
                    currentProduct.sell_price,
                    el.quantity,
                    currentProduct.discount,
                    currentProduct.discount_type
                );

                orderItemsData.push({
                    order_id: initialOrder.order_id,
                    product_id: currentProduct.id,
                    variant_id: matchingVariant.id,
                    product_name: currentProduct.name,
                    product_price: currentProduct.sell_price,
                    product_size: matchingVariant.size.name,
                    quantity: el.quantity,
                    discount: currentProduct.discount,
                    discount_type: currentProduct.discount_type,
                    total_price
                });

                stockUpdates.push({
                    id: matchingVariant.id,
                    stock: matchingVariant.stock - el.quantity
                });
            }

            // Process products without sizes
            for (const el of productsWithoutSize) {
                const currentProduct = allProducts.find(
                    p => p.id === el.product_id
                );
                const matchingVariant = currentProduct?.variants[0];

                if (
                    !matchingVariant ||
                    matchingVariant.stock < el.quantity
                ) {
                    throw new ApiError(
                        httpStatus.BAD_REQUEST,
                        `Stock not available for "${currentProduct.name}"`
                    );
                }

                const total_price = calculateTotalPrice(
                    currentProduct.sell_price,
                    el.quantity,
                    currentProduct.discount,
                    currentProduct.discount_type
                );

                orderItemsData.push({
                    order_id: initialOrder.order_id,
                    product_id: currentProduct.id,
                    variant_id: matchingVariant.id,
                    product_name: currentProduct.name,
                    product_price: currentProduct.sell_price,
                    product_size: null,
                    quantity: el.quantity,
                    discount: currentProduct.discount,
                    discount_type: currentProduct.discount_type,
                    total_price
                });

                stockUpdates.push({
                    id: matchingVariant.id,
                    stock: matchingVariant.stock - el.quantity
                });
            }

            // Create all order items in a single operation
            await transactionClient.orderItem.createMany({
                data: orderItemsData
            });

            // Calculate totals
            const subtotal = orderItemsData.reduce(
                (acc, item) => acc + item.total_price,
                0
            );

            const settings = await prisma.setting.findFirst();

            const delivery_charge = is_inside_dhaka
                ? +settings.delivery_charge_inside_dhaka
                : +settings.delivery_charge_outside_dhaka;
            const grand_total = Number(subtotal + delivery_charge);

            // Update order with totals
            await transactionClient.order.update({
                where: { id: initialOrder.id },
                data: { subtotal, delivery_charge, grand_total }
            });

            await transactionClient.payment.create({
                data: {
                    order_id: initialOrder.order_id,
                    payment_method,
                    payable_amount: grand_total
                }
            });

            // Perform stock updates in a single batch
            for (const update of stockUpdates) {
                await transactionClient.productVariant.update({
                    where: { id: update.id },
                    data: { stock: update.stock }
                });
            }

            await transactionClient.notification.create({
                data: {
                    order_id: initialOrder.order_id
                }
            });

            return {
                ...initialOrder,
                subtotal,
                delivery_charge,
                grand_total
            };
        }
    );

    // Emit Socket.io notification for new order
    try {
        emitNewOrderNotification({
            order_id: result.order_id,
            customer_name: result.customer_name,
            email: result.email,
            phone: result.phone,
            subtotal: result.subtotal,
            delivery_charge: result.delivery_charge,
            grand_total: result.grand_total,
            platform: result.platform,
            created_at: result.created_at
        });
    } catch (socketError) {
        console.error('Socket.io notification failed:', socketError);
        // Don't fail the order creation if socket notification fails
    }

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Order created successfully',
        data: result
    });
});

const getAllOrders = catchAsync(async (req, res) => {
    const orderFilterableFields = [
        'search',
        'status',
        'payment_status',
        'is_inside_dhaka',
        'platform'
    ];

    const orderSearchFields = [
        'order_id',
        'customer_name',
        'email',
        'phone'
    ];

    const filters = pick(req.query, orderFilterableFields);
    const options = pick(req.query, [
        'limit',
        'page',
        'sort_by',
        'sort_order'
    ]);

    const { page, limit, skip } = calculatePagination(options);
    const { search, payment_status, ...filterData } = filters;

    const andConditions = [];

    if (search) {
        andConditions.push({
            OR: orderSearchFields.map(field => ({
                [field]: {
                    contains: search,
                    mode: 'insensitive'
                }
            }))
        });
    }

    if (payment_status) {
        andConditions.push({
            payment: {
                status: {
                    equals: payment_status
                }
            }
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals:
                        filterData[key] === 'true'
                            ? true
                            : filterData[key] === 'false'
                              ? false
                              : filterData[key]
                }
            }))
        });
    }

    const whereConditions =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const orders = await prisma.order.findMany({
        where: whereConditions,
        select: {
            id: true,
            order_id: true,
            customer_name: true,
            email: true,
            phone: true,
            address_line: true,
            platform: true,
            created_at: true,
            grand_total: true,
            status: true,
            payment: {
                select: {
                    payment_method: true,
                    payable_amount: true,
                    status: true
                }
            }
        },
        skip,
        take: limit,
        orderBy:
            options.sortBy && options.sortOrder
                ? {
                      [options.sortBy]: options.sortOrder
                  }
                : {
                      created_at: 'desc'
                  }
    });

    const total = await prisma.order.count({
        where: whereConditions
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Orders retrieved successfully',
        meta: {
            page,
            limit,
            total
        },
        data: orders
    });
});

const getOrderDetails = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: {
            order_id: orderId
        },
        include: {
            products: {
                select: {
                    id: true,
                    product_id: true,
                    variant_id: true,
                    product_name: true,
                    product_price: true,
                    product_size: true,
                    quantity: true,
                    discount: true,
                    discount_type: true,
                    total_price: true
                }
            },
            payment: true
        }
    });

    if (!order) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'No order found with the provided order id'
        );
    }

    // Resolve image URLs for each product
    const productsWithImages = await Promise.all(
        order.products.map(async product => {
            const productImage = await prisma.productImage.findFirst({
                where: {
                    product_id: product.product_id,
                    type: ProductImageType.PRIMARY
                }
            });

            const productData = await prisma.product.findUnique({
                where: {
                    id: product.product_id
                }
            });

            return {
                ...product,
                sku: productData.sku,
                image_url: productImage
                    ? productImage?.image_url
                    : null
            };
        })
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Order details retrieved successfully',
        data: {
            ...order,
            products: productsWithImages
        }
    });
});

const updateOrderItem = catchAsync(async (req, res) => {
    const { orderId, orderItemId } = req.params;
    const { quantity } = req.body;

    const order = await prisma.order.findUnique({
        where: {
            order_id: orderId
        }
    });

    if (!order) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'No order found with the provided order id'
        );
    }

    const orderItem = await prisma.orderItem.findUnique({
        where: {
            id: orderItemId
        }
    });

    if (!orderItem) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'No order item found with the provided order item id'
        );
    }

    if (orderItem.order_id !== order.order_id) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Order item does not belong to the provided order'
        );
    }

    if (quantity >= orderItem.quantity) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Quantity can not be equal or greater than the initial quantity'
        );
    }

    await prisma.$transaction(async transactionClient => {
        const updateOrderItem =
            await transactionClient.orderItem.update({
                where: {
                    id: orderItemId
                },
                data: {
                    quantity,
                    total_price: calculateTotalPrice(
                        orderItem.product_price,
                        quantity,
                        orderItem.discount,
                        orderItem.discount_type
                    )
                }
            });

        const reducePrice =
            orderItem.total_price - updateOrderItem.total_price;

        const updateOrder = await transactionClient.order.update({
            where: {
                order_id: orderId
            },
            data: {
                subtotal: order.subtotal - reducePrice,
                grand_total: order.grand_total - reducePrice,
                status: OrderStatus.DELIVERED
            }
        });

        await transactionClient.payment.update({
            where: {
                order_id: orderId
            },
            data: {
                payable_amount: updateOrder.grand_total,
                status: PaymentStatus.PARTIAL
            }
        });

        const productVariant =
            await transactionClient.productVariant.findUnique({
                where: {
                    id: orderItem.variant_id
                }
            });

        await transactionClient.productVariant.update({
            where: {
                id: orderItem.variant_id
            },
            data: {
                stock: productVariant.stock + quantity
            }
        });
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Order item updated successfully'
    });
});

const updateOrderStatus = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
        where: {
            order_id: orderId
        }
    });

    if (!order) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'No order found with the provided order id'
        );
    }

    if (order.status === OrderStatus.CANCELLED) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Order is cancelled and can not be updated'
        );
    }

    await prisma.$transaction(async transactionClient => {
        if (status === OrderStatus.CANCELLED) {
            const orderItems =
                await transactionClient.orderItem.findMany({
                    where: {
                        order_id: orderId
                    }
                });

            for (const item of orderItems) {
                const productVariant =
                    await transactionClient.productVariant.findUnique(
                        {
                            where: {
                                id: item.variant_id
                            }
                        }
                    );

                await transactionClient.productVariant.update({
                    where: {
                        id: item.variant_id
                    },
                    data: {
                        stock: productVariant.stock + item.quantity
                    }
                });
            }

            await transactionClient.order.update({
                where: {
                    order_id: orderId
                },
                data: {
                    status
                }
            });

            await transactionClient.payment.update({
                where: {
                    order_id: orderId
                },
                data: {
                    status: PaymentStatus.FAILED
                }
            });
        }

        if (status === OrderStatus.DELIVERED) {
            await transactionClient.order.update({
                where: {
                    order_id: orderId
                },
                data: {
                    status
                }
            });

            await transactionClient.payment.update({
                where: {
                    order_id: orderId
                },
                data: {
                    status: PaymentStatus.SUCCESS
                }
            });
        }

        await transactionClient.order.update({
            where: {
                order_id: orderId
            },
            data: {
                status
            }
        });
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Order status updated successfully'
    });
});

const getMyOrders = catchAsync(async (req, res) => {
    const { user } = req;

    const orderFilterableFields = ['search', 'status'];

    const orderSearchFields = ['order_id'];

    const filters = pick(req.query, orderFilterableFields);

    const options = pick(req.query, [
        'limit',
        'page',
        'sort_by',
        'sort_order'
    ]);

    const { page, limit, skip } = calculatePagination(options);
    const { search, ...filterData } = filters;

    const andConditions = [];

    if (search) {
        andConditions.push({
            OR: orderSearchFields.map(field => ({
                [field]: {
                    contains: search,
                    mode: 'insensitive'
                }
            }))
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals:
                        filterData[key] === 'true'
                            ? true
                            : filterData[key] === 'false'
                              ? false
                              : filterData[key]
                }
            }))
        });
    }

    const whereConditions =
        andConditions.length > 0 ? { AND: andConditions } : {};

    whereConditions.user_id = user.id;

    const orders = await prisma.order.findMany({
        where: whereConditions,
        select: {
            id: true,
            order_id: true,
            customer_name: true,
            phone: true,
            address_line: true,
            created_at: true,
            grand_total: true,
            status: true,
            products: {
                select: {
                    id: true,
                    product_id: true,
                    product_name: true,
                    product_size: true,
                    quantity: true,
                    total_price: true
                }
            }
        },
        skip,
        take: limit,
        orderBy:
            options.sortBy && options.sortOrder
                ? {
                      [options.sortBy]: options.sortOrder
                  }
                : {
                      created_at: 'desc'
                  }
    });

    const total = await prisma.order.count({
        where: whereConditions
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Orders retrieved successfully',
        meta: {
            page,
            limit,
            total
        },
        data: orders
    });
});

const OrderController = {
    createOrder,
    getAllOrders,
    getOrderDetails,
    updateOrderItem,
    updateOrderStatus,
    getMyOrders
};

module.exports = OrderController;
