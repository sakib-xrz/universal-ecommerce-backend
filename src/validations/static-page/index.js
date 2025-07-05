const { z } = require('zod');
const { StaticPageKind } = require('@prisma/client');

const CreateStaticPage = z.object({
    body: z.object({
        title: z
            .string({
                required_error: 'Title is required',
                invalid_type_error: 'Title must be a string'
            })
            .min(5, {
                message: 'Title must be at least 5 characters long'
            }),
        description: z
            .string({
                required_error: 'Description is required',
                invalid_type_error: 'Description must be a string'
            })
            .min(20, {
                message:
                    'Description must be at least 20 characters long'
            }),
        kind: z.enum(
            [
                StaticPageKind.ABOUT_US,
                StaticPageKind.PRIVACY_POLICY,
                StaticPageKind.TERMS_AND_CONDITIONS
            ],
            {
                required_error: 'Kind is required',
                invalid_type_error:
                    'Kind must be one of: ABOUT_US, PRIVACY_POLICY, TERMS_AND_CONDITIONS'
            }
        ),
        content: z
            .string({
                required_error: 'Content is required',
                invalid_type_error: 'Content must be a string'
            })
            .min(50, {
                message: 'Content must be at least 50 characters long'
            })
    })
});

const UpdateStaticPage = z.object({
    body: z.object({
        title: z
            .string({
                invalid_type_error: 'Title must be a string'
            })
            .min(5, {
                message: 'Title must be at least 5 characters long'
            })
            .optional(),
        description: z
            .string({
                invalid_type_error: 'Description must be a string'
            })
            .min(20, {
                message:
                    'Description must be at least 20 characters long'
            })
            .optional(),
        kind: z
            .enum(
                [
                    StaticPageKind.ABOUT_US,
                    StaticPageKind.PRIVACY_POLICY,
                    StaticPageKind.TERMS_AND_CONDITIONS
                ],
                {
                    invalid_type_error:
                        'Kind must be one of: ABOUT_US, PRIVACY_POLICY, TERMS_AND_CONDITIONS'
                }
            )
            .optional(),
        content: z
            .string({
                invalid_type_error: 'Content must be a string'
            })
            .min(50, {
                message: 'Content must be at least 50 characters long'
            })
            .optional()
    })
});

const StaticPageValidation = {
    CreateStaticPage,
    UpdateStaticPage
};

module.exports = StaticPageValidation;
