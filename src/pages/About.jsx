import { motion } from 'framer-motion'; // eslint-disable-line
import { Award, Target, Users, Heart, Zap, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

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
    { number: '10,000+', label: 'Happy Customers' },
    { number: '500+', label: 'Products Sold' },
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
              About Justees
            </h1>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
              We're on a mission to make premium quality clothing accessible to everyone. 
              Since our inception, we've been dedicated to delivering exceptional style, 
              comfort, and value to our customers.
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
              <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Our Story
              </h2>
              <div className={`space-y-6 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} text-left`}>
                <p>
                  Justees was born from a simple idea: everyone deserves to look and feel great 
                  in what they wear, without breaking the bank. We started as a small team of 
                  fashion enthusiasts who were frustrated with the lack of quality, affordable 
                  clothing options in the market.
                </p>
                <p>
                  Today, we've grown into a trusted brand serving thousands of customers worldwide. 
                  Our commitment remains unchanged – to provide premium quality products at fair 
                  prices, backed by exceptional customer service.
                </p>
                <p>
                  Every product we offer is carefully selected and tested to ensure it meets our 
                  high standards. We believe in building lasting relationships with our customers 
                  through transparency, honesty, and consistent quality.
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
                <value.icon className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
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
                <h3 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
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
              Join the Justees Family
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
              Experience the difference quality and care can make
            </p>
            <a
              href="/products"
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl hover:shadow-cyan-500/50 transition-all transform hover:scale-105"
            >
              Start Shopping
            </a>
          </motion.div>
        </div>
      </section>
    </div>
    <Footer />
    </>
  );
};

export default About;
