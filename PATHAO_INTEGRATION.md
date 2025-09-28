# Pathao Courier Integration

This document describes the Pathao Courier delivery system integration for the e-commerce backend.

## Overview

The Pathao integration allows you to:

- Create delivery orders in Pathao for existing orders
- Calculate delivery prices
- Track order status
- Manage bulk orders
- Get delivery area information

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Pathao Courier API Configuration
PATHAO_BASE_URL=https://courier-api-sandbox.pathao.com  # For production: https://api-hermes.pathao.com
PATHAO_CLIENT_ID=your_client_id
PATHAO_CLIENT_SECRET=your_client_secret
PATHAO_USERNAME=your_email@example.com
PATHAO_PASSWORD=your_password
PATHAO_STORE_ID=your_store_id
```

### Sandbox/Test Environment Credentials

For testing, you can use these sandbox credentials:

- **Base URL**: `https://courier-api-sandbox.pathao.com`
- **Client ID**: `7N1aMJQbWm`
- **Client Secret**: `wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39`
- **Username**: `test@pathao.com`
- **Password**: `lovePathao`

## API Endpoints

### 1. Create Pathao Order

**POST** `/api/pathao/order`

Creates a Pathao delivery order for an existing order.

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "order_id": "ORD-2024-001",
    "recipient_name": "John Doe",
    "recipient_phone": "01712345678",
    "recipient_secondary_phone": "01787654321", // optional
    "recipient_address": "House 123, Road 4, Sector 10, Uttara, Dhaka-1230, Bangladesh",
    "delivery_type": 48, // 48 for Normal Delivery, 12 for On Demand
    "item_type": 2, // 1 for Document, 2 for Parcel
    "special_instruction": "Need to deliver before 5 PM", // optional
    "item_quantity": 1, // optional
    "item_weight": "0.5", // optional, between 0.5-10 kg
    "item_description": "Clothing items", // optional
    "amount_to_collect": 900 // optional, COD amount
}
```

**Response:**

```json
{
    "success": true,
    "message": "Pathao order created successfully",
    "data": {
        "pathao_order": {
            "id": "uuid",
            "order_id": "ORD-2024-001",
            "consignment_id": "PATH123456",
            "delivery_fee": 80,
            "order_status": "Pending"
        },
        "pathao_response": {
            "message": "Order Created Successfully",
            "data": {
                "consignment_id": "PATH123456",
                "delivery_fee": 80
            }
        }
    }
}
```

### 2. Create Bulk Pathao Orders

**POST** `/api/pathao/orders/bulk`

Creates multiple Pathao orders at once.

**Request Body:**

```json
{
    "orders": [
        {
            "order_id": "ORD-2024-001",
            "recipient_name": "John Doe",
            "recipient_phone": "01712345678",
            "recipient_address": "House 123, Road 4, Sector 10, Uttara, Dhaka-1230, Bangladesh"
        },
        {
            "order_id": "ORD-2024-002",
            "recipient_name": "Jane Smith",
            "recipient_phone": "01787654321",
            "recipient_address": "House 456, Road 8, Dhanmondi, Dhaka-1205, Bangladesh"
        }
    ]
}
```

### 3. Calculate Delivery Price

**POST** `/api/pathao/price/calculate`

Calculates the delivery price for a given location and item details.

**Request Body:**

```json
{
    "item_type": 2,
    "delivery_type": 48,
    "item_weight": "0.5",
    "recipient_city": 1,
    "recipient_zone": 298
}
```

**Response:**

```json
{
    "success": true,
    "message": "Delivery price calculated successfully",
    "data": {
        "price": 80,
        "discount": 0,
        "final_price": 80,
        "cod_enabled": 1
    }
}
```

### 4. Get Cities

**GET** `/api/pathao/cities`

Retrieves list of available cities.

**Response:**

```json
{
    "success": true,
    "message": "Cities retrieved successfully",
    "data": {
        "data": [
            {
                "city_id": 1,
                "city_name": "Dhaka"
            },
            {
                "city_id": 2,
                "city_name": "Chittagong"
            }
        ]
    }
}
```

### 5. Get Zones

**GET** `/api/pathao/cities/:cityId/zones`

Retrieves zones for a specific city.

**Response:**

```json
{
    "success": true,
    "message": "Zones retrieved successfully",
    "data": {
        "data": [
            {
                "zone_id": 298,
                "zone_name": "60 feet"
            },
            {
                "zone_id": 1070,
                "zone_name": "Abdullahpur Uttara"
            }
        ]
    }
}
```

### 6. Get Areas

**GET** `/api/pathao/zones/:zoneId/areas`

Retrieves areas for a specific zone.

**Response:**

```json
{
    "success": true,
    "message": "Areas retrieved successfully",
    "data": {
        "data": [
            {
                "area_id": 37,
                "area_name": "Bonolota",
                "home_delivery_available": true,
                "pickup_available": true
            }
        ]
    }
}
```

### 7. Get All Pathao Orders

**GET** `/api/pathao/orders?page=1&limit=10&search=ORD-2024`

Retrieves all Pathao orders with pagination and search.

### 8. Get Pathao Order Details

**GET** `/api/pathao/orders/:orderId`

Retrieves detailed information about a specific Pathao order.

### 9. Update Pathao Order Status

**PATCH** `/api/pathao/orders/:orderId/status`

Updates the status of a Pathao order.

**Request Body:**

```json
{
    "pathao_status": "Delivered"
}
```

### 10. Get Pathao Order Info

**GET** `/api/pathao/orders/info/:consignmentId`

Gets order information from Pathao using consignment ID.

## Database Schema

The integration adds a new `PathaoOrder` model to track Pathao delivery orders:

```prisma
model PathaoOrder {
  id                    String   @id @default(uuid())
  order_id              String   @unique
  consignment_id        String?  @unique
  merchant_order_id     String
  recipient_name        String
  recipient_phone       String
  recipient_address     String
  delivery_type         Int      @default(48)
  item_type             Int      @default(2)
  special_instruction   String?
  item_quantity         Int      @default(1)
  item_weight           String   @default("0.5")
  item_description      String?
  amount_to_collect     Int      @default(0)
  delivery_fee          Float?
  order_status          String?
  pathao_status         String?
  order                 Order    @relation(fields: [order_id], references: [order_id], onDelete: Cascade)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  @@map("pathao_orders")
}
```

## Usage Examples

### Creating a Pathao Order

1. First, create a regular order using the existing order API
2. Then create a Pathao delivery order:

```javascript
const response = await fetch('/api/pathao/order', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer <admin_token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        order_id: 'ORD-2024-001',
        recipient_name: 'John Doe',
        recipient_phone: '01712345678',
        recipient_address:
            'House 123, Road 4, Sector 10, Uttara, Dhaka-1230, Bangladesh',
        special_instruction: 'Please deliver before 5 PM',
        amount_to_collect: 900
    })
});
```

### Calculating Delivery Price

```javascript
const response = await fetch('/api/pathao/price/calculate', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer <token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        item_type: 2,
        delivery_type: 48,
        item_weight: '0.5',
        recipient_city: 1,
        recipient_zone: 298
    })
});
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid request data or Pathao API error
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order or resource not found
- `500 Internal Server Error`: Server error

## Authentication

All Pathao endpoints require authentication:

- Admin endpoints require `SUPER_ADMIN` role
- Price calculation and area lookup endpoints allow both `SUPER_ADMIN` and `CUSTOMER` roles

## Important Notes

1. **Address Format**: Use complete addresses including street name, area, and district for automatic zone detection
2. **Phone Numbers**: Must be exactly 11 characters (Bangladesh format)
3. **Weight Limits**: Items must be between 0.5kg and 10kg
4. **Token Management**: The service automatically handles Pathao API token refresh
5. **Error Logging**: All Pathao API errors are logged for debugging

## Testing

Use the sandbox environment for testing:

- Base URL: `https://courier-api-sandbox.pathao.com`
- Test credentials are provided in the environment configuration section

## Production Deployment

For production:

1. Update `PATHAO_BASE_URL` to `https://api-hermes.pathao.com`
2. Use your production Pathao credentials
3. Ensure your store is approved in Pathao's system
4. Test thoroughly before going live
