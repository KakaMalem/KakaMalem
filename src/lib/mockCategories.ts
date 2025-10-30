import { Category } from '@/payload-types'

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600',
  } as unknown as Category,
  {
    id: 'fashion',
    name: 'Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600',
  } as unknown as Category,
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600',
  } as unknown as Category,
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600',
  } as unknown as Category,
  {
    id: 'beauty',
    name: 'Beauty',
    slug: 'beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
  } as unknown as Category,
  {
    id: 'books',
    name: 'Books',
    slug: 'books',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600',
  } as unknown as Category,
]
