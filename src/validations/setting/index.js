const { z } = require('zod');

const CreateSetting = z.object({
    body: z.object({
        facebook: z
            .string({
                invalid_type_error: 'Facebook must be a string'
            })
            .url({
                message: 'Facebook must be a valid URL'
            })
            .optional()
            .or(z.literal('')),
        instagram: z
            .string({
                invalid_type_error: 'Instagram must be a string'
            })
            .url({
                message: 'Instagram must be a valid URL'
            })
            .optional()
            .or(z.literal('')),
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
        keywords: z
            .string({
                required_error: 'Keywords are required',
                invalid_type_error: 'Keywords must be a string'
            })
            .min(10, {
                message:
                    'Keywords must be at least 10 characters long'
            }),
        google_analytics_id: z
            .string({
                invalid_type_error:
                    'Google Analytics ID must be a string'
            })
            .optional()
            .or(z.literal('')),
        google_tag_manager_id: z
            .string({
                invalid_type_error:
                    'Google Tag Manager ID must be a string'
            })
            .optional()
            .or(z.literal('')),
        facebook_pixel_id: z
            .string({
                invalid_type_error:
                    'Facebook Pixel ID must be a string'
            })
            .optional()
            .or(z.literal(''))
    })
});

const UpdateSetting = z.object({
    body: z.object({
        facebook: z
            .string({
                invalid_type_error: 'Facebook must be a string'
            })
            .url({
                message: 'Facebook must be a valid URL'
            })
            .optional()
            .or(z.literal('')),
        instagram: z
            .string({
                invalid_type_error: 'Instagram must be a string'
            })
            .url({
                message: 'Instagram must be a valid URL'
            })
            .optional()
            .or(z.literal('')),
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
        keywords: z
            .string({
                invalid_type_error: 'Keywords must be a string'
            })
            .min(10, {
                message:
                    'Keywords must be at least 10 characters long'
            })
            .optional(),
        google_analytics_id: z
            .string({
                invalid_type_error:
                    'Google Analytics ID must be a string'
            })
            .optional()
            .or(z.literal('')),
        google_tag_manager_id: z
            .string({
                invalid_type_error:
                    'Google Tag Manager ID must be a string'
            })
            .optional()
            .or(z.literal('')),
        facebook_pixel_id: z
            .string({
                invalid_type_error:
                    'Facebook Pixel ID must be a string'
            })
            .optional()
            .or(z.literal(''))
    })
});

const SettingValidation = {
    CreateSetting,
    UpdateSetting
};

module.exports = SettingValidation;
