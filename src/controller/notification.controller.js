const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const ApiError = require('../error/ApiError.js');
const pick = require('../utils/pick.js');
const calculatePagination = require('../helpers/calculatePagination.js');

const getNotifications = catchAsync(async (req, res) => {
    const notificationFilterableFields = ['is_read'];

    const filters = pick(req.query, notificationFilterableFields);
    const options = pick(req.query, [
        'limit',
        'page',
        'sort_by',
        'sort_order'
    ]);

    const { page, limit, skip } = calculatePagination(options);
    const { ...filterData } = filters;

    const andConditions = [];

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

    const notifications = await prisma.notification.findMany({
        where: whereConditions,
        include: {
            order: {
                select: {
                    customer_name: true,
                    order_id: true
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

    const total = await prisma.notification.count({
        where: whereConditions
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Notifications fetched successfully',
        meta: {
            total,
            page,
            limit
        },
        data: notifications
    });
});

const readNotification = catchAsync(async (req, res) => {
    const notificationId = req.params.id;

    const notification = await prisma.notification.findUnique({
        where: {
            id: notificationId
        }
    });

    if (!notification) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Notification not found'
        );
    }

    const updatedNotification = await prisma.notification.update({
        where: {
            id: notificationId
        },
        data: {
            is_read: true
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Notification read successfully',
        data: updatedNotification
    });
});

const getNotificationStats = catchAsync(async (_req, res) => {
    const unreadNotificationsCount = await prisma.notification.count({
        where: {
            is_read: false
        }
    });

    const totalNotificationsCount = await prisma.notification.count();

    const readNotificationsCount =
        totalNotificationsCount - unreadNotificationsCount;

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Unread count fetched successfully',
        data: {
            total: totalNotificationsCount,
            read: readNotificationsCount,
            unread: unreadNotificationsCount
        }
    });
});

const markAllNotificationsAsRead = catchAsync(async (_req, res) => {
    await prisma.notification.updateMany({
        where: {
            is_read: false
        },
        data: {
            is_read: true
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'All notifications marked as read successfully'
    });
});

const NotificationController = {
    getNotifications,
    readNotification,
    getNotificationStats,
    markAllNotificationsAsRead
};

module.exports = NotificationController;
