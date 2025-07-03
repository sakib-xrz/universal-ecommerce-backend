const { UserRole, UserStatus } = require('@prisma/client');
const { z } = require('zod');

const CreateUser = z.object({
    body: z.object({
        email: z
            .string({
                required_error: 'Email is required',
                invalid_type_error: 'Email must be a string'
            })
            .email({
                message: 'Invalid email address'
            }),
        password: z
            .string({
                required_error: 'Password is required',
                invalid_type_error: 'Password must be a string'
            })
            .min(6, {
                message: 'Password must be at least 6 characters long'
            }),
        name: z
            .string({
                required_error: 'Name is required',
                invalid_type_error: 'Name must be a string'
            })
            .min(2, {
                message: 'Name must be at least 2 characters long'
            }),
        phone: z
            .string({
                required_error: 'Phone number is required',
                invalid_type_error: 'Phone number must be a string'
            })
            .min(11, {
                message:
                    'Phone number must be at least 11 characters long'
            })
            .max(14, {
                message:
                    'Phone number must be at most 14 characters long'
            }),
        role: z.enum([UserRole.CUSTOMER], {
            required_error: 'Role is required',
            invalid_type_error: 'Role must be CUSTOMER'
        })
    })
});

const UpdateUserStatus = z.object({
    body: z.object({
        status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE], {
            required_error: 'Status is required',
            invalid_type_error:
                'Status must be either ACTIVE or INACTIVE'
        })
    })
});

const UserValidation = {
    CreateUser,
    UpdateUserStatus
};

module.exports = UserValidation;
