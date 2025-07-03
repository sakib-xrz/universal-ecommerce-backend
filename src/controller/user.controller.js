const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');
const pick = require('../utils/pick');
const calculatePagination = require('../helpers/calculatePagination');
const prisma = require('../utils/prisma');
const { UserStatus, UserRole } = require('@prisma/client');
const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const config = require('../config');

const createUser = catchAsync(async (req, res) => {
    const { email, password, name, phone, role } = req.body;

    const isUserExists = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (isUserExists) {
        throw new ApiError(
            httpStatus.CONFLICT,
            'User already exists with this email'
        );
    }

    const hashedPassword = await bcrypt.hash(
        password,
        Number(config.bcrypt_salt_rounds)
    );

    const user = await prisma.$transaction(
        async transactionClient => {
            const user = await transactionClient.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role
                }
            });

            const profile = await transactionClient.profile.create({
                data: {
                    user_id: user.id,
                    name,
                    email,
                    phone
                }
            });

            return {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                profile: {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    image: profile.image
                }
            };
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'User created successfully',
        data: user
    });
});

const getAllUsers = catchAsync(async (req, res) => {
    const userFilterableFields = ['search', 'role', 'status'];

    const userSearchFields = [
        'profile.name',
        'profile.email',
        'profile.phone'
    ];

    const filters = pick(req.query, userFilterableFields);
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
            OR: userSearchFields.map(field => {
                const [relation, key] = field.split('.');
                return {
                    [relation]: {
                        [key]: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                };
            })
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

    andConditions.push({
        is_deleted: false,
        role: {
            not: UserRole.SUPER_ADMIN
        }
    });

    const whereConditions =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.user.findMany({
        where: whereConditions,
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            profile: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    image: true
                }
            }
        },
        skip,
        take: limit,
        orderBy:
            options.sort_by && options.sort_order
                ? {
                      [options.sort_by]: options.sort_order
                  }
                : {
                      created_at: 'desc'
                  }
    });

    const total = await prisma.user.count({
        where: whereConditions
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All users fetched successfully',
        meta: {
            total,
            page,
            limit
        },
        data: result
    });
});

const updateUserStatus = catchAsync(async (req, res) => {
    const result = await prisma.user.update({
        where: {
            id: req.params.id
        },
        data: {
            status: req.body.status
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User status updated successfully',
        data: result
    });
});

const deleteUser = catchAsync(async (req, res) => {
    await prisma.user.update({
        where: {
            id: req.params.id
        },
        data: {
            is_deleted: true,
            status: UserStatus.INACTIVE
        }
    });

    sendResponse(res, {
        statusCode: httpStatus.NO_CONTENT,
        success: true,
        message: 'User deleted successfully'
    });
});

const getCustomerList = catchAsync(async (req, res) => {
    const userFilterableFields = ['search'];

    const userSearchFields = [
        'profile.name',
        'profile.email',
        'profile.phone'
    ];

    const filters = pick(req.query, userFilterableFields);
    const options = pick(req.query, [
        'limit',
        'page',
        'sort_by',
        'sort_order'
    ]);

    const { page, limit, skip } = calculatePagination(options);
    const { search } = filters;

    const andConditions = [];

    if (search) {
        andConditions.push({
            OR: userSearchFields.map(field => {
                const [relation, key] = field.split('.');
                return {
                    [relation]: {
                        [key]: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                };
            })
        });
    }

    andConditions.push({
        is_deleted: false,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE
    });

    const whereConditions =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.user.findMany({
        where: whereConditions,
        select: {
            id: true,
            email: true,
            profile: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    image: true
                }
            }
        },
        skip,
        take: limit,
        orderBy:
            options.sort_by && options.sort_order
                ? {
                      [options.sort_by]: options.sort_order
                  }
                : {
                      created_at: 'desc'
                  }
    });

    const total = await prisma.user.count({
        where: whereConditions
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All customers fetched successfully',
        meta: {
            total,
            page,
            limit
        },
        data: result
    });
});

const UserController = {
    createUser,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getCustomerList
};

module.exports = UserController;
