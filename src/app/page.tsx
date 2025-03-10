import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Services from '@/components/Services'
import Services02 from '@/components/Services02'
import Restaurant from '@/components/Restaurant'
import Investors from '@/components/Investors'
import Contact from '@/components/Contact'
import Advantages from '@/components/Advantages'
import SiteFooter from '@/components/SiteFooter'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <section id="about" className="min-h-screen pt-24 pb-16 md:py-32">
        <About />
      </section>
      <section id="services" className="py-32">
        <Services />
      </section>
      <section id="services-02" className="py-32 bg-gray-50">
        <Services02 />
      </section>
      <section id="all-one" className="py-32">
        <Advantages />
      </section>
      <section id="restaurant" className="py-32">
        <Restaurant />
      </section>
      <section id="investors" className="py-32">
        <Investors />
      </section>
      <section id="contact" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center bg-gray-50">
        <Contact />
      </section>
      <SiteFooter />
    </main>
  )
} 