'use client'

import React, { useState } from 'react'
import { Product } from '@/payload-types'
import { Star, Plus, Minus } from 'lucide-react'

type Props = {
  product: Product
}

export default function ProductDetailsClient({ product }: Props) {
  const images = (product.images ?? []).map((i: any) => i.image ?? i)
  const [selected, setSelected] = useState(0)
  const [qty, setQty] = useState(1)
  const [addedMsg, setAddedMsg] = useState<string | null>(null)

  const increase = () => setQty((q) => Math.min(99, q + 1))
  const decrease = () => setQty((q) => Math.max(1, q - 1))

  const addToCart = () => {
    try {
      const raw = localStorage.getItem('cart')
      const cart = raw ? JSON.parse(raw) : []
      // keep a simple cart item shape
      const item = {
        id: product.id,
        name: product.name,
        price: product.salePrice ?? product.price,
        qty,
        image: images[0] ?? '',
        slug: product.slug,
      }
      // if exists, increase qty
      const existing = cart.find((c: any) => c.id === item.id)
      if (existing) {
        existing.qty += qty
      } else {
        cart.push(item)
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      setAddedMsg('Added to cart')
      setTimeout(() => setAddedMsg(null), 2000)
    } catch (e) {
      console.error('cart error', e)
      setAddedMsg('Could not add to cart')
      setTimeout(() => setAddedMsg(null), 2000)
    }
  }

  const buyNow = () => {
    addToCart()
    // simple behavior: navigate to /cart — adapt to your routing
    window.location.href = '/cart'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Images (lg: span 7) */}
      <div className="lg:col-span-7">
        <div className="bg-base-200 rounded-md p-4">
          {/* main image */}
          <div className="w-full aspect-[4/3] rounded-md overflow-hidden flex items-center justify-center">
            {images[selected] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[selected]}
                alt={product.images?.[selected]?.alt ?? product.name}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground">No image</div>
            )}
          </div>

          {/* thumbnails */}
          {images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <button
                  key={String(i)}
                  onClick={() => setSelected(i)}
                  className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border ${
                    selected === i ? 'border-primary' : 'border-base-200'
                  }`}
                >
                  <img
                    src={src}
                    alt={`${product.name} ${i}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reviews / description */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={16} />
              <span className="font-medium">{product.averageRating ?? '—'}</span>
            </div>
            <div className="text-sm text-base-content/70">{product.reviewCount ?? 0} reviews</div>
          </div>

          <div className="prose max-w-none">
            <h3>Overview</h3>
            <p>{product.shortDescription ?? 'No description provided.'}</p>
          </div>

          <div className="prose max-w-none">
            <h3>Details</h3>
            <ul>
              <li>Status: {product.status ?? 'N/A'}</li>
              <li>SKU: {product.id}</li>
              <li>Currency: {product.currency ?? 'USD'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right: Details + actions (lg: span 5) */}
      <aside className="lg:col-span-5">
        <div className="space-y-4 sticky top-24">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-sm text-base-content/70 mt-1">{product.shortDescription}</p>
          </div>

          <div className="flex items-baseline gap-4">
            {product.salePrice ? (
              <>
                <div className="text-2xl font-bold">
                  {product.currency} {product.salePrice}
                </div>
                <div className="text-sm line-through text-base-content/50">
                  {product.currency} {product.price}
                </div>
                <div className="text-sm text-success font-medium">
                  Save {product.currency} {Number(product.price) - Number(product.salePrice)}
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold">
                {product.currency} {product.price}
              </div>
            )}
          </div>

          {/* quantity + add to cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded">
              <button onClick={decrease} className="px-3 py-2" aria-label="decrease quantity">
                <Minus size={14} />
              </button>
              <div className="px-4 py-2 min-w-[48px] text-center">{qty}</div>
              <button onClick={increase} className="px-3 py-2" aria-label="increase quantity">
                <Plus size={14} />
              </button>
            </div>

            <button onClick={addToCart} className="btn btn-primary px-6">
              Add to cart
            </button>

            <button onClick={buyNow} className="btn btn-outline px-4">
              Buy now
            </button>
          </div>

          {addedMsg && <div className="text-sm text-success">{addedMsg}</div>}

          {/* Shipping / returns note */}
          <div className="text-sm text-base-content/70">
            <p>Ships within 1–3 business days. Returns accepted within 14 days.</p>
          </div>

          {/* Reviews block (simple) */}
          <div className="mt-4">
            <h4 className="font-medium">Customer reviews</h4>
            <div className="mt-2 text-sm text-base-content/70">
              <p>
                <strong>{product.averageRating ?? '—'}</strong> average rating —{' '}
                {product.reviewCount ?? 0} reviews
              </p>
              <p className="mt-2 italic text-xs">
                Real review list integration coming soon — fetch reviews from your API and render
                here.
              </p>
            </div>
          </div>

          {/* Expandable/full description */}
          <details className="mt-4">
            <summary className="cursor-pointer font-medium">Full description</summary>
            <div className="mt-2 text-sm text-base-content/80">
              <p>{product.shortDescription}</p>
              <p className="mt-2">
                Add more long-form details here — specs, dimensions, warranty, etc.
              </p>
            </div>
          </details>
        </div>
      </aside>
    </div>
  )
}
