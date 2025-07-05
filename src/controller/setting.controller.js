const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const ApiError = require('../error/ApiError.js');
const {
    uploadToCloudinary,
    deleteFromCloudinary,
    getCloudinaryIdFromUrl
} = require('../utils/handelFile.js');

// Create Setting (should be only one setting record)
const createSetting = catchAsync(async (req, res) => {
    const { file } = req;
    const {
        address,
        phone,
        email,
        facebook,
        instagram,
        title,
        description,
        keywords,
        google_analytics_id,
        google_tag_manager_id,
        facebook_pixel_id
    } = req.body;

    // Check if setting already exists
    const existingSetting = await prisma.setting.findFirst();
    if (existingSetting) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Setting already exists. Use update instead.'
        );
    }

    if (!file) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Logo file is required'
        );
    }

    const result = await prisma.$transaction(
        async transactionClient => {
            // Create setting first
            const setting = await transactionClient.setting.create({
                data: {
                    logo: '', // Will be updated after file upload
                    address,
                    phone,
                    email,
                    facebook,
                    instagram,
                    title,
                    description,
                    keywords,
                    google_analytics_id,
                    google_tag_manager_id,
                    facebook_pixel_id
                }
            });

            // Upload logo to Cloudinary
            const fileName = `${Date.now()}-${file.originalname}`;
            const fileType = file.mimetype.split('/').pop();

            const cloudinaryResponse = await uploadToCloudinary(
                file,
                {
                    folder: `/ecommerce/setting`,
                    filename_override: fileName,
                    format: fileType,
                    public_id: setting.id,
                    overwrite: true,
                    invalidate: true
                }
            );

            // Update setting with logo URL
            await transactionClient.setting.update({
                where: {
                    id: setting.id
                },
                data: {
                    logo: cloudinaryResponse.secure_url
                }
            });

            setting.logo = cloudinaryResponse.secure_url;
            return setting;
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Setting created successfully',
        data: result
    });
});

// Get Setting (single setting)
const getSetting = catchAsync(async (req, res) => {
    const setting = await prisma.setting.findFirst();

    if (!setting) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Setting retrieved successfully',
        data: setting
    });
});

// Update Setting
const updateSetting = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { file } = req;
    const {
        address,
        phone,
        email,
        facebook,
        instagram,
        title,
        description,
        keywords,
        google_analytics_id,
        google_tag_manager_id,
        facebook_pixel_id
    } = req.body;

    const existingSetting = await prisma.setting.findUnique({
        where: { id }
    });

    if (!existingSetting) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
    }

    const result = await prisma.$transaction(
        async transactionClient => {
            let logoUrl = existingSetting.logo;

            // If new logo file is provided, upload it
            if (file) {
                // Delete old logo from Cloudinary if it exists
                if (existingSetting.logo) {
                    try {
                        const cloudinaryId = getCloudinaryIdFromUrl(
                            existingSetting.logo
                        );
                        await deleteFromCloudinary(cloudinaryId);
                    } catch (error) {
                        console.warn(
                            'Failed to delete old logo from Cloudinary:',
                            error
                        );
                    }
                }

                // Upload new logo
                const fileName = `${Date.now()}-${file.originalname}`;
                const fileType = file.mimetype.split('/').pop();

                const cloudinaryResponse = await uploadToCloudinary(
                    file,
                    {
                        folder: `/ecommerce/setting`,
                        filename_override: fileName,
                        format: fileType,
                        public_id: id,
                        overwrite: true,
                        invalidate: true
                    }
                );

                logoUrl = cloudinaryResponse.secure_url;
            }

            // Update setting
            const setting = await transactionClient.setting.update({
                where: { id },
                data: {
                    logo: logoUrl,
                    address,
                    phone,
                    email,
                    facebook,
                    instagram,
                    title,
                    description,
                    keywords,
                    google_analytics_id,
                    google_tag_manager_id,
                    facebook_pixel_id
                }
            });

            return setting;
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Setting updated successfully',
        data: result
    });
});

// Delete Setting
const deleteSetting = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingSetting = await prisma.setting.findUnique({
        where: { id }
    });

    if (!existingSetting) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
    }

    // Delete logo from Cloudinary if it exists
    if (existingSetting.logo) {
        try {
            const cloudinaryId = getCloudinaryIdFromUrl(
                existingSetting.logo
            );
            await deleteFromCloudinary(cloudinaryId);
        } catch (error) {
            console.warn(
                'Failed to delete logo from Cloudinary:',
                error
            );
        }
    }

    await prisma.setting.delete({
        where: { id }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Setting deleted successfully'
    });
});

module.exports = {
    createSetting,
    getSetting,
    updateSetting,
    deleteSetting
};
