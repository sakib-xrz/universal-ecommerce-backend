const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');
const { uploadToCloudinary } = require('../utils/handelFile.js');

const getMyProfile = catchAsync(async (req, res) => {
    const { user } = req;

    const myProfile = await prisma.profile.findUnique({
        where: {
            email: user.email
        },
        include: {
            user: true
        }
    });

    if (!myProfile) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
    }

    const userData = {
        profile_id: myProfile.id,
        user_id: myProfile.user_id,
        email: myProfile.email,
        name: myProfile.name,
        phone: myProfile.phone,
        image: myProfile.image,
        role: myProfile.user.role,
        status: myProfile.user.status
    };

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile data retrieved successfully',
        data: userData
    });
});

const changeImage = catchAsync(async (req, res) => {
    const { user } = req;
    const { file } = req;

    if (!file) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Please provide an image file'
        );
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const fileType = file.mimetype.split('/').pop();

    const cloudinaryResponse = await uploadToCloudinary(file, {
        folder: `/ecommerce/user`,
        filename_override: fileName,
        format: fileType,
        public_id: user.id,
        overwrite: true,
        invalidate: true
    });

    const updateProfile = await prisma.profile.update({
        where: {
            email: user.email
        },
        data: {
            image: cloudinaryResponse?.secure_url
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile photo updated successfully',
        data: updateProfile
    });
});

const updateProfile = catchAsync(async (req, res) => {
    const { user } = req;

    const isUserExist = await prisma.profile.findUnique({
        where: {
            email: user.email
        }
    });

    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
    }

    const updateProfile = await prisma.profile.update({
        where: {
            email: user.email
        },
        data: {
            name: req.body.name || isUserExist.name,
            phone: req.body.phone || isUserExist.phone
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: updateProfile
    });
});

const ProfileController = {
    getMyProfile,
    changeImage,
    updateProfile
};

module.exports = ProfileController;
