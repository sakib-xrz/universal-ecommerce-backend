const { z } = require('zod');

const youtubeUrlRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/)?([a-zA-Z0-9_-]{11})(\S+)?$/;

const CreateFeaturedCategory = z.object({
    body: z.object({
        category_id: z.string({
            required_error: 'Category ID is required',
            invalid_type_error: 'Category ID must be a string'
        }),
        title: z.string({
            required_error: 'Title is required',
            invalid_type_error: 'Title must be a string'
        }),
        youtube_video_link: z
            .string({
                invalid_type_error:
                    'YouTube video link must be a string'
            })
            .regex(youtubeUrlRegex, {
                message: 'Must be a valid YouTube URL'
            })
            .optional()
    })
});

const UpdateFeaturedCategory = z.object({
    body: z.object({
        category_id: z
            .string({
                invalid_type_error: 'Category ID must be a string'
            })
            .optional(),
        title: z
            .string({
                invalid_type_error: 'Title must be a string'
            })
            .optional(),
        youtube_video_link: z
            .string({
                invalid_type_error:
                    'YouTube video link must be a string'
            })
            .regex(youtubeUrlRegex, {
                message: 'Must be a valid YouTube URL'
            })
            .nullable()
            .optional()
    })
});

const SortFeaturedCategories = z.object({
    body: z.object({
        sortedIds: z.array(z.string()).min(1, {
            message: 'At least one ID is required'
        })
    })
});

const FeaturedCategoryValidation = {
    CreateFeaturedCategory,
    UpdateFeaturedCategory,
    SortFeaturedCategories
};

module.exports = FeaturedCategoryValidation;
