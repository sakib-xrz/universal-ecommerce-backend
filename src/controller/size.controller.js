const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');
const generateSlug = require('../utils/generateSlug.js');

const createSize = catchAsync(async (req, res) => {
    const { name } = req.body;

    const slug = generateSlug(name);

    const existingSize = await prisma.size.findFirst({
        where: {
            slug
        }
    });

    if (existingSize) {
        throw new ApiError(
            httpStatus.CONFLICT,
            'Size already exists'
        );
    }

    const size = await prisma.size.create({
        data: {
            name,
            slug
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Size created successfully',
        data: size
    });
});

const getSizes = catchAsync(async (_req, res) => {
    const sizes = await prisma.size.findMany();
    const sizeOrder = ['s', 'm', 'l', 'xl', 'xxl'];
    const transformSizes = sizes
        .sort(
            (a, b) =>
                sizeOrder.indexOf(a.size?.slug) -
                sizeOrder.indexOf(b.size?.slug)
        )
        .map(size => ({
            ...size
        }));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: transformSizes
    });
});

const deleteSize = catchAsync(async (req, res) => {
    const { id } = req.params;

    const size = await prisma.size.findUnique({
        where: {
            id
        }
    });

    if (!size) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Size not found');
    }

    await prisma.size.delete({
        where: {
            id
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.NO_CONTENT,
        success: true,
        message: 'Size deleted successfully'
    });
});

const SizeController = {
    createSize,
    getSizes,
    deleteSize
};

module.exports = SizeController;
