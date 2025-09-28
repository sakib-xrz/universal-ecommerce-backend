# Quick Test Examples for Pathao Integration

## 🚀 How to Test the Pathao Integration

### Method 1: Run the Test Script (Easiest)

```bash
# Navigate to your backend directory
cd "/home/niloy-roy/Desktop/OFFICE/RUBEL VAI/backend"

# Run the automated test
node test_pathao.js
```

### Method 2: Use the Setup Script

```bash
# Run the setup script (checks environment and runs tests)
./setup_pathao_testing.sh
```

### Method 3: Manual Testing with cURL

#### 1. Test Cities Endpoint

```bash
curl -X GET "http://localhost:8000/api/pathao/cities" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### 2. Test Price Calculation

```bash
curl -X POST "http://localhost:8000/api/pathao/price/calculate" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_type": 2,
    "delivery_type": 48,
    "item_weight": "0.5",
    "recipient_city": 1,
    "recipient_zone": 298
  }'
```

#### 3. Test Create Pathao Order

```bash
curl -X POST "http://localhost:8000/api/pathao/order" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-TEST-001",
    "recipient_name": "Test User",
    "recipient_phone": "01712345678",
    "recipient_address": "House 123, Road 4, Sector 10, Uttara, Dhaka-1230, Bangladesh",
    "amount_to_collect": 100
  }'
```

### Method 4: Using Postman

1. **Import Collection**: Import `Pathao_API_Collection.postman_collection.json`
2. **Set Environment**:
    - `base_url`: `http://localhost:8000`
    - `admin_token`: Get from login response
3. **Test Order**:
    - Admin Login → Get Cities → Calculate Price → Create Order

## 🔧 Prerequisites

### 1. Environment Setup

Make sure your `.env` file contains:

```env
PATHAO_BASE_URL=https://courier-api-sandbox.pathao.com
PATHAO_CLIENT_ID=7N1aMJQbWm
PATHAO_CLIENT_SECRET=wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39
PATHAO_USERNAME=test@pathao.com
PATHAO_PASSWORD=lovePathao
PATHAO_STORE_ID=your_store_id
```

### 2. Get Your Store ID

First, test the stores endpoint to get your store ID:

```bash
curl -X GET "http://localhost:8000/api/pathao/stores" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Then update your `.env` file with the correct `PATHAO_STORE_ID`.

### 3. Create a Regular Order First

Before creating a Pathao order, you need a regular order:

```bash
curl -X POST "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "email": "test@example.com",
    "phone": "01712345678",
    "is_inside_dhaka": true,
    "address_line": "House 123, Road 4, Sector 10, Uttara, Dhaka-1230, Bangladesh",
    "product": [
      {
        "product_id": "your-product-id",
        "variant_id": "your-variant-id",
        "quantity": 1
      }
    ],
    "payment_method": "CASH_ON_DELIVERY"
  }'
```

## 📋 Test Checklist

- [ ] Environment variables set correctly
- [ ] Server is running on port 8000
- [ ] Admin token obtained
- [ ] Cities endpoint works
- [ ] Price calculation works
- [ ] Regular order created
- [ ] Pathao order created successfully
- [ ] Order details retrieved
- [ ] Order status updated

## 🎯 Expected Results

### Successful Test Script Output:

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
```

### Successful API Response Example:

```json
{
    "success": true,
    "message": "Pathao order created successfully",
    "data": {
        "pathao_order": {
            "id": "uuid",
            "order_id": "ORD-TEST-001",
            "consignment_id": "PATH123456",
            "delivery_fee": 80,
            "order_status": "Pending"
        }
    }
}
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Failed to authenticate"** → Check Pathao credentials
2. **"Store not found"** → Get store ID from stores endpoint
3. **"Order not found"** → Create regular order first
4. **"Invalid phone"** → Use 11-digit Bangladesh format
5. **"Address too short"** → Use complete address

### Quick Fixes:

- Verify `.env` file has all required variables
- Check server is running: `npm start` or `node src/server.js`
- Test internet connection to Pathao API
- Use sandbox credentials for testing

## 🎉 Success!

If all tests pass, your Pathao integration is working correctly and ready for production use!
