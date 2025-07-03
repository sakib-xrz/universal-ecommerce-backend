const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');
const {
    uploadToCloudinary,
    deleteFromCloudinary
} = require('../utils/handelFile.js');

const createProductImage = catchAsync(async (req, res) => {
    const { product_id, type } = req.body;
    const file = req.file;

    if (!file) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'File is required'
        );
    }

    const product = await prisma.product.findUnique({
        where: {
            id: product_id
        },
        include: {
            images: true
        }
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const primaryProductImage =
        product.images &&
        product.images.find(image => image.type === 'PRIMARY');

    const secondaryProductImage =
        product.images &&
        product.images.find(image => image.type === 'SECONDARY');

    if (type === 'PRIMARY' && primaryProductImage) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Primary product image already exists'
        );
    }

    if (type === 'SECONDARY' && secondaryProductImage) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Secondary product image already exists'
        );
    }

    const result = await prisma.$transaction(
        async transactionClient => {
            const productImage =
                await transactionClient.productImage.create({
                    data: {
                        product_id,
                        type
                    }
                });

            const fileName = `${Date.now()}-${file.originalname}`;
            const fileType = file.mimetype.split('/').pop();

            const cloudinaryResponse = await uploadToCloudinary(
                file,
                {
                    folder: `/ecommerce/product/${product.sku}`,
                    filename_override: fileName,
                    format: fileType,
                    public_id: productImage.id,
                    overwrite: true,
                    invalidate: true
                }
            );

            await transactionClient.productImage.update({
                where: {
                    id: productImage.id
                },
                data: {
                    image_url: cloudinaryResponse.secure_url
                }
            });

            return {
                ...productImage,
                image_url: cloudinaryResponse.secure_url
            };
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Product image created successfully',
        data: result
    });
});

const createProductImages = catchAsync(async (req, res) => {
    const { product_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Files are required'
        );
    }

    // Fetch the product along with its images
    const product = await prisma.product.findUnique({
        where: { id: product_id },
        include: { images: true }
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    // Use transaction for batch processing of images
    const results = await prisma.$transaction(
        async transactionClient => {
            // Map files to create product images
            const uploadResults = await Promise.all(
                files.map(async file => {
                    // Generate a new productImage record
                    const productImage =
                        await transactionClient.productImage.create({
                            data: {
                                product_id,
                                type: 'EXTRA'
                            }
                        });

                    // Upload image to Cloudinary
                    const cloudinaryResponse =
                        await uploadToCloudinary(file, {
                            folder: `/ecommerce/product/${product.sku}`,
                            filename_override: `${Date.now()}-${file.originalname}`,
                            format: file.mimetype.split('/').pop(),
                            public_id: productImage.id,
                            overwrite: true,
                            invalidate: true
                        });

                    // Update the productImage with the uploaded URL
                    await transactionClient.productImage.update({
                        where: { id: productImage.id },
                        data: {
                            image_url: cloudinaryResponse.secure_url
                        }
                    });

                    // Return the updated product image
                    return {
                        ...productImage,
                        image_url: cloudinaryResponse.secure_url
                    };
                })
            );

            return uploadResults;
        }
    );

    // Send response
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Product images created successfully',
        data: results
    });
});

const deleteProductImage = catchAsync(async (req, res) => {
    const { id } = req.params;

    const productImage = await prisma.productImage.findUnique({
        where: {
            id
        },
        include: {
            product: true
        }
    });

    if (!productImage) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Product image not found'
        );
    }

    await prisma.$transaction(async transactionClient => {
        await deleteFromCloudinary([
            `letzgear/product/${productImage.product.sku}/${id}`
        ]);

        await transactionClient.productImage.delete({
            where: {
                id
            }
        });
    });

    sendResponse(res, {
        statusCode: httpStatus.NO_CONTENT,
        success: true,
        message: 'Product image deleted successfully'
    });
});

const ProductImageController = {
    createProductImage,
    createProductImages,
    deleteProductImage
};

module.exports = ProductImageController;
