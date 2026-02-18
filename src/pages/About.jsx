import { motion } from 'framer-motion'; // eslint-disable-line
import { Award, Target, Users, Heart, Zap, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/common/Navbar';

const About = () => {
  const { isDark } = useTheme();

  const values = [
    {
      icon: Award,
      title: 'Quality First',
      description: 'We never compromise on the quality of our materials and craftsmanship.',
    },
    {
      icon: Users,
      title: 'Customer Focused',
      description: 'Your satisfaction is our top priority. We listen and deliver.',
    },
    {
      icon: Heart,
      title: 'Passion Driven',
      description: 'We love what we do, and it shows in every product we create.',
    },
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description: 'Honest pricing, clear communication, and reliable service.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Always pushing boundaries to bring you the latest trends.',
    },
    {
      icon: Target,
      title: 'Mission Driven',
      description: 'Making premium fashion accessible to everyone.',
    },
  ];

  const stats = [
    { number: '1,000+', label: 'Happy Customers' },
    { number: '1,500+', label: 'Products Sold' },
    { number: '4.9', label: 'Average Rating' },
    { number: '100%', label: 'Satisfaction Rate' },
  ];

  return (
    <>
      <Navbar />
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pt-20`}>
      {/* Hero Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#d3d1ce', fontFamily: 'Cookie, cursive' }}>
              About Justees
            </h1>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed space-y-2`}>
              JUSTEES was created for the generation that refuses to Blend in.<br />
              We don't follow seasons, We don't chase noise, We design for presence.<br /><br />
              For Gen Z, it's self expression.<br />
              For professionals, it's effortless style.<br />
              For creatives, it's identity.<br />
              For JUSTEES LEAGUE, it's comfort without compromise.<br /><br />
              We believe streetwear isn't about hype, it's about how you carry yourself.🤍
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#d3d1ce', fontFamily: 'Cookie, cursive' }}>
                Our Story
              </h2>
              <div className={`space-y-6 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} text-left`}>
                <p>
                  Our story began with a simple idea to create clothing that feels as powerful 
                  as the person wearing it. ✨ In a world full of noise and fast trends, we 
                  wanted to build something timeless pieces that don't just sit in your wardrobe, 
                  but become part of your identity.
                </p>
                <p>
                  JUSTEES was born from late nights, bold dreams, and the belief that confidence 
                  starts with comfort. Every stitch, every silhouette, every shade is designed 
                  to move with you through your growth, your hustle, your moments.
                </p>
                <p>
                  This isn't just streetwear. It's a statement of presence. And when you wear 
                  JUSTEES, you're not just buying clothing you're stepping into a mindset. 🖤
                </p>
                <p className="text-4xl md:text-5xl font-bold text-center mt-8" style={{ fontFamily: 'Cookie, cursive', color: '#d3d1ce' }}>
                  WELCOME TO JUSTEES LEAGUE !
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Our Values
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-gray-50'} text-center`}
              >
                <value.icon className="w-12 h-12 mx-auto mb-4" style={{ color: '#d3d1ce' }} />
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {value.title}
                </h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Our Impact
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Numbers that speak for themselves
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <h3 className="text-5xl font-bold mb-2" style={{ color: '#d3d1ce' }}>
                  {stat.number}
                </h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Join the Justees League
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
              Experience the difference quality and care can make
            </p>
            <a
              href="/products"
              style={{ backgroundColor: '#d3d1ce' }}
              className="inline-block text-gray-900 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Start Shopping
            </a>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  );
};

export default About;
