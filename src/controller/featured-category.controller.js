const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const ApiError = require('../error/ApiError.js');
const pick = require('../utils/pick.js');
const calculatePagination = require('../helpers/calculatePagination.js');
const {
    uploadToCloudinary,
    deleteFromCloudinary,
    getCloudinaryIdFromUrl
} = require('../utils/handelFile.js');

const createFeaturedCategory = catchAsync(async (req, res) => {
    const { file } = req;
    const { category_id, title, youtube_video_link } = req.body;

    // Check if category exists and is published
    const category = await prisma.category.findUnique({
        where: { id: category_id }
    });

    if (!category) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Category not found'
        );
    }

    if (!category.is_published) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Cannot create featured category for unpublished category'
        );
    }

    // Check if featured category already exists for this category
    const existingFeaturedCategory =
        await prisma.featuredCategory.findFirst({
            where: { category_id }
        });

    if (existingFeaturedCategory) {
        throw new ApiError(
            httpStatus.CONFLICT,
            'Featured category already exists for this category'
        );
    }

    const result = await prisma.$transaction(
        async transactionClient => {
            // Get the next sort_order value
            const maxSortOrder =
                await transactionClient.featuredCategory.findFirst({
                    orderBy: {
                        sort_order: 'desc'
                    },
                    select: {
                        sort_order: true
                    }
                });

            const nextSortOrder = (maxSortOrder?.sort_order || 0) + 1;

            const featuredCategory =
                await transactionClient.featuredCategory.create({
                    data: {
                        category_id,
                        title,
                        youtube_video_link,
                        sort_order: nextSortOrder // Auto-assign sort order
                    },
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                image: true
                            }
                        }
                    }
                });

            if (file) {
                const fileName = `${Date.now()}-${file.originalname}`;
                const fileType = file.mimetype.split('/').pop();

                const cloudinaryResponse = await uploadToCloudinary(
                    file,
                    {
                        folder: '/ecommerce/featured-category',
                        filename_override: fileName,
                        format: fileType,
                        public_id: featuredCategory.id,
                        overwrite: true,
                        invalidate: true
                    }
                );

                await transactionClient.featuredCategory.update({
                    where: {
                        id: featuredCategory.id
                    },
                    data: {
                        banner_url: cloudinaryResponse.secure_url
                    }
                });

                featuredCategory.banner_url =
                    cloudinaryResponse.secure_url;
            }

            return featuredCategory;
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Featured category created successfully',
        data: result
    });
});

const getFeaturedCategories = catchAsync(async (req, res) => {
    const featuredCategoryFilterableFields = [
        'search',
        'category_id'
    ];
    const featuredCategorySearchableFields = ['title'];

    const filters = pick(req.query, featuredCategoryFilterableFields);
    const options = pick(req.query, [
        'limit',
        'page',
        'sort_by',
        'sort_order'
    ]);

    const { page, limit, skip } = calculatePagination(options);
    const { search, ...filterData } = filters;

    const andConditions = [];

    if (search) {
        andConditions.push({
            OR: featuredCategorySearchableFields.map(field => ({
                [field]: {
                    contains: search,
                    mode: 'insensitive'
                }
            }))
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: filterData[key]
                }
            }))
        });
    }

    const whereConditions =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.featuredCategory.findMany({
        where: whereConditions,
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true,
                    is_published: true
                }
            }
        },
        skip,
        take: limit,
        orderBy: [
            {
                sort_order: 'asc'
            },
            {
                created_at: 'asc'
            }
        ]
    });

    const total = await prisma.featuredCategory.count({
        where: whereConditions
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Featured categories retrieved successfully',
        meta: {
            total,
            page,
            limit
        },
        data: result
    });
});

const getFeaturedCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await prisma.featuredCategory.findUnique({
        where: { id },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true
                }
            }
        }
    });

    if (!result) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Featured category not found'
        );
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: result
    });
});

const updateFeaturedCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { file } = req;
    const { category_id, title, youtube_video_link } = req.body;

    const featuredCategory = await prisma.featuredCategory.findUnique(
        {
            where: { id }
        }
    );

    if (!featuredCategory) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Featured category not found'
        );
    }

    // Check if new category exists (if category_id is being updated)
    if (category_id && category_id !== featuredCategory.category_id) {
        const category = await prisma.category.findUnique({
            where: { id: category_id }
        });

        if (!category) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                'Category not found'
            );
        }
    }

    const result = await prisma.$transaction(
        async transactionClient => {
            let updateData = {};

            if (category_id) updateData.category_id = category_id;
            if (title) updateData.title = title;
            if (youtube_video_link !== undefined) {
                updateData.youtube_video_link = youtube_video_link;
            }

            if (file) {
                // Delete old banner if exists
                if (featuredCategory.banner_url) {
                    const cloudinaryId = getCloudinaryIdFromUrl(
                        featuredCategory.banner_url
                    );
                    await deleteFromCloudinary(cloudinaryId);
                }

                const fileName = `${Date.now()}-${file.originalname}`;
                const fileType = file.mimetype.split('/').pop();

                const cloudinaryResponse = await uploadToCloudinary(
                    file,
                    {
                        folder: '/ecommerce/featured-category',
                        filename_override: fileName,
                        format: fileType,
                        public_id: featuredCategory.id,
                        overwrite: true,
                        invalidate: true
                    }
                );

                updateData.banner_url = cloudinaryResponse.secure_url;
            }

            const updatedFeaturedCategory =
                await transactionClient.featuredCategory.update({
                    where: { id },
                    data: updateData,
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                image: true
                            }
                        }
                    }
                });

            return updatedFeaturedCategory;
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Featured category updated successfully',
        data: result
    });
});

const deleteFeaturedCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const featuredCategory = await prisma.featuredCategory.findUnique(
        {
            where: { id }
        }
    );

    if (!featuredCategory) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Featured category not found'
        );
    }

    await prisma.$transaction(async transactionClient => {
        // Delete banner from cloudinary if exists
        if (featuredCategory.banner_url) {
            const cloudinaryId = getCloudinaryIdFromUrl(
                featuredCategory.banner_url
            );
            await deleteFromCloudinary(cloudinaryId);
        }

        await transactionClient.featuredCategory.delete({
            where: { id }
        });
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Featured category deleted successfully'
    });
});

const sortFeaturedCategories = catchAsync(async (req, res) => {
    const { sortedIds } = req.body;

    if (!Array.isArray(sortedIds) || sortedIds.length === 0) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Sorted IDs array is required'
        );
    }

    // Verify all IDs exist
    const existingCategories = await prisma.featuredCategory.findMany(
        {
            where: {
                id: {
                    in: sortedIds
                }
            },
            select: { id: true }
        }
    );

    if (existingCategories.length !== sortedIds.length) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'One or more featured categories not found'
        );
    }

    // Update the sort_order based on array index
    const updatePromises = sortedIds.map((id, index) =>
        prisma.featuredCategory.update({
            where: { id },
            data: {
                sort_order: index + 1 // Start from 1, not 0
            }
        })
    );

    await Promise.all(updatePromises);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Featured categories sorted successfully'
    });
});

const toggleFeaturedCategoryStatus = catchAsync(async (req, res) => {
    const { id } = req.params;

    const featuredCategory = await prisma.featuredCategory.findUnique(
        {
            where: { id }
        }
    );

    if (!featuredCategory) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Featured category not found'
        );
    }

    const result = await prisma.featuredCategory.update({
        where: { id },
        data: {
            is_published: !featuredCategory.is_published
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true
                }
            }
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Featured category ${result.is_published ? 'published' : 'unpublished'} successfully`,
        data: result
    });
});

const FeaturedCategoryController = {
    createFeaturedCategory,
    getFeaturedCategories,
    getFeaturedCategory,
    updateFeaturedCategory,
    deleteFeaturedCategory,
    sortFeaturedCategories,
    toggleFeaturedCategoryStatus
};

module.exports = FeaturedCategoryController;
