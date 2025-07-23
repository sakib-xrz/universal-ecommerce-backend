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
    const { files } = req;
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

    const logoFile = files?.logo?.[0];
    const faviconFile = files?.favicon?.[0];

    if (!logoFile) {
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
                    favicon: '', // Will be updated after file upload
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
            const logoFileName = `${Date.now()}-${logoFile.originalname}`;
            const logoFileType = logoFile.mimetype.split('/').pop();

            const logoCloudinaryResponse = await uploadToCloudinary(
                logoFile,
                {
                    folder: `/ecommerce/setting`,
                    filename_override: logoFileName,
                    format: logoFileType,
                    public_id: `${setting.id}-logo`,
                    overwrite: true,
                    invalidate: true
                }
            );

            let faviconUrl = '';
            // Upload favicon to Cloudinary if provided
            if (faviconFile) {
                const faviconFileName = `${Date.now()}-${faviconFile.originalname}`;
                const faviconFileType = faviconFile.mimetype
                    .split('/')
                    .pop();

                const faviconCloudinaryResponse =
                    await uploadToCloudinary(faviconFile, {
                        folder: `/ecommerce/setting`,
                        filename_override: faviconFileName,
                        format: faviconFileType,
                        public_id: `${setting.id}-favicon`,
                        overwrite: true,
                        invalidate: true
                    });
                faviconUrl = faviconCloudinaryResponse.secure_url;
            }

            // Update setting with logo and favicon URLs
            await transactionClient.setting.update({
                where: {
                    id: setting.id
                },
                data: {
                    logo: logoCloudinaryResponse.secure_url,
                    favicon: faviconUrl
                }
            });

            setting.logo = logoCloudinaryResponse.secure_url;
            setting.favicon = faviconUrl;
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
    const { files } = req;
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
        facebook_pixel_id,
        delivery_charge_inside_dhaka,
        delivery_charge_outside_dhaka
    } = req.body;

    const existingSetting = await prisma.setting.findUnique({
        where: { id }
    });

    if (!existingSetting) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
    }

    const logoFile = files?.logo?.[0];
    const faviconFile = files?.favicon?.[0];

    const result = await prisma.$transaction(
        async transactionClient => {
            let logoUrl = existingSetting.logo;
            let faviconUrl = existingSetting.favicon;

            // If new logo file is provided, upload it
            if (logoFile) {
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
                const logoFileName = `${Date.now()}-${logoFile.originalname}`;
                const logoFileType = logoFile.mimetype
                    .split('/')
                    .pop();

                const logoCloudinaryResponse =
                    await uploadToCloudinary(logoFile, {
                        folder: `/ecommerce/setting`,
                        filename_override: logoFileName,
                        format: logoFileType,
                        public_id: `${id}-logo`,
                        overwrite: true,
                        invalidate: true
                    });

                logoUrl = logoCloudinaryResponse.secure_url;
            }

            // If new favicon file is provided, upload it
            if (faviconFile) {
                // Delete old favicon from Cloudinary if it exists
                if (existingSetting.favicon) {
                    try {
                        const cloudinaryId = getCloudinaryIdFromUrl(
                            existingSetting.favicon
                        );
                        await deleteFromCloudinary(cloudinaryId);
                    } catch (error) {
                        console.warn(
                            'Failed to delete old favicon from Cloudinary:',
                            error
                        );
                    }
                }

                // Upload new favicon
                const faviconFileName = `${Date.now()}-${faviconFile.originalname}`;
                const faviconFileType = faviconFile.mimetype
                    .split('/')
                    .pop();

                const faviconCloudinaryResponse =
                    await uploadToCloudinary(faviconFile, {
                        folder: `/ecommerce/setting`,
                        filename_override: faviconFileName,
                        format: faviconFileType,
                        public_id: `${id}-favicon`,
                        overwrite: true,
                        invalidate: true
                    });

                faviconUrl = faviconCloudinaryResponse.secure_url;
            }

            // Update setting
            const setting = await transactionClient.setting.update({
                where: { id },
                data: {
                    logo: logoUrl,
                    favicon: faviconUrl,
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
                    facebook_pixel_id,
                    delivery_charge_inside_dhaka: Number(
                        delivery_charge_inside_dhaka
                    ),
                    delivery_charge_outside_dhaka: Number(
                        delivery_charge_outside_dhaka
                    )
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

    // Delete favicon from Cloudinary if it exists
    if (existingSetting.favicon) {
        try {
            const cloudinaryId = getCloudinaryIdFromUrl(
                existingSetting.favicon
            );
            await deleteFromCloudinary(cloudinaryId);
        } catch (error) {
            console.warn(
                'Failed to delete favicon from Cloudinary:',
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
