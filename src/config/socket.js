const { Server } = require('socket.io');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const config = require('./index.js');
const prisma = require('../utils/prisma.js');
const { UserStatus } = require('@prisma/client');

let io;

const initSocket = server => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001'
            ],
            credentials: true,
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(
                    new Error(
                        'Authentication error: No token provided'
                    )
                );
            }

            // Verify token
            const decoded = jwt.verify(token, config.jwt.secret);

            // Check if user exists and is active
            const user = await prisma.user.findUnique({
                where: {
                    id: decoded.id,
                    email: decoded.email,
                    status: UserStatus.ACTIVE,
                    is_deleted: false
                }
            });

            if (!user) {
                return next(
                    new Error('Authentication error: Invalid user')
                );
            }

            // Attach user info to socket
            socket.userId = user.id;
            socket.userRole = user.role;

            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', socket => {
        console.log(
            `User connected: ${socket.userId} (${socket.userRole})`
        );

        // Join user to their role-based room
        socket.join(`role:${socket.userRole}`);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });

        socket.on('error', error => {
            console.error('Socket error:', error);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error(
            'Socket.io not initialized. Call initSocket first.'
        );
    }
    return io;
};

// Emit new order notification to admin users
const emitNewOrderNotification = orderData => {
    if (!io) {
        console.warn(
            'Socket.io not initialized. Notification not sent.'
        );
        return;
    }

    const notificationData = {
        type: 'NEW_ORDER',
        orderId: orderData.order_id,
        customerName: orderData.customer_name,
        message: `New order #${orderData.order_id} placed by ${orderData.customer_name}`,
        timestamp: new Date().toISOString(),
        data: orderData
    };

    // Emit to all SUPER_ADMIN users
    io.to('role:SUPER_ADMIN').emit(
        'newOrderNotification',
        notificationData
    );

    console.log(
        `New order notification sent for order: ${orderData.order_id}`
    );
};

module.exports = {
    initSocket,
    getIO,
    emitNewOrderNotification
};
