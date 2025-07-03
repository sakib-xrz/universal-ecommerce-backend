const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');

const createProductVariant = catchAsync(async (req, res) => {
    const { product_id, size_id, stock } = req.body;

    const product = await prisma.product.findUnique({
        where: { id: product_id },
        include: { variants: true }
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    let size = null;
    if (size_id) {
        size = await prisma.size.findUnique({
            where: { id: size_id }
        });

        if (!size) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                'Size not found'
            );
        }

        const variantExists = product.variants.some(
            variant => variant.size_id === size_id
        );

        if (variantExists) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'Variant already exists'
            );
        }
    }

    const productVariant = await prisma.productVariant.create({
        data: {
            product_id: product_id,
            size_id: size_id || null,
            stock
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: 'Product variant created successfully',
        data: productVariant
    });
});

const updateProductVariant = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    const productVariant = await prisma.productVariant.findUnique({
        where: { id }
    });

    if (!productVariant) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Product variant not found'
        );
    }

    const updatedProductVariant = await prisma.productVariant.update({
        where: { id },
        data: {
            stock
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Product variant updated successfully',
        data: updatedProductVariant
    });
});

const deleteProductVariant = catchAsync(async (req, res) => {
    const { id } = req.params;

    const productVariant = await prisma.productVariant.findUnique({
        where: { id }
    });

    if (!productVariant) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Product variant not found'
        );
    }

    await prisma.productVariant.delete({
        where: { id }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.NO_CONTENT,
        message: 'Product variant deleted successfully'
    });
});

const ProductVariantController = {
    createProductVariant,
    updateProductVariant,
    deleteProductVariant
};

module.exports = ProductVariantController;
