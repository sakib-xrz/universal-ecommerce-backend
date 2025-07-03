const { Router } = require('express');
const CategoryController = require('../../controller/category.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const { UserRole } = require('@prisma/client');
const { upload } = require('../../utils/handelFile.js');

const router = Router();

router
    .route('/')
    .post(
        authGuard(UserRole.SUPER_ADMIN),
        upload.single('image'),
        CategoryController.createCategory
    )
    .get(CategoryController.getCategories);

router.get('/list', CategoryController.getAllCategoriesList);

router.get(
    '/list/parent',
    CategoryController.getAllParentCategoriesList
);

router
    .route('/:id')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        upload.single('image'),
        CategoryController.updateCategory
    )
    .delete(
        authGuard(UserRole.SUPER_ADMIN),
        CategoryController.deleteCategory
    );

router
    .route('/:id/status')
    .patch(
        authGuard(UserRole.SUPER_ADMIN),
        CategoryController.changeCategoryStatus
    );

module.exports = router;
