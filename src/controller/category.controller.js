const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const generateSlug = require('../utils/generateSlug.js');
const {
    uploadToCloudinary,
    deleteFromCloudinary
} = require('../utils/handelFile.js');
const ApiError = require('../error/ApiError.js');

const createCategory = catchAsync(async (req, res) => {
    const { file } = req;

    const { name } = req.body;

    const slug = generateSlug(name);

    const result = await prisma.$transaction(
        async transactionClient => {
            const category = await transactionClient.category.create({
                data: {
                    name,
                    slug,
                    parent_category_id:
                        typeof req.body?.parent_category_id ===
                            'string' &&
                        req.body?.parent_category_id === 'null'
                            ? null
                            : req.body?.parent_category_id
                }
            });

            if (file) {
                const fileName = `${Date.now()}-${file.originalname}`;
                const fileType = file.mimetype.split('/').pop();

                const cloudinaryResponse = await uploadToCloudinary(
                    file,
                    {
                        folder: `/ecommerce/category`,
                        filename_override: fileName,
                        format: fileType,
                        public_id: category.id,
                        overwrite: true,
                        invalidate: true
                    }
                );

                await transactionClient.category.update({
                    where: {
                        id: category.id
                    },
                    data: {
                        image: cloudinaryResponse.secure_url
                    }
                });

                category.image = cloudinaryResponse.secure_url;
            }

            return category;
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Category created successfully',
        data: result
    });
});

const fetchCategories = async (parentId = null) => {
    const categories = await prisma.category.findMany({
        where: {
            parent_category_id: parentId
        },
        include: {
            sub_categories: true
        },
        orderBy: {
            created_at: 'asc'
        }
    });

    return Promise.all(
        categories.map(async category => ({
            ...category,
            sub_categories: await fetchCategories(category.id)
        }))
    );
};

const getCategories = catchAsync(async (_req, res) => {
    const categories = await fetchCategories(null);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: categories
    });
});

const getAllCategoriesList = catchAsync(async (_req, res) => {
    const categories = await prisma.category.findMany({
        include: {
            sub_categories: true
        }
    });

    const flatList = categories.flatMap(category => {
        const parentCategory = {
            id: category.id,
            name: category.name
        };

        const subCategories = category.sub_categories.map(
            subCategory => ({
                id: subCategory.id,
                name: subCategory.name
            })
        );

        return [parentCategory, ...subCategories];
    });

    const uniqueFlatList = flatList.filter(
        (value, index, self) =>
            index === self.findIndex(t => t.id === value.id)
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: uniqueFlatList
    });
});

const getAllParentCategoriesList = catchAsync(async (_req, res) => {
    const categories = await prisma.category.findMany({
        where: {
            parent_category_id: null,
            is_published: true
        },
        select: {
            name: true,
            image: true,
            slug: true
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: categories
    });
});

const changeCategoryStatus = catchAsync(async (req, res) => {
    const { id } = req.params;

    await prisma.$transaction(async prisma => {
        const category = await prisma.category.findUnique({
            where: { id },
            include: { sub_categories: true }
        });

        if (!category) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                'Category not found'
            );
        }

        const updateCategoryStatus = async (
            categoryId,
            newStatus
        ) => {
            await prisma.category.update({
                where: { id: categoryId },
                data: { is_published: newStatus }
            });

            if (!newStatus) {
                const subCategories = await prisma.category.findMany({
                    where: { parent_category_id: categoryId }
                });

                for (const subCategory of subCategories) {
                    await updateCategoryStatus(
                        subCategory.id,
                        newStatus
                    );
                }
            }
        };

        const newStatus = !category.is_published;

        if (!category.parent_category_id || category.is_published) {
            await updateCategoryStatus(id, newStatus);
        } else {
            const parentCategory = await prisma.category.findUnique({
                where: { id: category.parent_category_id }
            });

            if (!parentCategory.is_published) {
                throw new ApiError(
                    httpStatus.FORBIDDEN,
                    'Parent category is not published'
                );
            }

            await prisma.category.update({
                where: { id },
                data: { is_published: newStatus }
            });
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category status changed successfully'
    });
});

const updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { file } = req;
    let { name, parent_category_id } = req.body;

    if (parent_category_id === 'null') {
        parent_category_id = null;
    }

    const category = await prisma.category.findUnique({
        where: { id },
        include: { sub_categories: true }
    });

    if (!category) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Category not found'
        );
    }

    if (parent_category_id && parent_category_id === id) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'A category cannot be its own parent'
        );
    }

    if (parent_category_id) {
        const parentCategory = await prisma.category.findUnique({
            where: { id: parent_category_id },
            include: { sub_categories: true }
        });

        if (parentCategory && parentCategory.id === id) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'A category cannot be its own child'
            );
        }
    }

    const slug = generateSlug(name || category.name);

    const result = await prisma.$transaction(
        async transactionClient => {
            const updatedCategory =
                await transactionClient.category.update({
                    where: { id },
                    data: {
                        parent_category_id,
                        name: name || category.name,
                        slug: slug || category.slug
                    }
                });

            if (file) {
                const fileName = `${Date.now()}-${file.originalname}`;
                const fileType = file.mimetype.split('/').pop();

                const cloudinaryResponse = await uploadToCloudinary(
                    file,
                    {
                        folder: `/ecommerce/category`,
                        filename_override: fileName,
                        format: fileType,
                        public_id: updatedCategory.id,
                        overwrite: true,
                        invalidate: true
                    }
                );

                await transactionClient.category.update({
                    where: { id: updatedCategory.id },
                    data: { image: cloudinaryResponse.secure_url }
                });

                updatedCategory.image = cloudinaryResponse.secure_url;
            }

            return updatedCategory;
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category updated successfully',
        data: result
    });
});

const deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const isCategoryExist = await prisma.category.findUnique({
        where: {
            id
        }
    });

    if (!isCategoryExist) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Category not found'
        );
    }

    await prisma.$transaction(async transactionClient => {
        await deleteFromCloudinary([`letzgear/category/${id}`]);
        await transactionClient.category.delete({
            where: {
                id
            }
        });
    });
    sendResponse(res, {
        statusCode: httpStatus.NO_CONTENT,
        success: true,
        message: 'Category deleted successfully'
    });
});

const CategoryController = {
    createCategory,
    getCategories,
    getAllCategoriesList,
    getAllParentCategoriesList,
    changeCategoryStatus,
    updateCategory,
    deleteCategory
};

module.exports = CategoryController;
