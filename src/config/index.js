const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') });

module.exports = {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT || 8000,

    database_url: process.env.DATABASE_URL,

    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

    jwt: {
        secret: process.env.JWT_SECRET,
        refresh_secret: process.env.JWT_REFRESH_SECRET,
        expires_in: process.env.JWT_EXPIRES_IN,
        refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
        reset_password_secret: process.env.JWT_RESET_PASSWORD_SECRET,
        reset_password_expires_in:
            process.env.JWT_RESET_PASSWORD_EXPIRES_IN
    },

    frontend_base_url: process.env.FRONTEND_BASE_URL,
    backend_base_url: process.env.BACKEND_BASE_URL,

    reset_pass_url: process.env.RESET_PASS_URL,

    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    },

    emailSender: {
        email: process.env.EMAIL,
        app_pass: process.env.APP_PASS
    },

    delivery_charge: {
        inside_dhaka: process.env.DELIVERY_CHARGE_INSIDE_DHAKA,
        outside_dhaka: process.env.DELIVERY_CHARGE_OUTSIDE_DHAKA
    },

    ssl: {
        store_id: process.env.SSL_STORE_ID,
        store_pass: process.env.SSL_STORE_PASS
    },

    payment: {
        success_url: process.env.PAYMENT_SUCCESS_URL,
        fail_url: process.env.PAYMENT_FAIL_URL,
        cancel_url: process.env.PAYMENT_CANCEL_URL
    }
};
