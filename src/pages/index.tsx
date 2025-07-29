import { GetStaticProps } from 'next'
//next.js'in özel Link bileşeni sayfalar arası geçiş için
import Link from 'next/link'
//SEO için HTML head etiketlerini yönetir
import Head from 'next/head'

//post tipini tanımladık
type Post = {
  id: string
  title: string
  slug: string //URl dostu isim 
  populatedAuthors: {
    id: string
    name: string
  }[]
  categories: {
    id: string
    title: string
    slug: string
  }[] //dizi olabilir birden fazla kategori
  createdAt: string
}

type Category = {
  id: string
  title: string
  slug: string
  description?: string
}

//günün sözü için tip tanımı 
type Quote = {
  q: string // söz metni
  a: string // yazar
}

//ana sayfa bileşenine gelecek propsların tipi
type HomeProps = {
  posts: Post[] //post dizisi
  categories: Category[] //kategori dizisi
  quote: Quote | null //Quote objesi ya da null
}

//buil -> verileri çeker ve props olarak döner
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    //apiden son 5 yazıyı çek
    //sort yeniden eskiye 
    const postsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/posts?limit=5&sort=-createdAt&depth=2&populate=categories`
    )
    const postsData = await postsRes.json() //jsona çevir

    //tüm kategorileri çek
    //max 20 ve başlıga göre alfabetik sırala
    const categoriesRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories?limit=20&sort=title`
    )
    const categoriesData = await categoriesRes.json()

    //günün sözünü çekiyoruz
    let quote = null
    try {
      const quoteRes = await fetch('https://zenquotes.io/api/today')
      const quoteData = await quoteRes.json()
      quote = quoteData[0] || null //varsa yazdır yoksa null
    } catch (error) {
      //hata olursa loglamak için sayfa patlamasın diye
      console.error('Quote API error:', error)
    }
    
    //başarılı sonuç
    return {
      props: {
        posts: postsData.docs || [], //docs yoksa boş dizi
        categories: categoriesData.docs || [], //docs yoksa boş dizi
        quote, //söz veya null
      },
      revalidate: 3600, //1 saat sonra yeniden build 
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    return {
      props: {
        posts: [], //boş dizi döndürür
        categories: [], //boş dizi
        quote: null, //null döner
      },
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

//getStaticPropstan gelen verileri kullanıyoruz
export default function Home({ posts, categories, quote }: HomeProps) {
  return (
    <>
      <Head>
        <title>Home Page</title>
        <meta name="description" content="En son blog yazıları ve günün sözü" />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Home Page
        </h1>

     
        {quote && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6 mb-12">
            <h2 className="text-xl font-bold mb-4">💭 The word of the day</h2>
            <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 mb-2">
              "{quote.q}"
            </blockquote>
            <cite className="text-sm text-gray-600 dark:text-gray-400">
              — {quote.a}
            </cite>
          </div>
        )}

 
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">📂 Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link 
                  key={category.id} //react key prop
                  href={`/category/${category.slug}`} //kategori sayfası link
                  className="group bg-white dark:bg-gray-900 p-4 rounded-lg shadow border hover:shadow-md transition-all duration-200 hover:border-gray-500 dark:hover:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                        {category.title}
                      </h3>
                    </div>
                    <span className="text-gray-700">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-6">📝 Latest Articles</h2>
          
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
 
                  <div className="mb-3">
                    {post.categories?.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 inline-block mb-2 hover:bg-blue-200 transition-colors"
                      >
                        {category.title}
                      </Link>
                    ))}
                  </div>
                  
            
                  <h3 className="text-xl font-bold mb-3">
                    <Link 
                      href={`/posts/${post.slug}`}
                      className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-400"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  
            
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      {post.populatedAuthors?.length > 0 && (
                      post.populatedAuthors.map((author, index) => (
                      <span key={author.id}>
                      {author.name}
                      {index < post.populatedAuthors.length - 1 && ', '}
                       </span>
                    ))
                  )}

                    </div>
                    <span className="mx-2">•</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              There is no text yet.
            </p>
          )}
        </section>
      </main>
    </>
  )
}