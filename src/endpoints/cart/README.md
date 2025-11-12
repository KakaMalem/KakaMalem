# Cart API Endpoints

Production-grade cart management system with guest cart support and seamless cart merging on login.

## Features

- **Guest Cart Support**: Unauthenticated users can add items to cart (stored in HTTP-only cookies)
- **Cart Merging**: Automatically merge guest cart with user cart on login
- **Stock Validation**: Real-time inventory checking and quantity validation
- **Cart Limits**: Maximum 50 items per cart, 100 units per item
- **Data Validation**: Comprehensive input validation and error handling
- **Security**: HTTP-only cookies for guest carts, proper authentication checks

## Endpoints

### GET `/api/cart`

Get current cart (guest or authenticated user)

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "123",
        "quantity": 2,
        "addedAt": "2025-01-01T00:00:00.000Z",
        "product": {
          /* populated product data */
        },
        "isInStock": true,
        "availableQuantity": 10
      }
    ],
    "itemCount": 2,
    "subtotal": 49.99,
    "isEmpty": false
  }
}
```

### POST `/api/cart/add`

Add item to cart

**Request Body:**

```json
{
  "productId": "123",
  "quantity": 1,
  "variantId": "variant-456" // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product added to cart",
  "data": {
    "itemCount": 3,
    "items": [...]
  }
}
```

**Errors:**

- `400`: Invalid product ID, quantity validation failed, stock exceeded
- `404`: Product not found
- `500`: Server error

### POST `/api/cart/update`

Update item quantity in cart

**Request Body:**

```json
{
  "productId": "123",
  "quantity": 5,
  "variantId": "variant-456" // optional
}
```

**Notes:**

- Set `quantity: 0` to remove the item
- Validates stock availability

**Response:**

```json
{
  "success": true,
  "message": "Cart updated successfully",
  "data": {
    "itemCount": 5,
    "items": [...]
  }
}
```

### POST `/api/cart/remove`

Remove item from cart

**Request Body:**

```json
{
  "productId": "123",
  "variantId": "variant-456" // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "itemCount": 0,
    "items": []
  }
}
```

### POST `/api/cart/clear`

Clear entire cart

**Response:**

```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "itemCount": 0,
    "items": []
  }
}
```

### POST `/api/cart/merge`

Merge guest cart with user cart (call after login)

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "message": "Cart merged successfully",
  "data": {
    "itemCount": 5,
    "items": [...],
    "warnings": [
      "Product X: adjusted to 3 (available stock)"
    ]
  }
}
```

**Notes:**

- Automatically combines duplicate items
- Validates stock for all items
- Clears guest cart after successful merge
- Returns warnings for items adjusted due to stock limits

## Implementation Details

### Guest Cart Storage

- Stored in HTTP-only cookies (`guest_cart`)
- 30-day expiration
- SameSite=Lax for CSRF protection
- Automatically converted to user cart on login

### Cart Merging Logic

1. Retrieve guest cart from cookies
2. Retrieve user's existing cart from database
3. Combine items (sum quantities for duplicates)
4. Validate stock for all items
5. Cap at limits (50 items, 100 per item)
6. Save to user's cart
7. Clear guest cart cookie

### Stock Validation

- Real-time checks before adding/updating
- Automatic quantity adjustment in GET requests
- Clear error messages with available quantity
- Handles products with `trackQuantity` enabled

### Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "availableQuantity": 5 // for stock errors
}
```

## Security Considerations

1. **HTTP-Only Cookies**: Guest carts stored in HTTP-only cookies to prevent XSS
2. **Input Validation**: All inputs validated for type, range, and format
3. **Rate Limiting**: Ready for rate limiting middleware (not implemented in endpoints)
4. **Authentication**: User carts require authentication
5. **Stock Verification**: Prevents overselling by checking stock before operations

## Usage Example

### Frontend Integration

```typescript
// Add to cart (works for both guest and authenticated users)
const response = await fetch('/api/cart/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    productId: '123',
    quantity: 1,
  }),
})

// After login, merge carts
const mergeResponse = await fetch('/api/cart/merge', {
  method: 'POST',
  credentials: 'include',
  headers: {
    Authorization: `Bearer ${token}`, // If using JWT
  },
})
```

### React Hook Example

```typescript
export const useCart = () => {
  const [cart, setCart] = useState<CartData>({ items: [] })

  const addToCart = async (productId: string, quantity: number) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    })
    const data = await res.json()
    if (data.success) {
      await fetchCart() // Refresh cart
    }
    return data
  }

  const fetchCart = async () => {
    const res = await fetch('/api/cart', { credentials: 'include' })
    const data = await res.json()
    if (data.success) {
      setCart(data.data)
    }
  }

  return { cart, addToCart, fetchCart }
}
```

## Testing

### Test Scenarios

1. **Guest User Flow**
   - Add items to cart without login
   - Verify cart persists across page refreshes
   - Check cookie is set correctly

2. **Authenticated User Flow**
   - Login and add items
   - Verify cart stored in database
   - Check cart persists across sessions

3. **Cart Merging**
   - Add items as guest
   - Login with account that has items
   - Verify both carts merged correctly
   - Check duplicate items have summed quantities

4. **Stock Validation**
   - Try adding more than available stock
   - Verify error message
   - Check quantity adjustment on merge

5. **Edge Cases**
   - Add item with product that gets deleted
   - Exceed cart size limit (50 items)
   - Exceed per-item quantity limit (100)
   - Product goes out of stock between add and checkout

## Future Enhancements

1. **Rate Limiting**: Add rate limiting middleware to prevent abuse
2. **Cart Expiry**: Implement automatic cart cleanup for abandoned carts
3. **Analytics**: Track cart abandonment, conversion rates
4. **Webhooks**: Notify on cart events (for marketing automation)
5. **Optimistic Locking**: Handle race conditions in high-traffic scenarios
6. **Promo Codes**: Support discount codes and promotions
7. **Save for Later**: Allow users to move items to wishlist
