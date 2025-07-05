const { Router } = require('express');
const FeaturedCategoryController = require('../../controller/featured-category.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const validateRequest = require('../../middlewares/validateRequest.js');
const { UserRole } = require('@prisma/client');
const { upload } = require('../../utils/handelFile.js');
const FeaturedCategoryValidation = require('../../validations/featured-category/index.js');

const router = Router();

router
    .route('/')
    .post(
        authGuard(UserRole.SUPER_ADMIN),
        upload.single('banner'),
        validateRequest(
            FeaturedCategoryValidation.CreateFeaturedCategory
        ),
        FeaturedCategoryController.createFeaturedCategory
    )
    .get(FeaturedCategoryController.getFeaturedCategories);

router
    .route('/sort')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        validateRequest(
            FeaturedCategoryValidation.SortFeaturedCategories
        ),
        FeaturedCategoryController.sortFeaturedCategories
    );

router
    .route('/:id')
    .get(FeaturedCategoryController.getFeaturedCategory)
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        upload.single('banner'),
        validateRequest(
            FeaturedCategoryValidation.UpdateFeaturedCategory
        ),
        FeaturedCategoryController.updateFeaturedCategory
    )
    .delete(
        authGuard(UserRole.SUPER_ADMIN),
        FeaturedCategoryController.deleteFeaturedCategory
    );

router
    .route('/:id/toggle-status')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        FeaturedCategoryController.toggleFeaturedCategoryStatus
    );

module.exports = router;
