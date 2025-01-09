import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Services from '@/components/Services'
import Restaurant from '@/components/Restaurant'
import Investors from '@/components/Investors'
import Contact from '@/components/Contact'
import Ser_Machine from '@/components/Ser_Machine'
import Ser_Office from '@/components/Ser_Office'
import Ser_AD from '@/components/Ser_AD'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <section id="about" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center">
        <About />
      </section>
      <section id="services" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center bg-gray-50">
        <Services />
      </section>
      <section id="ser_machine" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center">
        <Ser_Machine />
      </section>
      <section id="ser_office" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center bg-gray-50">
        <Ser_Office />
      </section>
      <section id="ser_ad" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center">
        <Ser_AD />
      </section>
      <section id="restaurant" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center bg-gray-50">
        <Restaurant />
      </section>
      <section id="investors" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center">
        <Investors />
      </section>
      <section id="contact" className="min-h-screen py-16 md:py-0 md:h-screen flex items-center justify-center bg-gray-50">
        <Contact />
      </section>
    </main>
  )
} 