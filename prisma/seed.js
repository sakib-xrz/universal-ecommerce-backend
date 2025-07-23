const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');
const { UserRole } = require('@prisma/client');

const seedSuperAdmin = async () => {
    try {
        const isExistSuperAdmin = await prisma.user.findFirst({
            where: {
                role: UserRole.SUPER_ADMIN
            }
        });

        if (isExistSuperAdmin) {
            console.log('Super admin already exists!');
            return;
        }

        const hashedPassword = await bcrypt.hash('123456', 12);

        await prisma.user.create({
            data: {
                email: 'superadmin@ecommerce.com',
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN,
                need_password_change: true,
                profile: {
                    create: {
                        name: `Super Admin`,
                        phone: '+8801000000000',
                        email: 'superadmin@ecommerce.com'
                    }
                }
            }
        });

        console.log('Super Admin Created Successfully!', {
            email: 'superadmin@ecommerce.com',
            password: '123456'
        });

        await prisma.setting.create({
            data: {
                title: 'Ecommerce',
                description: 'Best e-commerce shop in Bangladesh',
                keywords: 'e-commerce',
                logo: '',
                favicon: '',
                address: 'Dhaka, Bangladesh',
                phone: '+8801000000000',
                email: 'superadmin@ecommerce.com',
                facebook: 'https://www.facebook.com/e-commerce',
                instagram: 'https://www.instagram.com/e-commerce'
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
};

seedSuperAdmin();
