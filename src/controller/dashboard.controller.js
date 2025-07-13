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

// Enhanced: Revenue-based analytics - ONLY DELIVERED ORDERS
const getSalesAnalytics = catchAsync(async (req, res) => {
    const sales = await prisma.order.findMany({
        where: { status: OrderStatus.DELIVERED }, // Only delivered orders
        select: {
            created_at: true,
            grand_total: true,
            subtotal: true,
            delivery_charge: true
        }
    });

    // Initialize months with 0 revenue
    const monthMap = {
        Jan: { orders: 0, revenue: 0 },
        Feb: { orders: 0, revenue: 0 },
        Mar: { orders: 0, revenue: 0 },
        Apr: { orders: 0, revenue: 0 },
        May: { orders: 0, revenue: 0 },
        Jun: { orders: 0, revenue: 0 },
        Jul: { orders: 0, revenue: 0 },
        Aug: { orders: 0, revenue: 0 },
        Sep: { orders: 0, revenue: 0 },
        Oct: { orders: 0, revenue: 0 },
        Nov: { orders: 0, revenue: 0 },
        Dec: { orders: 0, revenue: 0 }
    };

    // Count orders and sum revenue per month
    sales.forEach(
        ({ created_at, grand_total, subtotal, delivery_charge }) => {
            const month = new Date(created_at).toLocaleString(
                'en-US',
                {
                    month: 'short'
                }
            );
            monthMap[month].orders += 1;
            monthMap[month].revenue +=
                grand_total ||
                (subtotal || 0) + (delivery_charge || 0);
        }
    );

    const salesData = Object.keys(monthMap).map(month => ({
        Month: month,
        Orders: monthMap[month].orders,
        Revenue: Math.round(monthMap[month].revenue * 100) / 100
    }));

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Sales analytics fetched successfully',
        data: { sales: salesData }
    });
});

// Enhanced: More comprehensive dashboard statistics - ONLY DELIVERED ORDERS FOR REVENUE
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

    // Current month orders (all statuses for order count)
    const currentMonthOrders = await prisma.order.count({
        where: {
            created_at: { gte: startOfMonth },
            status: OrderStatus.DELIVERED
        }
    });

    // Current month revenue (ONLY DELIVERED orders)
    const currentMonthRevenue = await prisma.order.aggregate({
        where: {
            created_at: { gte: startOfMonth },
            status: OrderStatus.DELIVERED // Only delivered orders
        },
        _sum: { grand_total: true }
    });

    // Last month orders (all statuses for order count)
    const lastMonthOrders = await prisma.order.count({
        where: {
            created_at: {
                gte: startOfLastMonth,
                lte: endOfLastMonth
            },
            status: OrderStatus.DELIVERED
        }
    });

    // Last month revenue (ONLY DELIVERED orders)
    const lastMonthRevenue = await prisma.order.aggregate({
        where: {
            created_at: {
                gte: startOfLastMonth,
                lte: endOfLastMonth
            },
            status: OrderStatus.DELIVERED // Only delivered orders
        },
        _sum: { grand_total: true }
    });

    // Calculate growth
    const orderGrowth =
        lastMonthOrders > 0
            ? ((currentMonthOrders - lastMonthOrders) /
                  lastMonthOrders) *
              100
            : 0;

    const revenueGrowth =
        (lastMonthRevenue._sum.grand_total || 0) > 0
            ? (((currentMonthRevenue._sum.grand_total || 0) -
                  (lastMonthRevenue._sum.grand_total || 0)) /
                  (lastMonthRevenue._sum.grand_total || 0)) *
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
        where: { is_deleted: false }
    });

    // Total categories
    const totalCategories = await prisma.category.count({
        where: { is_published: true }
    });

    // Total lifetime revenue (ONLY DELIVERED orders)
    const totalRevenue = await prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED }, // Only delivered orders
        _sum: { grand_total: true }
    });

    // Average order value (ONLY DELIVERED orders)
    const avgOrderValue = await prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED }, // Only delivered orders
        _avg: { grand_total: true }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Dashboard statistics fetched successfully',
        data: {
            current_month_orders: currentMonthOrders,
            last_month_orders: lastMonthOrders,
            current_month_revenue:
                Math.round(
                    (currentMonthRevenue._sum.grand_total || 0) * 100
                ) / 100,
            last_month_revenue:
                Math.round(
                    (lastMonthRevenue._sum.grand_total || 0) * 100
                ) / 100,
            order_growth: Math.round(orderGrowth * 100) / 100,
            revenue_growth: Math.round(revenueGrowth * 100) / 100,
            recent_customers: recentCustomers,
            total_products: totalProducts,
            total_categories: totalCategories,
            total_lifetime_revenue:
                Math.round(
                    (totalRevenue._sum.grand_total || 0) * 100
                ) / 100,
            average_order_value:
                Math.round(
                    (avgOrderValue._avg.grand_total || 0) * 100
                ) / 100
        }
    });
});

// NEW: Inventory management insights
const getInventoryInsights = catchAsync(async (req, res) => {
    // Low stock products (stock < 10)
    const lowStockProducts = await prisma.productVariant.findMany({
        where: {
            stock: { lt: 10 },
            product: { is_deleted: false, is_published: true }
        },
        include: {
            product: { select: { id: true, name: true, sku: true } },
            size: { select: { name: true } }
        },
        orderBy: { stock: 'asc' },
        take: 10
    });

    // Out of stock products
    const outOfStockCount = await prisma.productVariant.count({
        where: {
            stock: 0,
            product: { is_deleted: false, is_published: true }
        }
    });

    // Products with no variants
    const productsWithoutVariants = await prisma.product.count({
        where: {
            is_deleted: false,
            is_published: true,
            variants: { none: {} }
        }
    });

    // Total stock value (using buy_price)
    const totalStockValue = await prisma.$queryRaw`
        SELECT SUM(pv.stock * p.buy_price) as total_value
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE p.is_deleted = false AND p.is_published = true
    `;

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Inventory insights fetched successfully',
        data: {
            low_stock_products: lowStockProducts,
            out_of_stock_count: outOfStockCount,
            products_without_variants: productsWithoutVariants,
            total_stock_value:
                Math.round(
                    (totalStockValue[0]?.total_value || 0) * 100
                ) / 100,
            low_stock_alerts: lowStockProducts.length
        }
    });
});

// NEW: Top performing products - ONLY DELIVERED ORDERS
const getTopPerformingProducts = catchAsync(async (req, res) => {
    // Top selling products by quantity (ONLY DELIVERED orders)
    const topSellingProducts = await prisma.orderItem.groupBy({
        by: ['product_id'],
        where: {
            order: { status: OrderStatus.DELIVERED } // Only delivered orders
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
    });

    // Get product details for top selling
    const topSellingWithDetails = await Promise.all(
        topSellingProducts.map(async item => {
            const product = await prisma.product.findUnique({
                where: { id: item.product_id },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    sell_price: true,
                    category: { select: { name: true } }
                }
            });
            return {
                ...product,
                total_quantity_sold: item._sum.quantity,
                total_orders: item._count.id,
                total_revenue:
                    Math.round(
                        item._sum.quantity * product.sell_price * 100
                    ) / 100
            };
        })
    );

    // Top revenue generating products (ONLY DELIVERED orders)
    const topRevenueProducts = await prisma.orderItem.groupBy({
        by: ['product_id'],
        where: {
            order: { status: OrderStatus.DELIVERED } // Only delivered orders
        },
        _sum: { total_price: true },
        orderBy: { _sum: { total_price: 'desc' } },
        take: 10
    });

    const topRevenueWithDetails = await Promise.all(
        topRevenueProducts.map(async item => {
            const product = await prisma.product.findUnique({
                where: { id: item.product_id },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    category: { select: { name: true } }
                }
            });
            return {
                ...product,
                total_revenue:
                    Math.round((item._sum.total_price || 0) * 100) /
                    100
            };
        })
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Top performing products fetched successfully',
        data: {
            top_selling_products: topSellingWithDetails,
            top_revenue_products: topRevenueWithDetails
        }
    });
});

// NEW: Profit analysis - ONLY DELIVERED ORDERS
const getProfitAnalysis = catchAsync(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    // Calculate profit for delivered orders ONLY using actual transaction data
    const profitData = await prisma.$queryRaw`
        SELECT 
            SUM(oi.total_price - (oi.quantity * (p.buy_price + p.cost_price))) as total_profit,
            SUM(oi.total_price) as total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status = 'DELIVERED'
    `;

    // Monthly profit (ONLY DELIVERED orders)
    const monthlyProfitData = await prisma.$queryRaw`
        SELECT 
            SUM(oi.total_price - (oi.quantity * (p.buy_price + p.cost_price))) as monthly_profit,
            SUM(oi.total_price) as monthly_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status = 'DELIVERED' AND o.created_at >= ${startOfMonth}
    `;

    const totalProfit = profitData[0]?.total_profit || 0;
    const totalRevenue = profitData[0]?.total_revenue || 0;
    const monthlyProfit = monthlyProfitData[0]?.monthly_profit || 0;
    const monthlyRevenue = monthlyProfitData[0]?.monthly_revenue || 0;

    // Calculate profit margins
    const profitMargin =
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const monthlyProfitMargin =
        monthlyRevenue > 0
            ? (monthlyProfit / monthlyRevenue) * 100
            : 0;

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Profit analysis fetched successfully',
        data: {
            total_profit: Math.round(totalProfit * 100) / 100,
            monthly_profit: Math.round(monthlyProfit * 100) / 100,
            profit_margin: Math.round(profitMargin * 100) / 100,
            monthly_profit_margin:
                Math.round(monthlyProfitMargin * 100) / 100
        }
    });
});

// NEW: Recent activity feed (shows all order statuses for activity monitoring)
const getRecentActivity = catchAsync(async (req, res) => {
    // Recent orders (all statuses for activity monitoring)
    const recentOrders = await prisma.order.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
            id: true,
            order_id: true,
            customer_name: true,
            status: true,
            grand_total: true,
            created_at: true,
            platform: true
        }
    });

    // Recent customers
    const recentCustomers = await prisma.user.findMany({
        where: { role: UserRole.CUSTOMER },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
            profile: { select: { name: true, email: true } }
        }
    });

    // Pending notifications
    const pendingNotifications = await prisma.notification.count({
        where: { is_read: false }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Recent activity fetched successfully',
        data: {
            recent_orders: recentOrders,
            recent_customers: recentCustomers,
            pending_notifications: pendingNotifications
        }
    });
});

const DashboardController = {
    getCustomerAnalytics,
    getOrderAnalytics,
    getSalesAnalytics,
    getDashboardStats,
    getInventoryInsights,
    getTopPerformingProducts,
    getProfitAnalysis,
    getRecentActivity
};

module.exports = DashboardController;
