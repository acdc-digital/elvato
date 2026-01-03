# Next.js

> Next.js is a React framework for building full-stack web applications. You use React Components to build user interfaces, and Next.js for additional features and optimizations.

This project uses Next.js 14+ with the **App Router** architecture.

## Key Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [App Router Documentation](https://nextjs.org/docs/app)

## App Router Fundamentals

### Routing Conventions

- **File-based routing**: Create routes by adding files to the `app` directory
- **Layout files**: `layout.tsx` - Shared UI for a segment and its children
- **Page files**: `page.tsx` - Unique UI for a route
- **Loading files**: `loading.tsx` - Loading UI for a segment
- **Error files**: `error.tsx` - Error UI for a segment
- **Not Found**: `not-found.tsx` - 404 UI for a segment

### Server Components (Default)

- **Default behavior**: All components in the App Router are Server Components by default
- **Benefits**: Automatic code splitting, streaming, improved performance
- **Data fetching**: Use `async/await` directly in components
- **When to use**: For most UI that doesn't require client-side interactivity

### Client Components

- **Directive**: Add `"use client"` at the top of the file
- **When to use**: 
  - Event listeners (`onClick`, `onChange`, etc.)
  - State and lifecycle hooks (`useState`, `useEffect`, etc.)
  - Browser-only APIs
  - Custom hooks
- **Best practice**: Push client components down the tree as much as possible

## Data Fetching

### Server-side Fetching

```typescript
// Server Component - async/await support
async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data.title}</div>
}
```

### Caching Behavior

- **`fetch` requests**: Cached by default
- **Revalidation**: Use `revalidate` option or `revalidatePath`/`revalidateTag`
- **Dynamic rendering**: Use `dynamic = 'force-dynamic'` to opt out of caching

## Navigation

### Link Component

```typescript
import Link from 'next/link'

<Link href="/about">About</Link>
```

### useRouter (Client Component)

```typescript
'use client'
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/dashboard')
```

## Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/photo.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // For above-the-fold images
/>
```

## Metadata

### Static Metadata

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
}
```

### Dynamic Metadata

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await fetchData(params.id)
  return {
    title: data.title,
  }
}
```

## Best Practices

1. **Component Organization**
   - Keep Server Components at the top level
   - Push Client Components to the leaves
   - Extract shared UI into reusable components

2. **Performance**
   - Use `loading.tsx` for instant loading states
   - Implement streaming with Suspense boundaries
   - Optimize images with Next.js Image component
   - Use dynamic imports for code splitting

3. **TypeScript**
   - Use TypeScript for all components
   - Define proper types for params, searchParams
   - Use Next.js built-in types (`Metadata`, `Route`, etc.)

4. **File Organization**
   - Group related components in folders
   - Use route groups `(folder)` for organization without affecting URL
   - Keep page-specific components close to their pages

5. **Data Fetching**
   - Fetch data at the highest level possible
   - Use parallel data fetching when possible
   - Implement proper error boundaries
   - Add loading states for better UX
