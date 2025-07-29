import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import {ChevronLeftCircleIcon } from 'lucide-react'
type Post = {
  id: string
  title: string
  slug: string
  populatedAuthors?: {
    id: string
    name: string
  }[]
  categories?: {
    id: string
    title: string
    slug: string
  }[]
  createdAt: string
  publishedAt?: string
}

type Category = {
  id: string
  title: string
  slug: string
  description?: string
}

//kategori sayfası bileşenine gelecek propsların tipi
type CategoryPageProps = {
  category: Category //kategori bileşeni
  posts: Post[] //o kategorideki yazılar
}

//build oldugunda hangi kategori sayfalarının oluşturulacağını belirler
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Tüm kategorileri çek
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories?limit=100`)
    const data = await res.json()
    
    //her kategori için  bir sayfa yolu oluştur
    const paths = data.docs.map((category: Category) => ({
      params: { slug: category.slug },
    }))

    return { 
      paths, 
      fallback: 'blocking' 
    }
  } catch (error) {
    //hata durumunda boş paths döndürür
    console.error('Error fetching categories for paths:', error)
    return {
      paths: [],
      fallback: 'blocking'
    }
  }
}

//belirli bir kategorinin verilerini ve yazılarını çeker
export const getStaticProps: GetStaticProps<CategoryPageProps> = async ({ params }) => {
  const slug = params?.slug

  try {
    // sluga göre kategoriyi bul
    // Kategori bilgilerini çek
    const categoryRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories?where[slug][equals]=${slug}&limit=1`
    )
    const categoryData = await categoryRes.json()
    const category = categoryData.docs[0]


    // Bu kategoriye ait yazıları çek
    // categories alanında bu kategori idsi olan yazılar
    //en yeniden eskiye
    const postsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/posts?where[categories][in][]=${category.id}&sort=-createdAt&depth=2&populate=categories`
    )
    const postsData = await postsRes.json()

    return {
      props: {
        category,
        posts: postsData.docs || [],
      },
      revalidate: 3600, //1 saat
    }
  } catch (error) {
    //hata olursa 404
    console.error('Error fetching category data:', error)
    return {
      notFound: true,
    }
  }
}

//tarih formatlama
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function CategoryPage({ category, posts }: CategoryPageProps) {
  //seo için başlık
  const seoTitle = `${category.title} - Blog Kategorisi`
  const seoDescription = category.description || `${category.title} kategorisindeki tüm blog yazıları`

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
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

        <main className="max-w-4xl mx-auto px-6 py-12">
      
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-lg font-medium px-4 py-2 rounded-full">
                📂 {category.title}
              </span>
            </div>
            
            {category.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            )}
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              {posts.length} article found.
            </div>
          </div>
          <section>
              <div className="space-y-6">
                {posts.map((post) => (
                  <article key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          
                    <div className="mb-3">
                      {post.categories?.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 inline-block mb-2 hover:bg-blue-200 transition-colors"
                        >
                          {cat.title}
                        </Link>
                      ))}
                    </div>

                    <h2 className="text-xl font-bold mb-3">
                      <Link 
                        href={`/posts/${post.slug}`}
                        className="text-gray-900 dark:text-white"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                    {post.populatedAuthors && post.populatedAuthors.length > 0 ? (
                    post.populatedAuthors.map((author, index) => (
                    <span key={author.id}>
                    {author.name}
                    {index < post.populatedAuthors!.length - 1 && ', '} 
               </span>
            ))
         ) :  (
            <span>No name.</span>
)}

                      </div>
                      <span className="mx-2">•</span>
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
          </section>
        </main>
      </div>
    </>
  )
}