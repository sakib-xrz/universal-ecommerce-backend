const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const ApiError = require('../error/ApiError.js');
const pathaoService = require('../services/pathao.service.js');
const { pathao } = require('../config/index.js');

/**
 * Create a Pathao order for an existing order
 */
const createPathaoOrder = catchAsync(async (req, res) => {
    const {
        order_id,
        recipient_name,
        recipient_phone,
        recipient_secondary_phone,
        recipient_address,
        delivery_type,
        item_type,
        special_instruction,
        item_quantity,
        item_weight,
        item_description,
        amount_to_collect
    } = req.body;

    // Check if order exists
    const order = await prisma.order.findUnique({
        where: { order_id },
        include: {
            products: true,
            payment: true
        }
    });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    // Check if Pathao order already exists for this order
    const existingPathaoOrder = await prisma.pathaoOrder.findUnique({
        where: { order_id }
    });

    if (existingPathaoOrder) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Pathao order already exists for this order'
        );
    }

    // Prepare order data for Pathao
    const pathaoOrderData = {
        merchant_order_id: order_id,
        recipient_name: recipient_name || order.customer_name,
        recipient_phone: recipient_phone || order.phone,
        recipient_address: recipient_address || order.address_line,
        delivery_type: delivery_type || 48,
        item_type: item_type || 2,
        special_instruction: special_instruction || order.note,
        item_quantity: item_quantity || order.products.length,
        item_weight: item_weight || '0.5',
        item_description:
            item_description || `Order from ${order.customer_name}`,
        amount_to_collect: amount_to_collect || 0
    };

    // Add secondary phone if provided
    if (recipient_secondary_phone) {
        pathaoOrderData.recipient_secondary_phone =
            recipient_secondary_phone;
    }

    try {
        // Create order in Pathao
        const pathaoResponse =
            await pathaoService.createOrder(pathaoOrderData);

        // Save Pathao order details to database
        const pathaoOrder = await prisma.pathaoOrder.create({
            data: {
                order_id,
                consignment_id: pathaoResponse.data?.consignment_id,
                merchant_order_id: order_id,
                recipient_name: pathaoOrderData.recipient_name,
                recipient_phone: pathaoOrderData.recipient_phone,
                recipient_address: pathaoOrderData.recipient_address,
                delivery_type: pathaoOrderData.delivery_type,
                item_type: pathaoOrderData.item_type,
                special_instruction:
                    pathaoOrderData.special_instruction,
                item_quantity: pathaoOrderData.item_quantity,
                item_weight: Number(pathaoOrderData.item_weight),
                item_description: pathaoOrderData.item_description,
                amount_to_collect: pathaoOrderData.amount_to_collect,
                delivery_fee: pathaoResponse.data?.delivery_fee,
                order_status: pathaoResponse.data?.order_status,
                pathao_status: pathaoResponse.data?.order_status
            }
        });

        if (pathaoResponse?.type === 'success') {
            await prisma.order.update({
                where: {
                    order_id: pathaoResponse?.data?.merchant_order_id
                },
                data: {
                    status: 'CONFIRMED'
                }
            });
        }

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: 'Pathao order created successfully',
            data: {
                pathao_order: pathaoOrder,
                pathao_response: pathaoResponse
            }
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            error.message || 'Failed to create Pathao order'
        );
    }
});

/**
 * Create bulk Pathao orders
 */
const createBulkPathaoOrders = catchAsync(async (req, res) => {
    const { orders } = req.body;

    // Validate all orders exist
    const orderIds = orders.map(order => order.order_id);
    const existingOrders = await prisma.order.findMany({
        where: { order_id: { in: orderIds } }
    });

    if (existingOrders.length !== orderIds.length) {
        const foundOrderIds = existingOrders.map(
            order => order.order_id
        );
        const missingOrderIds = orderIds.filter(
            id => !foundOrderIds.includes(id)
        );
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Orders not found: ${missingOrderIds.join(', ')}`
        );
    }

    // Check for existing Pathao orders
    const existingPathaoOrders = await prisma.pathaoOrder.findMany({
        where: { order_id: { in: orderIds } }
    });

    if (existingPathaoOrders.length > 0) {
        const existingOrderIds = existingPathaoOrders.map(
            order => order.order_id
        );
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Pathao orders already exist for: ${existingOrderIds.join(', ')}`
        );
    }

    try {
        // Create bulk orders in Pathao
        const pathaoResponse =
            await pathaoService.createBulkOrders(orders);

        sendResponse(res, {
            statusCode: httpStatus.ACCEPTED,
            success: true,
            message: 'Bulk Pathao orders creation request accepted',
            data: pathaoResponse
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            error.message || 'Failed to create bulk Pathao orders'
        );
    }
});

/**
 * Get Pathao order information
 */
const getPathaoOrderInfo = catchAsync(async (req, res) => {
    const { consignmentId } = req.params;

    try {
        const pathaoResponse =
            await pathaoService.getOrderInfo(consignmentId);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message:
                'Pathao order information retrieved successfully',
            data: pathaoResponse
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            error.message || 'Failed to get Pathao order information'
        );
    }
});

/**
 * Calculate delivery price
 */
const calculateDeliveryPrice = catchAsync(async (req, res) => {
    req.body.item_weight = Number(req.body.item_weight);
    const {
        item_type,
        delivery_type,
        item_weight,
        recipient_city,
        recipient_zone
    } = req.body;

    console.log(req.body, 'body');

    const store_id = pathao.store_id;

    try {
        const priceResponse = await pathaoService.calculatePrice({
            store_id,
            item_type,
            delivery_type,
            item_weight: Number(item_weight),
            recipient_city,
            recipient_zone
        });

        console.log(priceResponse, 'priceResponse');

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Delivery price calculated successfully',
            data: priceResponse
        });
    } catch (error) {
        console.log(error, 'error');
    }
});

/**
 * Get list of cities
 */
const getCities = catchAsync(async (req, res) => {
    try {
        const citiesResponse = await pathaoService.getCities();

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Cities retrieved successfully',
            data: citiesResponse?.data?.data
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            error.message || 'Failed to get cities'
        );
    }
});

/**
 * Get valid city/zone combinations for price calculation
 */
const getValidPriceCombinations = catchAsync(async (req, res) => {
    const validCombinations = [
        {
            city_id: 1,
            city_name: 'Dhaka',
            zone_id: 1070,
            zone_name: 'Abdullahpur Uttara'
        },
        {
            city_id: 1,
            city_name: 'Dhaka',
            zone_id: 1066,
            zone_name: 'Abul Hotel'
        },
        {
            city_id: 1,
            city_name: 'Dhaka',
            zone_id: 298,
            zone_name: '60 feet'
        },
        {
            city_id: 2,
            city_name: 'Chittagong',
            zone_id: 1,
            zone_name: 'Default Zone'
        }
    ];

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Valid city/zone combinations for price calculation',
        data: {
            combinations: validCombinations,
            note: 'These combinations are known to work for price calculation in sandbox environment'
        }
    });
});

/**
 * Get zones for a specific city
 */
const getZones = catchAsync(async (req, res) => {
    const { cityId } = req.params;

    try {
        const zonesResponse = await pathaoService.getZones(
            parseInt(cityId)
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Zones retrieved successfully',
            data: zonesResponse?.data?.data
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            error.message || 'Failed to get zones'
        );
    }
});

/**
 * Get areas for a specific zone
 */
const getAreas = catchAsync(async (req, res) => {
    const { zoneId } = req.params;

    try {
        const areasResponse = await pathaoService.getAreas(
            parseInt(zoneId)
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Areas retrieved successfully',
            data: areasResponse?.data?.data
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            error.message || 'Failed to get areas'
        );
    }
});

/**
 * Get merchant stores
 */
const getStores = catchAsync(async (req, res) => {
    try {
        const storesResponse = await pathaoService.getStores();

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Stores retrieved successfully',
            data: storesResponse
        });
    } catch (error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            error.message || 'Failed to get stores'
        );
    }
});

/**
 * Get all Pathao orders with pagination
 */
const getAllPathaoOrders = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = {};
    if (search) {
        whereConditions.OR = [
            { order_id: { contains: search, mode: 'insensitive' } },
            {
                consignment_id: {
                    contains: search,
                    mode: 'insensitive'
                }
            },
            {
                recipient_name: {
                    contains: search,
                    mode: 'insensitive'
                }
            },
            {
                recipient_phone: {
                    contains: search,
                    mode: 'insensitive'
                }
            }
        ];
    }

    const pathaoOrders = await prisma.pathaoOrder.findMany({
        where: whereConditions,
        include: {
            order: {
                select: {
                    id: true,
                    order_id: true,
                    customer_name: true,
                    email: true,
                    phone: true,
                    status: true,
                    grand_total: true,
                    created_at: true
                }
            }
        },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
    });

    const total = await prisma.pathaoOrder.count({
        where: whereConditions
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Pathao orders retrieved successfully',
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
        },
        data: pathaoOrders
    });
});

/**
 * Get Pathao order details by order ID
 */
const getPathaoOrderDetails = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const pathaoOrder = await prisma.pathaoOrder.findUnique({
        where: { id: orderId },
        include: {
            order: {
                include: {
                    products: true,
                    payment: true
                }
            }
        }
    });

    if (!pathaoOrder) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Pathao order not found'
        );
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Pathao order details retrieved successfully',
        data: pathaoOrder
    });
});

/**
 * Update Pathao order status
 */
const updatePathaoOrderStatus = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const { pathao_status } = req.body;

    const pathaoOrder = await prisma.pathaoOrder.findUnique({
        where: { id: orderId }
    });

    if (!pathaoOrder) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Pathao order not found'
        );
    }

    const updatedPathaoOrder = await prisma.pathaoOrder.update({
        where: { order_id: orderId },
        data: { pathao_status }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Pathao order status updated successfully',
        data: updatedPathaoOrder
    });
});

const PathaoController = {
    createPathaoOrder,
    createBulkPathaoOrders,
    getPathaoOrderInfo,
    calculateDeliveryPrice,
    getCities,
    getValidPriceCombinations,
    getZones,
    getAreas,
    getStores,
    getAllPathaoOrders,
    getPathaoOrderDetails,
    updatePathaoOrderStatus
};

module.exports = PathaoController;
