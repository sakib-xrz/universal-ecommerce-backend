const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const router = require('./routes/index.js');
const globalErrorHandler = require('./middlewares/globalErrorHandler.js');
const removeTrashFiles = require('./helpers/removeTrashFiles.js');

const app = express();

// middlewares
app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://purplehousebd.com',
            'https://www.purplehousebd.com',
            'https://admin.purplehousebd.com',
            'https://www.admin.purplehousebd.com'
        ],
        credentials: true
    })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

cron.schedule('0 0 * * *', () => {
    try {
        removeTrashFiles();
    } catch (error) {
        console.log('Error while deleting trash files', error);
    }
});

// routes
app.use('/api/v1', router);

// global error handler
app.use(globalErrorHandler);

// handle not found routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Not Found',
        errorMessages: [
            {
                path: req.originalUrl,
                message: 'API not found'
            }
        ]
    });
    next();
});

module.exports = app;
