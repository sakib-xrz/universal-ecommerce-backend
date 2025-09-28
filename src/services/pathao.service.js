const axios = require('axios');
const config = require('../config/index.js');
const ApiError = require('../error/ApiError.js');
const httpStatus = require('http-status');
const prisma = require('../utils/prisma.js');

class PathaoService {
    constructor() {
        this.baseURL = config.pathao.base_url;
        this.clientId = config.pathao.client_id;
        this.clientSecret = config.pathao.client_secret;
        this.username = config.pathao.username;
        this.password = config.pathao.password;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Issue access token from Pathao API
     */
    async issueAccessToken() {
        try {
            const response = await axios.post(
                `${this.baseURL}/aladdin/api/v1/issue-token`,
                {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'password',
                    username: this.username,
                    password: this.password
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                this.refreshToken = response.data.refresh_token;
                this.tokenExpiry =
                    Date.now() + response.data.expires_in * 1000;

                return {
                    access_token: response.data.access_token,
                    refresh_token: response.data.refresh_token,
                    expires_in: response.data.expires_in
                };
            }

            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Failed to get access token from Pathao'
            );
        } catch (error) {
            console.error(
                'Pathao token issue error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to authenticate with Pathao'
            );
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        try {
            if (!this.refreshToken) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    'No refresh token available'
                );
            }

            const response = await axios.post(
                `${this.baseURL}/aladdin/api/v1/issue-token`,
                {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                this.refreshToken = response.data.refresh_token;
                this.tokenExpiry =
                    Date.now() + response.data.expires_in * 1000;

                return {
                    access_token: response.data.access_token,
                    refresh_token: response.data.refresh_token,
                    expires_in: response.data.expires_in
                };
            }

            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Failed to refresh access token from Pathao'
            );
        } catch (error) {
            console.error(
                'Pathao token refresh error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to refresh Pathao token'
            );
        }
    }

    /**
     * Get valid access token (issue new or refresh existing)
     */
    async getValidAccessToken() {
        // Check if token is expired or doesn't exist
        if (
            !this.accessToken ||
            !this.tokenExpiry ||
            Date.now() >= this.tokenExpiry
        ) {
            if (
                this.refreshToken &&
                this.tokenExpiry &&
                Date.now() < this.tokenExpiry + 300000
            ) {
                // 5 minutes buffer
                try {
                    return await this.refreshAccessToken();
                } catch (error) {
                    console.log(
                        'Refresh token failed, issuing new token'
                    );
                }
            }
            return await this.issueAccessToken();
        }

        return { access_token: this.accessToken };
    }

    /**
     * Create a new store in Pathao
     */
    async createStore(storeData) {
        try {
            const tokenData = await this.getValidAccessToken();

            const response = await axios.post(
                `${this.baseURL}/aladdin/api/v1/stores`,
                storeData,
                {
                    headers: {
                        'Content-Type':
                            'application/json; charset=UTF-8',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                'Pathao create store error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to create store in Pathao'
            );
        }
    }

    /**
     * Create a new order in Pathao
     */
    async createOrder(orderData) {
        try {
            const tokenData = await this.getValidAccessToken();

            console.log(orderData, 'orderData');

            const response = await axios.post(
                `${this.baseURL}/aladdin/api/v1/orders`,
                {
                    store_id: config.pathao.store_id,
                    merchant_order_id: orderData.merchant_order_id,
                    recipient_name: orderData.recipient_name,
                    recipient_phone: orderData.recipient_phone,
                    recipient_address: orderData.recipient_address,
                    delivery_type: orderData.delivery_type || 48, // 48 for Normal Delivery
                    item_type: orderData.item_type || 2, // 2 for Parcel
                    special_instruction:
                        orderData.special_instruction || null,
                    item_quantity: orderData.item_quantity || 1,
                    item_weight: orderData.item_weight || '0.5',
                    item_description:
                        orderData.item_description || null,
                    amount_to_collect:
                        orderData.amount_to_collect || 0
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            // response is success the update the order status to Placed

            console.log(response?.data, 'response');

            return response.data;
        } catch (error) {
            console.error(
                'Pathao create order error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to create order in Pathao'
            );
        }
    }

    /**
     * Create bulk orders in Pathao
     */
    async createBulkOrders(ordersData) {
        try {
            const tokenData = await this.getValidAccessToken();

            const response = await axios.post(
                `${this.baseURL}/aladdin/api/v1/orders/bulk`,
                {
                    orders: ordersData.map(order => ({
                        store_id: config.pathao.store_id,
                        merchant_order_id: order.merchant_order_id,
                        recipient_name: order.recipient_name,
                        recipient_phone: order.recipient_phone,
                        recipient_address: order.recipient_address,
                        delivery_type: order.delivery_type || 48,
                        item_type: order.item_type || 2,
                        special_instruction:
                            order.special_instruction || null,
                        item_quantity: order.item_quantity || 1,
                        item_weight: order.item_weight || '0.5',
                        item_description:
                            order.item_description || null,
                        amount_to_collect:
                            order.amount_to_collect || 0
                    }))
                },
                {
                    headers: {
                        'Content-Type':
                            'application/json; charset=UTF-8',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                'Pathao create bulk orders error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to create bulk orders in Pathao'
            );
        }
    }

    /**
     * Get order information from Pathao
     */
    async getOrderInfo(consignmentId) {
        try {
            const tokenData = await this.getValidAccessToken();

            const response = await axios.get(
                `${this.baseURL}/aladdin/api/v1/orders/${consignmentId}/info`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                'Pathao get order info error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to get order info from Pathao'
            );
        }
    }

    /**
     * Calculate delivery price
     */
    async calculatePrice(priceData) {
        try {
            const tokenData = await this.getValidAccessToken();

            console.log('Price calculation payload:', {
                store_id: config.pathao.store_id,
                item_type: priceData.item_type,
                delivery_type: priceData.delivery_type,
                item_weight: Number(priceData.item_weight),
                recipient_city: priceData.recipient_city,
                recipient_zone: priceData.recipient_zone
            });
            console.log(tokenData, 'tokenData');
            const response = await axios.post(
                `${this.baseURL}/aladdin/api/v1/merchant/price-plan`,
                {
                    store_id: config.pathao.store_id,
                    item_type: priceData.item_type || 2,
                    delivery_type: priceData.delivery_type || 48,
                    item_weight: Number(priceData.item_weight),
                    recipient_city: priceData.recipient_city,
                    recipient_zone: priceData.recipient_zone
                },
                {
                    headers: {
                        'Content-Type':
                            'application/json; charset=UTF-8',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            console.log(response, 'response');

            return response.data;
        } catch (error) {
            console.error(
                'Pathao calculate price error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to calculate price from Pathao'
            );
        }
    }

    /**
     * Get list of cities
     */
    async getCities() {
        try {
            const tokenData = await this.getValidAccessToken();

            const response = await axios.get(
                `${this.baseURL}/aladdin/api/v1/city-list`,
                {
                    headers: {
                        'Content-Type':
                            'application/json; charset=UTF-8',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                'Pathao get cities error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to get cities from Pathao'
            );
        }
    }

    /**
     * Get zones for a specific city
     */
    async getZones(cityId) {
        try {
            const tokenData = await this.getValidAccessToken();

            const response = await axios.get(
                `${this.baseURL}/aladdin/api/v1/cities/${cityId}/zone-list`,
                {
                    headers: {
                        'Content-Type':
                            'application/json; charset=UTF-8',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                'Pathao get zones error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to get zones from Pathao'
            );
        }
    }

    /**
     * Get areas for a specific zone
     */
    async getAreas(zoneId) {
        try {
            const tokenData = await this.getValidAccessToken();

            const response = await axios.get(
                `${this.baseURL}/aladdin/api/v1/zones/${zoneId}/area-list`,
                {
                    headers: {
                        'Content-Type':
                            'application/json; charset=UTF-8',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                'Pathao get areas error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to get areas from Pathao'
            );
        }
    }

    /**
     * Get merchant store information
     */
    async getStores() {
        try {
            const tokenData = await this.getValidAccessToken();

            const response = await axios.get(
                `${this.baseURL}/aladdin/api/v1/stores`,
                {
                    headers: {
                        'Content-Type':
                            'application/json; charset=UTF-8',
                        Authorization: `Bearer ${tokenData.access_token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(
                'Pathao get stores error:',
                error.response?.data || error.message
            );
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                error.response?.data?.message ||
                    'Failed to get stores from Pathao'
            );
        }
    }
}

module.exports = new PathaoService();
