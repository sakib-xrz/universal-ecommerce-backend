const catchAsync = require('../utils/catchAsync.js');
const sendResponse = require('../utils/sendResponse.js');
const prisma = require('../utils/prisma.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');
const generateSlug = require('../utils/generateSlug.js');
const calculatePagination = require('../helpers/calculatePagination.js');
const pick = require('../utils/pick.js');

const createProduct = catchAsync(async (req, res) => {
    let productData = req.body;

    const slugString = `${productData.name}-${productData.sku}`;

    productData = {
        ...productData,
        slug: generateSlug(slugString)
    };

    if (productData.category_id) {
        const category = await prisma.category.findUnique({
            where: {
                id: productData.category_id
            }
        });

        if (!category) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Category not found'
            );
        }
    }

    const product = await prisma.product.create({
        data: productData
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        message: 'Product created successfully',
        data: product
    });
});

const getProductsByCategory = catchAsync(async (req, res) => {
    const slug = req.params.slug;

    const productFilterableFields = ['search'];
    const productSearchableFields = ['name', 'slug', 'sku'];

    const filters = pick(req.query, productFilterableFields);
    const options = pick(req.query, [
        'limit',
        'page',
        'sort_by',
        'sort_order'
    ]);

    const { page, limit, skip } = calculatePagination(options);
    const { search } = filters;

    const andConditions = [];

    if (search) {
        andConditions.push({
            OR: productSearchableFields.map(field => ({
                [field]: {
                    contains: search,
                    mode: 'insensitive'
                }
            }))
        });
    }

    andConditions.push({
        category: {
            slug
        },
        is_published: true,
        is_deleted: false
    });

    const whereCondition = { AND: andConditions };

    const products = await prisma.product.findMany({
        where: whereCondition,
        select: {
            id: true,
            category_id: true,
            name: true,
            sku: true,
            slug: true,
            youtube_video_link: true,
            buy_price: true,
            cost_price: true,
            sell_price: true,
            discount: true,
            discount_type: true,
            is_published: true,
            is_featured: true,
            category: { select: { name: true } },
            images: { select: { image_url: true, type: true } },
            variants: {
                select: {
                    id: true,
                    size: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    stock: true
                }
            }
        },
        skip,
        take: limit,
        orderBy:
            options.sort_by && options.sort_order
                ? {
                      [options.sort_by]: options.sort_order
                  }
                : {
                      created_at: 'desc'
                  }
    });

    const total = await prisma.product.count({
        where: whereCondition
    });

    const sizeOrder = ['s', 'm', 'l', 'xl', 'xxl'];

    const transformedProducts = products.map(product => {
        const discounted_price = product.discount
            ? product.discount_type === 'PERCENTAGE'
                ? product.sell_price -
                  (product.sell_price * product.discount) / 100
                : product.sell_price - product.discount
            : 0;

        const { buy_price, cost_price, sell_price, ...rest } =
            product;

        return {
            ...rest,
            price: product.sell_price,
            discounted_price,
            variants: product.variants
                .sort(
                    (a, b) =>
                        sizeOrder.indexOf(a.size?.slug) -
                        sizeOrder.indexOf(b.size?.slug)
                )
                .map(variant => ({
                    id: variant.id,
                    size_id: variant.size?.id || null,
                    size: variant.size?.name || null,
                    slug: variant.size?.slug || null,
                    stock: variant.stock
                }))
                .filter(variant => variant.stock > 0),
            total_stock: product.variants.reduce(
                (acc, variant) => acc + variant.stock,
                0
            )
        };
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: 'Products retrieved successfully',
        meta: {
            page,
            limit,
            total
        },
        data: transformedProducts
    });
});

const globalSearchProducts = catchAsync(async (req, res) => {
    const { search } = pick(req.query, ['search']);

    const whereCondition = {
        is_published: true,
        is_deleted: false,
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                {
                    category: {
                        name: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                }
            ]
        })
    };

    const products = await prisma.product.findMany({
        where: whereCondition,
        select: {
            name: true,
            slug: true,
            sell_price: true,
            discount: true,
            discount_type: true,
            images: { select: { image_url: true, type: true } }
        },
        take: 5
    });

    const modifiedProducts = products.map(product => {
        const discounted_price = product.discount
            ? product.discount_type === 'PERCENTAGE'
                ? product.sell_price -
                  (product.sell_price * product.discount) / 100
                : product.sell_price - product.discount
            : 0;

        const {
            sell_price,
            discount_type,
            discount,
            images,
            ...rest
        } = product;

        return {
            ...rest,
            price: product.sell_price,
            discounted_price,
            image:
                images.find(img => img.type === 'PRIMARY')
                    ?.image_url || ''
        };
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Products retrieved successfully',
        data: modifiedProducts
    });
});

const getCustomerProduct = catchAsync(async (req, res) => {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
        where: {
            slug
        },
        select: {
            id: true,
            category_id: true,
            name: true,
            sku: true,
            slug: true,
            short_description: true,
            full_description: true,
            delivery_policy: true,
            youtube_video_link: true,
            buy_price: true,
            cost_price: true,
            sell_price: true,
            discount: true,
            discount_type: true,
            is_published: true,
            is_featured: true,
            category: { select: { name: true } },
            images: { select: { image_url: true, type: true } },
            variants: {
                select: {
                    id: true,
                    size: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    stock: true
                }
            }
        }
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const sizeOrder = ['s', 'm', 'l', 'xl', 'xxl'];

    const { buy_price, cost_price, sell_price, ...rest } = product;

    const discounted_price = product.discount
        ? product.discount_type === 'PERCENTAGE'
            ? product.sell_price -
              (product.sell_price * product.discount) / 100
            : product.sell_price - product.discount
        : 0;

    const transformedProduct = {
        ...rest,
        price: product.sell_price,
        discounted_price,
        variants: product.variants
            .sort(
                (a, b) =>
                    sizeOrder.indexOf(a.size?.slug) -
                    sizeOrder.indexOf(b.size?.slug)
            )
            .map(variant => ({
                id: variant.id,
                size_id: variant.size?.id || null,
                size: variant.size?.name || null,
                slug: variant.size?.slug || null,
                stock: variant.stock
            }))
            .filter(variant => variant.stock > 0),
        total_stock: product.variants.reduce(
            (acc, variant) => acc + variant.stock,
            0
        )
    };

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Product retrieved successfully',
        data: transformedProduct
    });
});

const getAdminProducts = catchAsync(async (req, res) => {
    const productFilterableFields = [
        'search',
        'discount_type',
        'is_featured',
        'is_published',
        'category_id'
    ];
    const productSearchableFields = ['name', 'slug', 'sku'];

    const filters = pick(req.query, productFilterableFields);
    const options = pick(req.query, [
        'limit',
        'page',
        'sort_by',
        'sort_order'
    ]);

    const { page, limit, skip } = calculatePagination(options);
    const { search, ...filterData } = filters;

    // Prepare the conditions
    const andConditions = [
        ...(search
            ? [
                  {
                      OR: [
                          ...productSearchableFields.map(field => ({
                              [field]: {
                                  contains: search,
                                  mode: 'insensitive'
                              }
                          })),
                          {
                              category: {
                                  OR: [
                                      {
                                          name: {
                                              contains: search,
                                              mode: 'insensitive'
                                          }
                                      },
                                      {
                                          slug: {
                                              contains: search,
                                              mode: 'insensitive'
                                          }
                                      }
                                  ]
                              }
                          }
                      ]
                  }
              ]
            : []),
        ...(Object.keys(filterData).length > 0
            ? [
                  {
                      AND: Object.keys(filterData).map(field => ({
                          [field]: {
                              equals:
                                  field === 'is_published' ||
                                  field === 'is_featured'
                                      ? filterData[field] === 'true'
                                      : filterData[field]
                          }
                      }))
                  }
              ]
            : []),
        { is_deleted: false }
    ];

    const whereCondition = { AND: andConditions };

    // Sorting logic
    const orderBy =
        options.sort_by && options.sort_order
            ? { [options.sort_by]: options.sort_order }
            : { created_at: 'desc' };

    // Query to fetch the products
    const fetchProducts = async () => {
        if (options.sort_by === 'total_stock') {
            const products = await prisma.product.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    category_id: true,
                    name: true,
                    sku: true,
                    buy_price: true,
                    cost_price: true,
                    sell_price: true,
                    discount: true,
                    discount_type: true,
                    is_published: true,
                    is_featured: true,
                    category: { select: { name: true } },
                    images: {
                        select: { image_url: true, type: true }
                    },
                    variants: {
                        select: {
                            id: true,
                            size: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            },
                            stock: true
                        }
                    }
                }
            });

            return products
                .map(product => ({
                    ...product,
                    total_stock: product.variants.reduce(
                        (acc, variant) => acc + variant.stock,
                        0
                    )
                }))
                .sort((a, b) => {
                    const totalStockA = a.total_stock;
                    const totalStockB = b.total_stock;
                    return options.sort_order === 'asc'
                        ? totalStockA - totalStockB
                        : totalStockB - totalStockA;
                });
        }

        return await prisma.product.findMany({
            where: whereCondition,
            select: {
                id: true,
                category_id: true,
                name: true,
                sku: true,
                buy_price: true,
                cost_price: true,
                sell_price: true,
                discount: true,
                discount_type: true,
                is_published: true,
                is_featured: true,
                category: { select: { name: true } },
                images: { select: { image_url: true, type: true } },
                variants: {
                    select: {
                        id: true,
                        size: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        },
                        stock: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy
        });
    };

    const products = await fetchProducts();

    // Mapping and transformation logic
    const sizeOrder = ['s', 'm', 'l', 'xl', 'xxl'];
    const transformedProducts = products.map(product => {
        const discounted_price = product.discount
            ? product.discount_type === 'PERCENTAGE'
                ? product.sell_price -
                  (product.sell_price * product.discount) / 100
                : product.sell_price - product.discount
            : 0;

        return {
            ...product,
            discounted_price,
            variants: product.variants
                .sort(
                    (a, b) =>
                        sizeOrder.indexOf(a.size?.slug) -
                        sizeOrder.indexOf(b.size?.slug)
                )
                .map(variant => ({
                    id: variant.id,
                    size_id: variant.size?.id || null,
                    size: variant.size?.name || null,
                    slug: variant.size?.slug || null,
                    stock: variant.stock
                })),
            total_stock: product.variants.reduce(
                (acc, variant) => acc + variant.stock,
                0
            )
        };
    });

    // Count total products for pagination
    const total = await prisma.product.count({
        where: whereCondition
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Products retrieved successfully',
        meta: { page, limit, total },
        data: transformedProducts
    });
});

const getAdminProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: {
            id
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            images: {
                select: {
                    id: true,
                    image_url: true,
                    type: true
                }
            },
            variants: {
                select: {
                    id: true,
                    size: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    stock: true
                }
            }
        }
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }
    const sizeOrder = ['s', 'm', 'l', 'xl', 'xxl'];
    const transformedProduct = {
        ...product,
        variants: product.variants
            .sort(
                (a, b) =>
                    sizeOrder.indexOf(a.size?.slug) -
                    sizeOrder.indexOf(b.size?.slug)
            )
            .map(variant => ({
                id: variant.id,
                size_id: variant.size?.id || null,
                size: variant.size?.name || null,
                slug: variant.size?.slug || null,
                stock: variant.stock
            })),
        total_stock:
            product.variants && product.variants.length > 0
                ? product.variants.reduce(
                      (acc, variant) => acc + variant.stock,
                      0
                  )
                : 0
    };

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Product retrieved successfully',
        data: transformedProduct
    });
});

const updateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const productData = req.body;

    if (productData.name) {
        productData.slug = generateSlug(productData.name);
    }

    const product = await prisma.product.update({
        where: {
            id
        },
        data: productData
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Product updated successfully',
        data: product
    });
});

const updatePublishedStatus = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: {
            id
        }
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const updatedProduct = await prisma.product.update({
        where: {
            id
        },
        data: {
            is_published: !product.is_published
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Product published status updated successfully',
        data: updatedProduct
    });
});

const deleteProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.update({
        where: {
            id
        },
        data: {
            is_deleted: true
        }
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.NO_CONTENT,
        message: 'Product deleted successfully'
    });
});

const ProductController = {
    createProduct,
    getProductsByCategory,
    getCustomerProduct,
    globalSearchProducts,
    getAdminProducts,
    getAdminProduct,
    updateProduct,
    updatePublishedStatus,
    deleteProduct
};

module.exports = ProductController;
