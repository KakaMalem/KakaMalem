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
- `/{category}` - Category pages (e.g., `/electronics`) with infinite scroll
- `/shop/{slug}` - Individual product detail pages
- `/checkout` - Multi-step checkout (shipping, payment, review)
- `/order-confirmation/{id}` - Order success page

### Database & CMS

- **Payload CMS 3.x** for content management and API generation
- **MongoDB** via Mongoose adapter
- Auto-generated GraphQL and REST APIs
- Authentication system with role-based access (customer/admin)

**Collections:**

- `Users` - Auth-enabled with roles, addresses, shopping cart, wishlist
- `Products` - E-commerce items with `stockStatus` auto-updated via `beforeChange` hook
- `Categories` - Product organization with slugs used in routing
- `Orders` - Transaction records with automated `totalSold` updates
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

**Products:**

- `GET /api/search-products` - Search/filter products with pagination (supports `q`, `category`, `minPrice`, `maxPrice`, `rating`, `sort`, `page`, `limit`)

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
- Infinite scroll on shop and category pages (12 products per page)
- Stock status management with automatic updates
- Multi-currency support (USD, AF)
- Product reviews with verified purchase badges
- Star ratings displayed for all products (gray when no reviews)

**Checkout Flow:**

- Multi-step process: Shipping → Payment → Review
- Address selection with interactive map (Leaflet)
- Location picker with coordinates
- Payment methods: Cash on Delivery, Bank Transfer, Credit Card
- Guest checkout supported

**Inventory:**

- Automatic `stockStatus` calculation based on quantity
- `totalSold` tracking per product
- Low stock threshold configuration
- Backorder support

## Development Guidelines

### Environment Setup

- Requires Node.js ^18.20.2 or >=20.9.0
- Uses pnpm (v9 or v10) for package management
- MongoDB connection required (local or cloud)
- Environment variables in `.env` (copy from `.env.example`)
  - `DATABASE_URI` - MongoDB connection string
  - `PAYLOAD_SECRET` - Secret for Payload CMS

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
- `src/utilities/` - Shared utilities (includes `getMeUser` function)
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

- `beforeChange` hook in Products collection automatically updates `stockStatus`
- Hook runs based on `trackQuantity`, `quantity`, `lowStockThreshold`, and `allowBackorders`
- Never manually set `stockStatus` - let the hook handle it

**Order Processing:**

- Creates order record in database
- Updates product `totalSold` and `quantity`
- Clears user's cart after successful order
- Sends confirmation with order details

### Common Gotchas

- Don't run the build command on every change
- Category pages use category slug in URL: `/{category}` not `/shop/category/{category}`
- Cart slider has higher z-index (80) than navbar (60) and overlay (70)
- Product cards always show star ratings, even with 0 reviews
- Plus button on product cards accounts for existing cart quantity
- Checkout pages are in separate route group without navbar/footer
