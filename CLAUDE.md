# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Payload CMS 3.x e-commerce application** built with Next.js 15, TypeScript, and TailwindCSS with DaisyUI components. The project implements a full e-commerce solution with user authentication, product management, categories, orders, and media handling.

## Development Commands

### Core Development
- `pnpm dev` - Start development server (includes hot reload)
- `pnpm devsafe` - Clean start (removes .next cache first)
- `pnpm build` - Production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint for code quality

### Testing
- `pnpm test` - Run all tests (integration + e2e)
- `pnpm test:int` - Run integration tests with Vitest
- `pnpm test:e2e` - Run e2e tests with Playwright

### Payload CMS
- `pnpm payload` - Access Payload CLI commands
- `pnpm generate:types` - Generate TypeScript types from collections
- `pnpm generate:importmap` - Generate import map for admin UI

## Architecture

### Application Structure
The app follows **Next.js 15 App Router** with route groups:
- `(payload)` - Admin dashboard and API routes
- `(frontend)` - Public-facing e-commerce frontend

### Database & CMS
- **Payload CMS 3.x** for content management and API generation
- **MongoDB** via Mongoose adapter
- Auto-generated GraphQL and REST APIs
- Authentication system with role-based access (customer/admin)

### Collections Schema
- **Users**: Authentication-enabled with roles, addresses, preferences, cart
- **Products**: E-commerce items with variants, inventory, categories, images
- **Categories**: Product organization with hierarchical support
- **Orders**: Transaction records linked to customers
- **Media**: Upload handling with Sharp image processing

### Frontend Stack
- **Next.js 15** with React 19
- **TailwindCSS 4.x** + **DaisyUI** for UI components
- **TypeScript** with strict typing
- Responsive design with mobile-first approach

### Key Features
- Multi-currency support (USD, AF)
- Role-based access control
- Image optimization with Sharp
- Auto-generated product slugs
- Inventory management with stock tracking
- Address management with coordinates
- Shopping cart functionality

## Development Guidelines

### Environment Setup
- Requires Node.js ^18.20.2 or >=20.9.0
- Uses pnpm for package management
- MongoDB connection required (local or cloud)
- Environment variables in `.env` (copy from `.env.example`)

### Code Conventions
- TypeScript strict mode enabled
- ESLint configuration with Next.js rules
- Payload collections use CollectionConfig pattern
- Frontend components follow React functional pattern
- TailwindCSS with DaisyUI theme system

### File Structure Notes
- Collections defined in `src/collections/`
- Frontend components in `src/app/(frontend)/components/`
- Payload config in `src/payload.config.ts`
- Auto-generated types in `src/payload-types.ts`
- Admin UI customizations in `src/app/(payload)/`

### Testing Setup
- Vitest for unit/integration tests
- Playwright for end-to-end testing
- JSDOM environment for React component testing