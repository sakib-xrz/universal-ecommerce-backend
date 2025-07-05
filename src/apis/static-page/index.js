const { Router } = require('express');
const StaticPageController = require('../../controller/static-page.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const validateRequest = require('../../middlewares/validateRequest.js');
const StaticPageValidation = require('../../validations/static-page/index.js');
const { UserRole } = require('@prisma/client');

const router = Router();

// Create static page (only super admin)
router.post(
    '/',
    authGuard(UserRole.SUPER_ADMIN),
    validateRequest(StaticPageValidation.CreateStaticPage),
    StaticPageController.createStaticPage
);

// Get all static pages (public)
router.get('/', StaticPageController.getStaticPages);

// Get static page by kind (public)
router.get('/kind/:kind', StaticPageController.getStaticPageByKind);

// Get single static page by ID (public)
router.get('/:id', StaticPageController.getStaticPage);

// Update static page (only super admin)
router.patch(
    '/:id',
    authGuard(UserRole.SUPER_ADMIN),
    validateRequest(StaticPageValidation.UpdateStaticPage),
    StaticPageController.updateStaticPage
);

// Delete static page (only super admin)
router.delete(
    '/:id',
    authGuard(UserRole.SUPER_ADMIN),
    StaticPageController.deleteStaticPage
);

module.exports = router;
