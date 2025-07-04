const { Server } = require('socket.io');

let io;

const initSocket = server => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', socket => {
        console.log('✅ User connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);
        });
    });

    console.log('🚀 Socket.io server initialized');
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

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

    // Emit to ALL connected clients
    io.emit('newOrderNotification', notificationData);

    console.log(
        '📢 Notification sent for order:',
        orderData.order_id
    );
};

module.exports = {
    initSocket,
    getIO,
    emitNewOrderNotification
};
