const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const {
    UserRole,
    UserStatus,
    OrderStatus
} = require('@prisma/client');

const getCustomerAnalytics = catchAsync(async (req, res) => {
    const totalCustomerCount = await prisma.user.count({
        where: {
            role: UserRole.CUSTOMER,
            is_deleted: false
        }
    });

    const totalActiveCustomerCount = await prisma.user.count({
        where: {
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            is_deleted: false
        }
    });

    const totalInactiveCustomerCount = await prisma.user.count({
        where: {
            role: UserRole.CUSTOMER,
            status: UserStatus.INACTIVE,
            is_deleted: false
        }
    });

    const customerAnalyticsData = [
        {
            type: 'Active',
            value: totalActiveCustomerCount,
            color: '#28A745'
        },
        {
            type: 'Inactive',
            value: totalInactiveCustomerCount,
            color: '#DC3545'
        }
    ];

    const customerAnalytics = customerAnalyticsData.filter(
        customer => customer.value > 0
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Customer analytics fetched successfully',
        data: {
            total_customers: totalCustomerCount,
            customer_analytics: customerAnalytics
        }
    });
});

const getOrderAnalytics = catchAsync(async (req, res) => {
    const totalOrderCount = await prisma.order.count();

    const totalPlaceOrderCount = await prisma.order.count({
        where: {
            status: OrderStatus.PLACED
        }
    });

    const totalConfirmedOrderCount = await prisma.order.count({
        where: {
            status: OrderStatus.CONFIRMED
        }
    });

    const totalShippedOrderCount = await prisma.order.count({
        where: {
            status: OrderStatus.SHIPPED
        }
    });

    const totalPendingOrderCount = await prisma.order.count({
        where: {
            status: OrderStatus.PENDING
        }
    });

    const totalDeliveredOrderCount = await prisma.order.count({
        where: {
            status: OrderStatus.DELIVERED
        }
    });

    const totalCancelledOrderCount = await prisma.order.count({
        where: {
            status: OrderStatus.CANCELLED
        }
    });

    const orderAnalyticsData = [
        {
            type: 'Placed',
            value: totalPlaceOrderCount,
            color: '#808080'
        },
        {
            type: 'Confirmed',
            value: totalConfirmedOrderCount,
            color: '#9ACD32'
        },
        {
            type: 'Shipped',
            value: totalShippedOrderCount,
            color: '#007BFF'
        },
        {
            type: 'Pending',
            value: totalPendingOrderCount,
            color: '#FFD700'
        },
        {
            type: 'Delivered',
            value: totalDeliveredOrderCount,
            color: '#28A745'
        },
        {
            type: 'Cancelled',
            value: totalCancelledOrderCount,
            color: '#DC3545'
        }
    ];

    const orderAnalytics = orderAnalyticsData.filter(
        order => order.value > 0
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Order analytics fetched successfully',
        data: {
            total_orders: totalOrderCount,
            order_analytics: orderAnalytics
        }
    });
});

const getSalesAnalytics = catchAsync(async (req, res) => {
    const sales = await prisma.order.findMany({
        where: { status: OrderStatus.DELIVERED },
        select: { created_at: true }
    });

    // Initialize months with 0 order count
    const monthMap = {
        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0
    };

    // Count orders per month
    sales.forEach(({ created_at }) => {
        const month = new Date(created_at).toLocaleString('en-US', {
            month: 'short'
        });
        monthMap[month] += 1;
    });

    const salesData = Object.keys(monthMap).map(month => ({
        Month: month,
        Sales: monthMap[month]
    }));

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Sales analytics fetched successfully',
        data: { sales: salesData }
    });
});

// New endpoint for general dashboard statistics
const getDashboardStats = catchAsync(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );
    const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
    );
    const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0
    );

    // Current month stats
    const currentMonthOrders = await prisma.order.count({
        where: {
            created_at: {
                gte: startOfMonth
            }
        }
    });

    // Last month stats
    const lastMonthOrders = await prisma.order.count({
        where: {
            created_at: {
                gte: startOfLastMonth,
                lte: endOfLastMonth
            }
        }
    });

    // Calculate growth
    const orderGrowth =
        lastMonthOrders > 0
            ? ((currentMonthOrders - lastMonthOrders) /
                  lastMonthOrders) *
              100
            : 0;

    // Recent customers (last 30 days)
    const recentCustomers = await prisma.user.count({
        where: {
            role: UserRole.CUSTOMER,
            created_at: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
        }
    });

    // Total products
    const totalProducts = await prisma.product.count({
        where: {
            is_deleted: false
        }
    });

    // Total categories
    const totalCategories = await prisma.category.count({
        where: {
            is_published: true // Only count published categories
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Dashboard statistics fetched successfully',
        data: {
            current_month_orders: currentMonthOrders,
            last_month_orders: lastMonthOrders,
            order_growth: orderGrowth,
            recent_customers: recentCustomers,
            total_products: totalProducts,
            total_categories: totalCategories
        }
    });
});

const DashboardController = {
    getCustomerAnalytics,
    getOrderAnalytics,
    getSalesAnalytics,
    getDashboardStats
};

module.exports = DashboardController;
