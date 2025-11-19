// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Reviews } from './collections/Reviews'
import { Terms } from './globals/Terms'
import { PrivacyPolicy } from './globals/PrivacyPolicy'
import { registerUser } from './endpoints/registerUser'
import { loginUser } from './endpoints/loginUser'
import { getProducts } from './endpoints/getProducts'
import { addToCart } from './endpoints/cart/addToCart'
import { getCart } from './endpoints/cart/getCart'
import { updateCart } from './endpoints/cart/updateCart'
import { removeFromCart } from './endpoints/cart/removeFromCart'
import { clearCart } from './endpoints/cart/clearCart'
import { mergeCart } from './endpoints/cart/mergeCart'
import { createReview } from './endpoints/reviews/createReview'
import { getProductReviews } from './endpoints/reviews/getProductReviews'
import { markHelpful } from './endpoints/reviews/markHelpful'
import { addToWishlist } from './endpoints/wishlist/addToWishlist'
import { removeFromWishlist } from './endpoints/wishlist/removeFromWishlist'
import { createOrder } from './endpoints/orders/createOrder'
import { getUserOrders } from './endpoints/orders/getUserOrders'
import { getOrderConfirmation } from './endpoints/orders/getOrderConfirmation'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Products, Orders, Reviews],
  globals: [Terms, PrivacyPolicy],
  endpoints: [
    registerUser,
    loginUser,
    getProducts,
    addToCart,
    getCart,
    updateCart,
    removeFromCart,
    clearCart,
    mergeCart,
    createReview,
    getProductReviews,
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
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
