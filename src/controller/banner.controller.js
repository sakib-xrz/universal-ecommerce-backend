const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');
const {
    uploadToCloudinary,
    deleteFromCloudinary
} = require('../utils/handelFile.js');

const createBannerImage = catchAsync(async (req, res) => {
    const file = req.file;

    if (!file) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'File is required'
        );
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const fileType = file.mimetype.split('/').pop();

    const options = {
        folder: '/ecommerce/banner',
        filename_override: fileName,
        format: fileType,
        overwrite: true,
        invalidate: true
    };

    const result = await uploadToCloudinary(file, options);

    const bannerImage = await prisma.banner.create({
        data: {
            image_url: result.secure_url,
            cloudinary_id: result.public_id
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Banner image created successfully',
        data: bannerImage
    });
});

const getBannerImages = catchAsync(async (_req, res) => {
    const bannerImages = await prisma.banner.findMany({
        select: {
            id: true,
            image_url: true
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: bannerImages
    });
});

const deleteBannerImage = catchAsync(async (req, res) => {
    const { id } = req.params;

    const bannerImage = await prisma.banner.findUnique({
        where: {
            id
        }
    });

    if (!bannerImage) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Banner image not found'
        );
    }

    await deleteFromCloudinary(bannerImage.cloudinary_id);

    await prisma.banner.delete({
        where: {
            id
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Banner image deleted successfully'
    });
});

const BannerController = {
    createBannerImage,
    getBannerImages,
    deleteBannerImage
};

module.exports = BannerController;
