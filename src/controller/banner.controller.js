const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');
const {
    uploadToCloudinary,
    deleteFromCloudinary,
    getCloudinaryIdFromUrl
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
            image_url: result.secure_url
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

const updateBannerImage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'File is required'
        );
    }

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

    //  need a utils function to get the cloudinary id from the image url
    const cloudinaryId = getCloudinaryIdFromUrl(
        bannerImage.image_url
    );

    // first delete the old image from cloudinary then upload the new image
    await deleteFromCloudinary(cloudinaryId);

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

    const updatedBannerImage = await prisma.banner.update({
        where: {
            id
        },
        data: {
            image_url: result.secure_url
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Banner image updated successfully',
        data: updatedBannerImage
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
    deleteBannerImage,
    updateBannerImage
};

module.exports = BannerController;
