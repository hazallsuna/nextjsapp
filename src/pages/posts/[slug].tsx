//next.jsden static site generation için gerekli tipler
import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
//payload cmsden gelen zengin metin içeriğini render etmek için
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ChevronLeftCircleIcon } from 'lucide-react'
//kategori tip tanımlaması
type Category = {
  id: string
  title: string
  slug: string
}

type Author = {
  id: string
  name: string
}

type Post = {
  id: string
  title: string
  slug: string
  content: any
  heroImage?: {
    id?: string
    url?: string
    alt?: string
    filename?: string
  }
  populatedAuthors?: Author[]
  categories?: Category[]
  meta?: {
    title?: string
    description?: string
    image?: {
      url: string
    }
  }
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

// tüm slugları alarak sayfalar için route oluşturur
export const getStaticPaths: GetStaticPaths = async () => {
  //slug bilgisi için tüm yazıları çek
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?limit=100`)
  const data = await res.json()
  
  //her yazı için bir sayfa yolu oluşturuyoruz
  const paths = data.docs.map((post: any) => ({
    params: { slug: post.slug },
  }))

  return { paths, fallback: 'blocking' }
  //paths:oluşturulacak yollar
  //blocking:yeni yazılar için dinamik oluşturma
}

//static props ->sluga göre tekli yazıyı getirir
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug
  
  //sluga göre yazıyı bul
  //where[slug][equals] = slug eşit olan kayıt
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/posts?where[slug][equals]=${slug}&depth=2`
  )
  const data = await res.json()
  const post = data.docs[0] //ilk sonucu alıyoruz

  return {
    props: { post }, //post verisini propsa aktar
    revalidate: 60, // 60 saniyede bir yeniden build edilir
  }
}

//tarih formatlama
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PostPage({ post }: { post: Post }) {
  //seo için başlık meta varsa onu kullanır
  const seoTitle = post.meta?.title || post.title
  //seo için açıklama
  const seoDescription = post.meta?.description || `${post.title} - Blog`
  const authorNames = post.populatedAuthors?.map(a => a.name).join(', ')
  const categoryNames = post.categories?.map(c => c.title).join(', ')

  //görsel url /media/ uyumlu yapılıyor
  let imageUrl = post.heroImage?.url || ''
  if (imageUrl?.includes('/api/media/file/')) {
    const filename = decodeURIComponent(imageUrl.split('/api/media/file/')[1])
    imageUrl = `/media/${filename}`
  }

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="author" content={authorNames} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {post.meta?.image?.url && <meta property="og:image" content={post.meta.image.url} />}
        <meta property="article:published_time" content={post.publishedAt || post.createdAt} />
        <meta property="article:modified_time" content={post.updatedAt} />
        <meta property="article:section" content={categoryNames} />
      </Head>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        
      <nav className="border-b px-6 py-4">
          <div className="max-w-4xl mx-auto">
        <Link
            href="/"
              className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-all duration-200"
>
          <ChevronLeftCircleIcon className="w-5 h-5" />
            <span>Back</span>
</Link>
  </div>
          </nav>

        <article className="max-w-4xl mx-auto px-6 py-12">
        
          {post.categories && post.categories.length > 0 && (
            <div className="mb-4">
              {post.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded-full mr-2"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          )}


          {imageUrl && (
            <div className="mb-6">
              <img
                src={imageUrl}
                alt={post.heroImage?.alt || post.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

          <div className="mb-8 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Author: {authorNames}</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            {post.content ? <RichText data={post.content} /> : <p>No Content.</p>}
          </div>
        </article>
      </div>
    </>
  )
}
