const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');

const getCart = catchAsync(async (req, res) => {
    const cartItems = req.body.cart_items;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Cart fetched successfully',
            data: {
                products: [],
                total_items: 0,
                subtotal: 0
            }
        });
    }

    const productMap = new Map(
        cartItems.map(item => [item.id, item.variant])
    );

    const products = await prisma.product.findMany({
        where: {
            id: { in: [...productMap.keys()] },
            is_deleted: false,
            is_published: true,
            variants: {
                some: { id: { in: [...productMap.values()] } }
            }
        },
        select: {
            id: true,
            name: true,
            sell_price: true,
            discount: true,
            discount_type: true,
            images: { select: { image_url: true, type: true } },
            variants: {
                where: { id: { in: [...productMap.values()] } },
                select: {
                    id: true,
                    size: { select: { id: true, name: true } },
                    stock: true
                }
            }
        }
    });

    const calculateDiscountedPrice = (price, discount, type) =>
        discount
            ? type === 'PERCENTAGE'
                ? price * (1 - discount / 100)
                : price - discount
            : price;

    let subtotal = 0;

    const transformProducts = products.map(product => {
        const variantId = productMap.get(product.id);
        const variant = product.variants.find(
            v => v.id === variantId
        );
        const cartItem = cartItems.find(
            item =>
                item.id === product.id && item.variant === variantId
        );
        const quantity = cartItem?.quantity || 0;
        const hasStock = variant?.stock >= quantity;

        const unitPrice = calculateDiscountedPrice(
            product.sell_price,
            product.discount,
            product.discount_type
        );
        const totalPrice = hasStock ? unitPrice * quantity : 0;

        subtotal += totalPrice;

        return {
            id: product.id,
            name: product.name,
            unit_price: unitPrice,
            total_price: totalPrice,
            image_url:
                product.images.find(img => img.type === 'PRIMARY')
                    ?.image_url || '',
            has_stock: hasStock,
            variant,
            quantity
        };
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Cart fetched successfully',
        data: {
            products: transformProducts,
            total_items: transformProducts.length,
            subtotal
        }
    });
});

const CartController = {
    getCart
};

module.exports = CartController;
