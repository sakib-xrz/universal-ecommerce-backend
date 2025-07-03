const { Router } = require('express');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const NotificationController = require('../../controller/notification.controller.js');

const router = Router();

router
    .route('/')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        NotificationController.getNotifications
    );

router
    .route('/read')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        NotificationController.markAllNotificationsAsRead
    );

router
    .route('/:id/read')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        NotificationController.readNotification
    );

router
    .route('/stats')
    .get(
        authGuard(UserRole.SUPER_ADMIN),
        NotificationController.getNotificationStats
    );

module.exports = router;
