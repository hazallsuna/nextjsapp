//next.jsden AppProps tipini import ettik uygulamanın ana yapısını tanımlar
import type { AppProps } from 'next/app'
//tüm sayfalarda geçerli olacak stiller
import '../styles/globals.css'

//tüm sayfaları sarmalayan ana yapı
export default function App({ Component, pageProps }: AppProps) {
  //componenet:şuanda render edilecek sayfa bileşenleri
  //pageProps:o sayfaya özgü propslar(getStaticPropstan gelen veriler)

  //tüm sayfalar bu yapının içinde render edilir
  return <Component {...pageProps} />
}
