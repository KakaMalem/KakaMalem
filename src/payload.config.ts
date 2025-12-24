import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { ProductVariants } from './collections/ProductVariants'
import { Orders } from './collections/Orders'
import { Reviews } from './collections/Reviews'
import { Terms } from './globals/Terms'
import { PrivacyPolicy } from './globals/PrivacyPolicy'
import { Help } from './globals/Help'
import { Shipping } from './globals/Shipping'
import { Contact } from './globals/Contact'
import { FAQs } from './globals/FAQs'
import { SiteSettings } from './globals/SiteSettings'
import { registerUser } from './endpoints/users/registerUser'
import { loginUser } from './endpoints/users/loginUser'
import { setPassword } from './endpoints/users/setPassword'
import { resendVerification } from './endpoints/users/resendVerification'
import { verifyEmail } from './endpoints/users/verifyEmail'
import { checkVerification } from './endpoints/users/checkVerification'
import { updateLocationEndpoint } from './endpoints/users/updateLocation'
import { getProducts } from './endpoints/getProducts'
import { trackProductView } from './endpoints/products/trackView'
import { getRecentlyViewed } from './endpoints/products/getRecentlyViewed'
import { mergeRecentlyViewed } from './endpoints/products/mergeRecentlyViewed'
import { getProductAnalytics } from './endpoints/products/getAnalytics'
import { addToCart } from './endpoints/cart/addToCart'
import { getCart } from './endpoints/cart/getCart'
import { updateCart } from './endpoints/cart/updateCart'
import { removeFromCart } from './endpoints/cart/removeFromCart'
import { clearCart } from './endpoints/cart/clearCart'
import { mergeCart } from './endpoints/cart/mergeCart'
import { createReview } from './endpoints/reviews/createReview'
import { getProductReviews } from './endpoints/reviews/getProductReviews'
import { getUserReview } from './endpoints/reviews/getUserReview'
import { updateReview } from './endpoints/reviews/updateReview'
import { deleteReview } from './endpoints/reviews/deleteReview'
import { markHelpful } from './endpoints/reviews/markHelpful'
import { addToWishlist } from './endpoints/wishlist/addToWishlist'
import { removeFromWishlist } from './endpoints/wishlist/removeFromWishlist'
import { createOrder } from './endpoints/orders/createOrder'
import { getUserOrders } from './endpoints/orders/getUserOrders'
import { getOrderConfirmation } from './endpoints/orders/getOrderConfirmation'
import { getProductVariants } from './endpoints/variants'

const getAllowedOrigins = (): string[] => {
  const baseUrls = [
    process.env.NEXT_PUBLIC_SERVER_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  ]
    .filter(Boolean)
    .map((url) => url?.trim())

  // Add development-specific URLs
  if (process.env.NODE_ENV === 'development') {
    baseUrls.push('http://localhost:3000')
    // Add VPS IP for testing from external devices
    if (process.env.VPS_IP) {
      baseUrls.push(`http://${process.env.VPS_IP}:3000`)
    }
  }

  // Remove duplicates and normalize (remove trailing slashes)
  return [...new Set(baseUrls.map((url) => url?.replace(/\/$/, '') || '').filter(Boolean))]
}

const allowedOrigins = getAllowedOrigins()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      actions: ['/components/ViewWebsiteAction#ViewWebsiteAction'],
      beforeLogin: ['/components/BeforeLogin#BeforeLogin'],
      afterLogin: ['/components/AfterLogin#AfterLogin'],
    },
  },
  collections: [Users, Media, Categories, Products, ProductVariants, Orders, Reviews],
  globals: [Terms, PrivacyPolicy, Help, Shipping, Contact, FAQs, SiteSettings],
  cookiePrefix: 'kakamalem',
  cors: allowedOrigins,
  csrf: allowedOrigins,
  endpoints: [
    registerUser,
    loginUser,
    setPassword,
    resendVerification,
    verifyEmail,
    checkVerification,
    updateLocationEndpoint,
    getProducts,
    trackProductView,
    getRecentlyViewed,
    mergeRecentlyViewed,
    getProductAnalytics,
    getProductVariants,
    addToCart,
    getCart,
    updateCart,
    removeFromCart,
    clearCart,
    mergeCart,
    createReview,
    getProductReviews,
    getUserReview,
    updateReview,
    deleteReview,
    markHelpful,
    addToWishlist,
    removeFromWishlist,
    createOrder,
    getUserOrders,
    getOrderConfirmation,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_EMAIL || 'noreply@kakamalem.com',
    defaultFromName: process.env.SMTP_FROM_NAME || 'Kaka Malem',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  plugins: [
    payloadCloudPlugin(),
    // Always register the plugin so import map includes UploadThing components,
    // but only enable it when the token is present (production)
    uploadthingStorage({
      enabled: !!(process.env.NODE_ENV === 'production'),
      collections: {
        media: true,
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN || '',
        acl: 'public-read',
      },
    }),
  ],
})
