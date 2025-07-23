const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');
const { UserStatus, UserRole } = require('@prisma/client');
const bcrypt = require('bcrypt');
const ApiError = require('../error/ApiError.js');
const jwt = require('jsonwebtoken');
const config = require('../config/index.js');
const ResetPasswordTemplate = require('../templates/reset-password.js');
const sendMail = require('../utils/mailer.js');

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const isUserExists = await prisma.user.findUnique({
        where: {
            email,
            status: UserStatus.ACTIVE,
            is_deleted: false
        }
    });

    if (!isUserExists) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const isPasswordMatched = await bcrypt.compare(
        password,
        isUserExists.password
    );

    if (!isPasswordMatched) {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            'Invalid email or password'
        );
    }

    const accessToken = jwt.sign(
        {
            id: isUserExists.id,
            email: isUserExists.email,
            role: isUserExists.role
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expires_in
        }
    );

    const refreshToken = jwt.sign(
        {
            id: isUserExists.id,
            email: isUserExists.email,
            role: isUserExists.role
        },
        config.jwt.refresh_secret,
        {
            expiresIn: config.jwt.refresh_expires_in
        }
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Login successful',
        data: {
            accessToken,
            refreshToken,
            need_password_change: isUserExists.need_password_change
        }
    });
});

const register = catchAsync(async (req, res) => {
    const { email, password, name, phone } = req.body;

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
                    role: UserRole.CUSTOMER
                }
            });

            await transactionClient.profile.create({
                data: {
                    user_id: user.id,
                    name,
                    email,
                    phone
                }
            });

            return user;
        }
    );

    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expires_in
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        config.jwt.refresh_secret,
        {
            expiresIn: config.jwt.refresh_expires_in
        }
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Registration successful',
        data: {
            accessToken,
            refreshToken,
            need_password_change: false
        }
    });
});

const refreshToken = catchAsync(async (req, res) => {
    const { REFRESH_TOKEN } = req.cookies;

    if (!REFRESH_TOKEN) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Refresh token is required'
        );
    }

    let payload = null;

    try {
        payload = jwt.verify(
            REFRESH_TOKEN,
            config.jwt.refresh_secret
        );
    } catch (error) {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            'You are not authorized'
        );
    }

    const user = await prisma.user.findUnique({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE,
            is_deleted: false
        }
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expires_in
        }
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Token refreshed successfully',
        data: {
            accessToken,
            need_password_change: user.need_password_change
        }
    });
});

const logout = catchAsync(async (_req, res) => {
    res.clearCookie('REFRESH_TOKEN');

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Logout successful'
    });
});

const changePassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const { email } = req.user;

    const user = await prisma.user.findUnique({
        where: {
            email,
            status: UserStatus.ACTIVE,
            is_deleted: false
        }
    });

    const isPasswordMatched = await bcrypt.compare(
        oldPassword,
        user.password
    );

    if (!isPasswordMatched) {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            'Password is incorrect'
        );
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        Number(config.bcrypt_salt_rounds)
    );

    await prisma.user.update({
        where: {
            email
        },
        data: {
            password: hashedPassword,
            need_password_change: false
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Password changed successfully'
    });
});

const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            email,
            status: UserStatus.ACTIVE,
            is_deleted: false
        }
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const profile = await prisma.profile.findUnique({
        where: {
            email: user.email
        }
    });

    const resetPasswordToken = jwt.sign(
        {
            email: user.email,
            role: user.role
        },
        config.jwt.reset_password_secret,
        {
            expiresIn: config.jwt.reset_password_expires_in
        }
    );

    const resetPassLink = `${config.frontend_base_url}/${config.reset_pass_url}?token=${resetPasswordToken}`;

    const settings = await prisma.setting.findFirst();

    const templateData = {
        name: profile.name,
        resetPassLink,
        siteName: settings.title
    };

    const mailBody = ResetPasswordTemplate(templateData);

    await sendMail(user.email, 'Reset your password', mailBody);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Password reset link sent to your email'
    });
});

const resetPassword = catchAsync(async (req, res) => {
    const { newPassword } = req.body;
    const token = req.headers?.authorization || '';

    if (!token) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Token is required'
        );
    }

    const payload = jwt.verify(
        token,
        config.jwt.reset_password_secret
    );

    const user = await prisma.user.findUnique({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE,
            is_deleted: false
        }
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (payload.email !== user.email) {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            'You are not authorized'
        );
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        Number(config.bcrypt_salt_rounds)
    );

    await prisma.user.update({
        where: {
            email: user.email
        },
        data: {
            password: hashedPassword,
            need_password_change: false
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Password reset successful'
    });
});

const AuthController = {
    login,
    register,
    refreshToken,
    logout,
    changePassword,
    forgotPassword,
    resetPassword
};

module.exports = AuthController;
