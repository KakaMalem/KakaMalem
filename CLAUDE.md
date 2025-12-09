# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Payload CMS 3.x e-commerce application** built with Next.js 15, TypeScript, and TailwindCSS with DaisyUI components. The project implements a full e-commerce solution with user authentication, product management, categories, orders, and media handling.

## Development Commands

### Core Development

- `pnpm dev` - Start development server (includes hot reload)
- `pnpm devsafe` - Clean `.next` directory and start dev server (use when encountering cache issues)
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Payload CMS

- `pnpm payload` - Access Payload CLI commands
- `pnpm generate:types` - Generate TypeScript types from collections (run after collection schema changes)
- `pnpm generate:importmap` - Generate import map for admin UI

### Testing

- `pnpm test` - Run all tests (integration + e2e)
- `pnpm test:int` - Run integration tests with Vitest
- `pnpm test:e2e` - Run end-to-end tests with Playwright

## Architecture

### Application Structure

The app follows **Next.js 15 App Router** with route groups:

- `(payload)` - Admin dashboard and API routes at `/admin`
- `(frontend)/(main)` - Public-facing pages with navbar and footer
- `(frontend)/(checkout)` - Checkout flow without navbar/footer

**Key routing patterns:**

- `/shop` - All products with infinite scroll
- `/category/{slug}` - Category pages (e.g., `/category/electronics`) with infinite scroll
- `/product/{slug}` - Individual product detail pages
- `/checkout` - Multi-step checkout (shipping, payment, review)
- `/order-confirmation/{id}` - Order success page
- `/account` - User account dashboard
- `/account/orders` - Order history
- `/account/addresses` - Saved addresses
- `/account/wishlist` - Wishlist
- `/account/settings` - Account settings

### Database & CMS

- **Payload CMS 3.x** for content management and API generation
- **MongoDB** via Mongoose adapter
- Auto-generated GraphQL and REST APIs
- Authentication system with role-based access (customer, seller, admin, superadmin, developer)

**Collections:**

- `Users` - Auth-enabled with roles (customer, seller, admin, superadmin, developer), addresses, shopping cart, wishlist
  - OAuth support (Google Sign-In) with profile picture and sub fields
  - `hasPassword` flag to track if OAuth users have set a custom password
  - Sellers have limited admin panel access (products, orders, media only)
- `Products` - E-commerce items with `stockStatus` auto-updated via `beforeChange` hook
  - Auto-assign seller field when created by seller role
  - Comprehensive analytics tracking: viewCount, uniqueViewCount, addToCartCount, wishlistCount, conversion rates
  - Analytics are system-managed (read-only) and automatically updated via endpoints
  - **Variant auto-generation**: When `hasVariants` is enabled and `variantOptions` are defined, all variant combinations are automatically created in the ProductVariants collection via `afterChange` hook
- `Categories` - Product organization with slugs used in routing
- `ProductVariants` - Product variant combinations (sizes, colors, etc.)
  - **Auto-generated** from product's `variantOptions` - no manual creation needed!
  - Each variant has independent pricing, stock, and images
  - First variant auto-marked as default
- `Orders` - Transaction records with automated `totalSold` updates
  - Complex access control: admins see all, sellers see only their product orders, customers see only their own
- `Reviews` - Product reviews with verification of purchases
- `Media` - Sharp-processed image uploads

**Globals:**

- `Terms` - Terms and conditions content
- `PrivacyPolicy` - Privacy policy content

### Frontend Stack

- **Next.js 15** with React 19
- **TailwindCSS 4.x** + **DaisyUI** for UI components
- **TypeScript** with strict typing
- **react-intersection-observer** for infinite scroll
- **react-hot-toast** for notifications
- **Leaflet** for interactive maps in address selection

### API Endpoints

Custom endpoints defined in `src/endpoints/`:

**Authentication:**

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/set-password` - Set password for OAuth users (allows OAuth users to enable password login)
- `GET /api/oauth/google` - Initiate Google OAuth flow
- `GET /api/oauth/google/callback` - Google OAuth callback handler

**Products:**

- `GET /api/search-products` - Search/filter products with pagination (supports `q`, `category`, `minPrice`, `maxPrice`, `rating`, `sort`, `page`, `limit`)

**Product Tracking & Analytics:**

- `POST /api/products/track-view` - Track product view (increments viewCount and uniqueViewCount)
- `GET /api/products/recently-viewed` - Get recently viewed products
- `POST /api/products/merge-recently-viewed` - Merge guest recently viewed on login
- `GET /api/products/:id/analytics` - Get product analytics (superadmin/developer only)

**Cart:**

- `POST /api/cart/add` - Add to cart
- `GET /api/cart` - Get current cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove` - Remove from cart
- `DELETE /api/cart/clear` - Clear cart
- `POST /api/cart/merge` - Merge guest cart on login

**Reviews:**

- `POST /api/reviews` - Create product review
- `GET /api/reviews/{productId}` - Get product reviews
- `POST /api/reviews/helpful` - Mark review as helpful

**Wishlist:**

- `POST /api/wishlist/add` - Add to wishlist
- `DELETE /api/wishlist/remove` - Remove from wishlist

**Orders:**

- `POST /api/orders` - Create order
- `GET /api/orders/user` - Get user's orders
- `GET /api/orders/confirmation/{id}` - Get order confirmation details

### Key Features

**E-commerce:**

- Shopping cart with persistent storage (localStorage for guests, database for authenticated users)
- Cart slider panel (slides from right, z-index: 80, with backdrop overlay)
- Infinite scroll on shop and category pages (12 products per page by default, configured in page components)
- Stock status management with automatic updates
- Multi-currency support (USD, AF)
- Product reviews with verified purchase badges
- Star ratings displayed for all products (gray when no reviews)
- Recently viewed products tracking (localStorage for guests, database for authenticated users)

**Checkout Flow:**

- Multi-step process: Shipping → Payment → Review
- Address selection with interactive map (Leaflet)
- Location picker with coordinates
- Payment methods: Cash on Delivery, Bank Transfer, Credit Card
- Guest checkout supported

**Inventory:**

- **Optional inventory tracking** - Toggle `trackQuantity` checkbox to enable/disable per product
- When `trackQuantity` is **enabled** (default):
  - Automatic `stockStatus` calculation based on quantity (read-only in admin)
  - Stock validation on add-to-cart and checkout
  - Quantity decremented when orders are placed
  - Low stock threshold configuration
  - Backorder support
- When `trackQuantity` is **disabled**:
  - Manual `stockStatus` control (editable in admin)
  - No stock validation - unlimited purchases allowed
  - Quantity field hidden in admin
  - Ideal for digital products, services, or products with unlimited availability
- `totalSold` tracking per product (always enabled regardless of inventory tracking)

## Development Guidelines

### Environment Setup

- Requires Node.js ^18.20.2 or >=20.9.0
- Uses pnpm (v9 or v10) for package management
- MongoDB connection required (local or cloud)
- Environment variables in `.env` (copy from `.env.example`)
  - `DATABASE_URI` - MongoDB connection string
  - `PAYLOAD_SECRET` - Secret for Payload CMS
  - `NEXT_PUBLIC_SERVER_URL` - Public URL (e.g., http://localhost:3000)
  - `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional, for Google Sign-In)
  - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional, for Google Sign-In)

### Code Conventions

- TypeScript strict mode enabled
- ESLint configuration with Next.js rules
- Payload collections use `CollectionConfig` pattern
- Frontend components follow React functional pattern
- Server components for data fetching, client components for interactivity

### File Structure

**Backend:**

- `src/collections/` - Payload collection definitions
- `src/endpoints/` - Custom API endpoints
- `src/globals/` - Global content types
- `src/access/` - Role-based access control functions
- `src/utilities/` - Shared utilities (includes `getMeUser` function)
- `src/fields/` - Custom field components for admin UI
  - `src/fields/slug/` - Slug field utilities
  - `src/fields/variantManager/` - Product variant manager UI component (see VARIANT_MANAGER.md)
- `src/payload.config.ts` - Payload CMS configuration
- `src/payload-types.ts` - Auto-generated types (do not edit manually)

**Frontend:**

- `src/app/(frontend)/components/` - Reusable React components
- `src/app/(frontend)/styles.css` - Global styles and custom DaisyUI theme
- `src/app/(frontend)/(main)/` - Main pages with navbar/footer
- `src/app/(frontend)/(checkout)/` - Checkout pages without navbar/footer

### Styling System

**DaisyUI Custom Theme (`kakamalem`):**

- Defined in `src/app/(frontend)/styles.css`
- Always use DaisyUI's semantic color classes: `primary`, `secondary`, `accent`, `base-100`, `base-200`, `base-content`, etc.
- **Never** use arbitrary color values - the centralized theme ensures consistency
- Primary color: Vibrant red (`oklch(58% 0.22 25)`)
- Clean white backgrounds with subtle gray variations
- OKLCH color space for better color consistency

**Common patterns:**

- Buttons: `btn btn-primary`, `btn btn-ghost`, `btn-sm`, `btn-disabled`
- Backgrounds: `bg-base-100`, `bg-base-200`, `bg-base-300`
- Text: `text-base-content`, `text-primary`
- Loading: `loading loading-spinner loading-lg text-primary`

### Access Control Architecture

The application uses a comprehensive role-based access control system defined in `src/access/`:

- **Roles hierarchy**: `developer` > `superadmin` > `admin` > `seller` > `customer`
- Access control functions for collections: `isAdmin`, `isAdminOrSelf`, `isAdminOrSeller`, `isAdminOrSellerOwner`, etc.
- Field-level access controls for sensitive data (e.g., OAuth fields restricted to system)
- Sellers have limited admin panel access (products, orders, media only)
- Products auto-assign seller field when created by seller role
- Orders implement complex access: admins see all, sellers see only their product orders, customers see only their own

### Important Patterns

**Infinite Scroll:**

- Use `react-intersection-observer` with sentinel element
- Fetch next page when sentinel comes into view
- Show loading spinner while fetching
- Display "end of results" message when done

**Cart Management:**

- Cart state stored in localStorage for guests
- Merged with database cart on login via `mergeCart` endpoint
- Cart slider controlled by state, not DaisyUI dropdown
- Closes on navigation with proper cleanup

**Product Stock Updates:**

- `beforeChange` hook in Products collection automatically updates `stockStatus` when `trackQuantity` is enabled
- Hook runs based on `trackQuantity`, `quantity`, `lowStockThreshold`, and `allowBackorders`
- When `trackQuantity` is enabled: Never manually set `stockStatus` - let the hook handle it (field is read-only)
- When `trackQuantity` is disabled: Manually set `stockStatus` as needed (field is editable)
- Stock validation in cart and checkout endpoints only runs when `trackQuantity === true`

**Order Processing:**

- Creates order record in database
- Updates product `totalSold` (always, regardless of inventory tracking)
- Updates product `quantity` only when `trackQuantity` is enabled
- Recalculates conversion rates when products are sold
- Clears user's cart after successful order
- Sends confirmation with order details

**Product Analytics:**

- Analytics are automatically tracked and updated across multiple endpoints:
  - `viewCount` and `uniqueViewCount` - Updated when product is viewed (track-view endpoint)
  - `addToCartCount` - Incremented when product is added to cart
  - `wishlistCount` - Incremented when product is added to wishlist
  - `conversionRate` - (totalSold / viewCount) × 100, recalculated on purchases
  - `cartConversionRate` - (totalSold / addToCartCount) × 100, recalculated on purchases
- Analytics fields are **only visible to superadmins and developers**
- Analytics fields are read-only - never manually edit them
- Access to analytics endpoint restricted to superadmins and developers only
- Tracks up to 1000 unique viewers per product for unique view counting

### Common Gotchas

- Don't run the build command on every change
- Category pages use category slug in URL: `/category/{slug}` (e.g., `/category/electronics`)
- Cart slider has higher z-index (80) than navbar (60) and overlay (70)
- Product cards always show star ratings, even with 0 reviews
- Plus button on product cards accounts for existing cart quantity
- Checkout pages are in separate route group without navbar/footer
