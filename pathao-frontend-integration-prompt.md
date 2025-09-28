# Pathao Courier API Frontend Integration Prompt

Use this prompt to generate complete frontend code for integrating with the Pathao Courier API system.

## API Integration Requirements

**Base URL:** `http://localhost:8000`

**Authentication:** Bearer Token (obtained from admin login)

**Content-Type:** `application/json`

## API Endpoints Structure

### 🔐 Authentication

- **POST** `/auth/login` - Admin login to get access token

### 📍 Location Services

- **GET** `/pathao/cities` - Get available cities
- **GET** `/pathao/cities/{cityId}/zones` - Get zones for a city
- **GET** `/pathao/zones/{zoneId}/areas` - Get areas for a zone

### 💰 Price & Store Services

- **POST** `/pathao/price/calculate` - Calculate delivery price
- **GET** `/pathao/stores` - Get merchant stores

### 📦 Order Management

- **GET** `/pathao/orders` - Get all orders (with pagination)
- **GET** `/pathao/orders/{orderId}` - Get order details
- **PATCH** `/pathao/orders/{orderId}/status` - Update order status
- **GET** `/pathao/orders/info/{consignmentId}` - Get order by consignment ID

### 🚚 Create Orders

- **POST** `/pathao/order` - Create single order
- **POST** `/pathao/orders/bulk` - Create bulk orders

## Code Generation Instructions

Please generate a complete frontend integration solution with the following specifications:

### 1. **Framework/Technology Stack**

- Choose: [React/Vue.js/Angular/Vanilla JavaScript]
- State Management: [Redux/Vuex/NgRx/Context API]
- HTTP Client: [Axios/Fetch API]
- UI Framework: [Material-UI/Ant Design/Bootstrap/Tailwind CSS]

### 2. **Required Components/Services**

#### A. **Authentication Service**

```javascript
// Login credentials
{
  "email": "superadmin@ecommerce.com",
  "password": "1234567"
}
```

- Handle login/logout
- Token storage and management
- Auto token refresh
- Protected route handling

#### B. **Pathao API Service**

Create service methods for all endpoints with:

- Proper error handling
- Loading states
- Response data transformation
- Request interceptors for authentication

#### C. **Location Management**

- City selector component
- Zone selector (dependent on city)
- Area selector (dependent on zone)
- Location hierarchy management

#### D. **Price Calculator**

```javascript
// Price calculation payload
{
  "item_type": 2,
  "delivery_type": 48,
  "item_weight": "0.5",
  "recipient_city": 1,
  "recipient_zone": 3069
}
```

#### E. **Order Management Dashboard**

- Order listing with pagination
- Order search functionality
- Order details view
- Status update functionality
- Bulk operations

#### F. **Order Creation Form**

```javascript
// Single order payload
{
  "order_id": "ORD-TEST-001",
  "recipient_name": "John Doe",
  "recipient_phone": "01712345678",
  "recipient_secondary_phone": "01787654321",
  "recipient_address": "House 123, Road 4, Sector 10, Uttara, Dhaka-1230, Bangladesh",
  "delivery_type": 48,
  "item_type": 2,
  "special_instruction": "Please deliver before 5 PM",
  "item_quantity": 1,
  "item_weight": "0.5",
  "item_description": "Clothing items",
  "amount_to_collect": 900
}
```

### 3. **Required Features**

#### A. **Form Validation**

- Phone number validation (Bangladesh format)
- Address validation
- Weight and quantity validation
- Required field validation

#### B. **Error Handling**

- Network error handling
- API error response handling
- User-friendly error messages
- Retry mechanisms

#### C. **Loading States**

- Button loading states
- Page loading indicators
- Skeleton loaders for data fetching

#### D. **Data Management**

- Local state management
- Caching for location data
- Optimistic updates
- Data synchronization

### 4. **UI/UX Requirements**

#### A. **Responsive Design**

- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interfaces

#### B. **User Experience**

- Intuitive navigation
- Clear visual feedback
- Confirmation dialogs for critical actions
- Progress indicators for multi-step processes

#### C. **Accessibility**

- ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Color contrast compliance

### 5. **Code Structure**

#### A. **File Organization**

```
src/
├── components/
│   ├── pathao/
│   │   ├── LocationSelector.jsx
│   │   ├── PriceCalculator.jsx
│   │   ├── OrderForm.jsx
│   │   ├── OrderList.jsx
│   │   └── OrderDetails.jsx
├── services/
│   ├── api.js
│   ├── pathaoService.js
│   └── authService.js
├── hooks/
│   ├── useAuth.js
│   ├── usePathao.js
│   └── useOrders.js
├── utils/
│   ├── constants.js
│   ├── validators.js
│   └── helpers.js
└── pages/
    ├── Dashboard.jsx
    ├── Orders.jsx
    └── CreateOrder.jsx
```

#### B. **Configuration**

- Environment variables for API endpoints
- Configuration for different environments
- Feature flags for optional functionality

### 6. **Additional Requirements**

#### A. **Performance Optimization**

- Code splitting
- Lazy loading
- Memoization for expensive operations
- Debounced search functionality

#### B. **Testing**

- Unit tests for services
- Component testing
- Integration tests for API calls
- E2E tests for critical flows

#### C. **Documentation**

- Component documentation
- API service documentation
- Setup and deployment instructions
- Usage examples

### 7. **Sample Implementation Patterns**

#### A. **API Service Pattern**

```javascript
class PathaoService {
    async login(credentials) {
        /* implementation */
    }
    async getCities() {
        /* implementation */
    }
    async calculatePrice(data) {
        /* implementation */
    }
    async createOrder(orderData) {
        /* implementation */
    }
    // ... other methods
}
```

#### B. **React Hook Pattern**

```javascript
const usePathaoOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Implementation
    return { orders, loading, error, fetchOrders, createOrder };
};
```

#### C. **Error Boundary Pattern**

```javascript
class PathaoErrorBoundary extends Component {
    // Error boundary implementation
}
```

## Expected Output

Generate a complete, production-ready frontend application that:

1. **Implements all API endpoints** with proper error handling
2. **Provides intuitive UI components** for all Pathao operations
3. **Includes comprehensive form validation** and user feedback
4. **Handles authentication** and token management seamlessly
5. **Supports responsive design** across all devices
6. **Includes proper loading states** and error handling
7. **Follows best practices** for the chosen framework
8. **Includes TypeScript definitions** (if applicable)
9. **Provides comprehensive documentation** and examples
10. **Includes unit tests** for critical functionality

## Additional Context

- This is for a courier delivery system integration
- Users will primarily be admin users managing orders
- The system should handle both single and bulk order operations
- Location selection should be hierarchical (City → Zone → Area)
- Price calculation should be real-time based on location and item details
- Order tracking and status updates are critical features

Please generate the complete codebase with all necessary files, configurations, and documentation.
