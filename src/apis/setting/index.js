const { Router } = require('express');
const SettingController = require('../../controller/setting.controller.js');
const authGuard = require('../../middlewares/authGuard.js');
const validateRequest = require('../../middlewares/validateRequest.js');
const SettingValidation = require('../../validations/setting/index.js');
const { upload } = require('../../utils/handelFile.js');
const { UserRole } = require('@prisma/client');

const router = Router();

// Create setting (only super admin)
router.post(
    '/',
    authGuard(UserRole.SUPER_ADMIN),
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 }
    ]),
    validateRequest(SettingValidation.CreateSetting),
    SettingController.createSetting
);

// Get setting (public)
router.get('/', SettingController.getSetting);

// Update setting (only super admin)
router.patch(
    '/:id',
    authGuard(UserRole.SUPER_ADMIN),
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 }
    ]),
    validateRequest(SettingValidation.UpdateSetting),
    SettingController.updateSetting
);

// Delete setting (only super admin)
router.delete(
    '/:id',
    authGuard(UserRole.SUPER_ADMIN),
    SettingController.deleteSetting
);

module.exports = router;
