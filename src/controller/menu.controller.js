const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const httpStatus = require('http-status');

const fetchMenus = async (parentId = null) => {
    const menus = await prisma.category.findMany({
        where: {
            parent_category_id: parentId,
            is_published: true
        },
        select: {
            name: true,
            id: true,
            slug: true,
            sub_categories: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            }
        },
        orderBy: {
            created_at: 'asc'
        }
    });

    return Promise.all(
        menus.map(async category => ({
            ...category,
            sub_categories: await fetchMenus(category.id)
        }))
    );
};

const getMenus = catchAsync(async (_req, res) => {
    const menus = await fetchMenus(null);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: menus
    });
});

const MenuController = {
    getMenus
};

module.exports = MenuController;
