import Hero from '../components/Hero';
import Roles from '../components/Roles';
import Features from '../components/Features';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Roles />
      <Features />
      <Contact />
      <Footer />
    </div>
  );
}

export default HomePage;