# Pathao Integration Testing Guide

This guide explains how to test the Pathao Courier integration using both the test script and Postman collection.

## 🧪 Method 1: Using the Test Script

### Prerequisites

1. Make sure your `.env` file has the correct Pathao credentials
2. Ensure your server is running
3. Have Node.js installed

### Running the Test Script

```bash
# Navigate to your backend directory
cd "/home/niloy-roy/Desktop/OFFICE/RUBEL VAI/backend"

# Run the test script
node test_pathao.js
```

### Expected Output

```
🚀 Testing Pathao Integration...

1. Testing getCities()...
✅ Cities retrieved successfully
   Found 3 cities

2. Testing getZones() for city: Dhaka...
✅ Zones retrieved successfully
   Found 15 zones

3. Testing getAreas() for zone: 60 feet...
✅ Areas retrieved successfully
   Found 8 areas

4. Testing calculatePrice()...
✅ Price calculated successfully
   Delivery fee: 80 BDT

5. Testing getStores()...
✅ Stores retrieved successfully
   Found 1 stores

🎉 All Pathao integration tests passed!

📋 Summary:
   - Authentication: ✅ Working
   - Cities API: ✅ Working
   - Zones API: ✅ Working
   - Areas API: ✅ Working
   - Price Calculation: ✅ Working
   - Stores API: ✅ Working
```

### Troubleshooting Test Script

If the test fails, check:

1. **Environment Variables**: Ensure all Pathao credentials are set in `.env`
2. **Internet Connection**: Pathao API requires internet access
3. **Credentials**: Verify your Pathao credentials are correct
4. **Store ID**: Make sure `PATHAO_STORE_ID` is set

## 📮 Method 2: Using Postman Collection

### Step 1: Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the file: `Pathao_API_Collection.postman_collection.json`
4. The collection will be imported with all endpoints

### Step 2: Set Environment Variables

1. In Postman, go to "Environments"
2. Create a new environment or use existing one
3. Add these variables:
    - `base_url`: `http://localhost:8000` (or your server URL)
    - `admin_token`: (will be set after login)

### Step 3: Get Admin Token

1. Run the "Admin Login" request first
2. Copy the `accessToken` from the response
3. Set it as the `admin_token` environment variable

### Step 4: Test the Endpoints

#### Test Order (Recommended):

1. **Get Cities** - Verify Pathao connection
2. **Get Zones** - Test location services
3. **Calculate Price** - Test price calculation
4. **Get Stores** - Verify store configuration
5. **Create Regular Order** - Create prerequisite order
6. **Create Pathao Order** - Test order creation

## 🔧 Environment Setup

### Required Environment Variables

Add these to your `.env` file:

```env
# Pathao Courier API Configuration
PATHAO_BASE_URL=https://courier-api-sandbox.pathao.com
PATHAO_CLIENT_ID=7N1aMJQbWm
PATHAO_CLIENT_SECRET=wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39
PATHAO_USERNAME=test@pathao.com
PATHAO_PASSWORD=lovePathao
PATHAO_STORE_ID=your_store_id
```

### Getting Your Store ID

1. First, run the "Get Merchant Stores" endpoint
2. Copy the `store_id` from the response
3. Update your `.env` file with the correct `PATHAO_STORE_ID`

## 📋 Testing Checklist

### Basic Connectivity Tests

- [ ] Test script runs without errors
- [ ] Cities endpoint returns data
- [ ] Zones endpoint returns data
- [ ] Areas endpoint returns data
- [ ] Price calculation works
- [ ] Stores endpoint returns data

### Order Management Tests

- [ ] Create regular order successfully
- [ ] Create Pathao order successfully
- [ ] Get Pathao order details
- [ ] Update Pathao order status
- [ ] Get all Pathao orders with pagination

### Error Handling Tests

- [ ] Test with invalid credentials
- [ ] Test with missing required fields
- [ ] Test with invalid order ID
- [ ] Test with invalid phone numbers
- [ ] Test with invalid addresses

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to authenticate with Pathao"

**Solution:**

- Check your Pathao credentials in `.env`
- Ensure you're using the correct environment (sandbox/production)
- Verify your account is active

### Issue 2: "Store not found"

**Solution:**

- Run "Get Merchant Stores" to get your store ID
- Update `PATHAO_STORE_ID` in your `.env` file
- Ensure your store is approved in Pathao system

### Issue 3: "Order not found"

**Solution:**

- Create a regular order first using the orders API
- Use the correct order ID format
- Ensure the order exists in your database

### Issue 4: "Invalid phone number"

**Solution:**

- Use exactly 11 digits (Bangladesh format)
- Start with 01 (e.g., 01712345678)
- No spaces or special characters

### Issue 5: "Address too short"

**Solution:**

- Use complete addresses with street, area, and district
- Minimum 10 characters required
- Include postal code if available

## 📊 Sample Test Data

### Valid Test Order

```json
{
    "order_id": "ORD-TEST-001",
    "recipient_name": "Test User",
    "recipient_phone": "01712345678",
    "recipient_address": "House 123, Road 4, Sector 10, Uttara, Dhaka-1230, Bangladesh",
    "delivery_type": 48,
    "item_type": 2,
    "special_instruction": "Test delivery",
    "item_quantity": 1,
    "item_weight": "0.5",
    "item_description": "Test item",
    "amount_to_collect": 100
}
```

### Valid Price Calculation

```json
{
    "item_type": 2,
    "delivery_type": 48,
    "item_weight": "0.5",
    "recipient_city": 1,
    "recipient_zone": 298
}
```

## 🎯 Success Criteria

Your Pathao integration is working correctly if:

1. ✅ Test script runs without errors
2. ✅ All API endpoints return expected responses
3. ✅ Orders can be created successfully
4. ✅ Price calculation works
5. ✅ Order tracking functions properly
6. ✅ Error handling works as expected

## 📞 Support

If you encounter issues:

1. Check the error logs in your server console
2. Verify your environment configuration
3. Test with the provided sandbox credentials first
4. Review the Pathao API documentation
5. Check your internet connection and Pathao service status

## 🚀 Next Steps

After successful testing:

1. Switch to production credentials
2. Test with real orders
3. Implement error monitoring
4. Set up webhook notifications (if needed)
5. Train your team on the new system

Happy testing! 🎉
