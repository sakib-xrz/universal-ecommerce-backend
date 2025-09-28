const { Router } = require('express');

const authRoutes = require('../apis/auth/index.js');
const userRoutes = require('../apis/user/index.js');
const profileRoutes = require('../apis/profile/index.js');
const categoryRoutes = require('../apis/category/index.js');
const sizeRoutes = require('../apis/size/index.js');
const productRoutes = require('../apis/product/index.js');
const productImageRoutes = require('../apis/product-image/index.js');
const productVariantRoutes = require('../apis/product-variant/index.js');
const orderRoutes = require('../apis/order/index.js');
const notificationRoutes = require('../apis/notification/index.js');
const paymentRoutes = require('../apis/payment/index.js');
const menuRoutes = require('../apis/menu/index.js');
const bannerRoutes = require('../apis/banner/index.js');
const cartRoutes = require('../apis/cart/index.js');
const dashboardRoutes = require('../apis/dashboard/index.js');
const featuredCategoryRoutes = require('../apis/featured-category/index.js');
const settingRoutes = require('../apis/setting/index.js');
const staticPageRoutes = require('../apis/static-page/index.js');
const pathaoRoutes = require('../apis/pathao/index.js');

const router = Router();

const routes = [
    {
        path: '/auth',
        route: authRoutes
    },
    {
        path: '/users',
        route: userRoutes
    },
    {
        path: '/profile',
        route: profileRoutes
    },
    {
        path: '/categories',
        route: categoryRoutes
    },
    {
        path: '/sizes',
        route: sizeRoutes
    },
    {
        path: '/products',
        route: productRoutes
    },
    {
        path: '/product-images',
        route: productImageRoutes
    },
    {
        path: '/product-variants',
        route: productVariantRoutes
    },
    {
        path: '/orders',
        route: orderRoutes
    },
    {
        path: '/notifications',
        route: notificationRoutes
    },
    {
        path: '/payments',
        route: paymentRoutes
    },
    {
        path: '/menus',
        route: menuRoutes
    },
    {
        path: '/banners',
        route: bannerRoutes
    },
    {
        path: '/cart',
        route: cartRoutes
    },
    {
        path: '/dashboard',
        route: dashboardRoutes
    },
    {
        path: '/featured-categories',
        route: featuredCategoryRoutes
    },
    {
        path: '/settings',
        route: settingRoutes
    },
    {
        path: '/static-pages',
        route: staticPageRoutes
    },
    {
        path: '/pathao',
        route: pathaoRoutes
    }
];

routes.forEach(route => {
    router.use(route.path, route.route);
});

module.exports = router;
