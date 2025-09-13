import Hero from '../components/Hero';
import Roles from '../components/Roles';
import Features from '../components/Features';
import Contact from '../components/Contact';

function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Roles />
      <Features />
      <Contact />
    </div>
  );
}

export default HomePage;