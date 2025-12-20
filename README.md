# Kaka Malem

![Deploy](https://github.com/KakaMalem/KakaMalem/actions/workflows/deploy.yml/badge.svg)

E-commerce platform built with Payload CMS 3.x, Next.js 15, and TailwindCSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **CMS**: Payload CMS 3.x
- **Database**: MongoDB
- **Styling**: TailwindCSS + DaisyUI
- **Auth**: Email/Password + Google OAuth
- **Deployment**: Ubuntu VPS with Nginx

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB (local or Atlas)

### Setup

```bash
# Clone repository
git clone https://github.com/KakaMalem/KakaMalem.git
cd KakaMalem

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
DATABASE_URI=mongodb://localhost:27017/kakamalem
PAYLOAD_SECRET=your-secret-key
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

## Commands

| Command               | Description               |
| --------------------- | ------------------------- |
| `pnpm dev`            | Start development server  |
| `pnpm build`          | Build for production      |
| `pnpm start`          | Start production server   |
| `pnpm lint`           | Run ESLint                |
| `pnpm generate:types` | Generate TypeScript types |
| `pnpm devsafe`        | Clean cache and start dev |

## Deployment

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for complete deployment guide.

**Quick deploy** (after initial setup):

```bash
git push origin main
```

GitHub Actions automatically builds, tests, and deploys to production.

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (frontend)/         # Public pages
│   └── (payload)/          # Admin panel
├── collections/            # Payload collections
├── globals/                # Payload globals
├── endpoints/              # Custom API endpoints
└── access/                 # Access control
```
