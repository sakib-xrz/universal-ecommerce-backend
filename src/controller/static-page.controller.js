const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const ApiError = require('../error/ApiError.js');
const { StaticPageKind } = require('@prisma/client');

// Create StaticPage
const createStaticPage = catchAsync(async (req, res) => {
    const { title, description, kind, content } = req.body;

    // Check if static page with this kind already exists
    const existingPage = await prisma.staticPage.findFirst({
        where: { kind }
    });

    if (existingPage) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Static page with kind ${kind} already exists`
        );
    }

    const staticPage = await prisma.staticPage.create({
        data: {
            title,
            description,
            kind,
            content
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Static page created successfully',
        data: staticPage
    });
});

// Get all StaticPages
const getStaticPages = catchAsync(async (req, res) => {
    const staticPages = await prisma.staticPage.findMany({
        orderBy: {
            created_at: 'desc'
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Static pages retrieved successfully',
        data: staticPages
    });
});

// Get single StaticPage by ID
const getStaticPage = catchAsync(async (req, res) => {
    const { id } = req.params;

    const staticPage = await prisma.staticPage.findUnique({
        where: { id }
    });

    if (!staticPage) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Static page not found'
        );
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Static page retrieved successfully',
        data: staticPage
    });
});

// Get StaticPage by kind
const getStaticPageByKind = catchAsync(async (req, res) => {
    const { kind } = req.params;

    // Validate kind
    if (!Object.values(StaticPageKind).includes(kind)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Invalid kind. Must be one of: ${Object.values(StaticPageKind).join(', ')}`
        );
    }

    const staticPage = await prisma.staticPage.findFirst({
        where: { kind }
    });

    if (!staticPage) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Static page not found'
        );
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Static page retrieved successfully',
        data: staticPage
    });
});

// Update StaticPage
const updateStaticPage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, description, kind, content } = req.body;

    const existingPage = await prisma.staticPage.findUnique({
        where: { id }
    });

    if (!existingPage) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Static page not found'
        );
    }

    // Check if kind is being changed and if another page with new kind exists
    if (kind && kind !== existingPage.kind) {
        const pageWithKind = await prisma.staticPage.findFirst({
            where: {
                kind,
                id: { not: id }
            }
        });

        if (pageWithKind) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Static page with kind ${kind} already exists`
            );
        }
    }

    const staticPage = await prisma.staticPage.update({
        where: { id },
        data: {
            title,
            description,
            kind,
            content
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Static page updated successfully',
        data: staticPage
    });
});

// Delete StaticPage
const deleteStaticPage = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingPage = await prisma.staticPage.findUnique({
        where: { id }
    });

    if (!existingPage) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Static page not found'
        );
    }

    await prisma.staticPage.delete({
        where: { id }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Static page deleted successfully'
    });
});

module.exports = {
    createStaticPage,
    getStaticPages,
    getStaticPage,
    getStaticPageByKind,
    updateStaticPage,
    deleteStaticPage
};
