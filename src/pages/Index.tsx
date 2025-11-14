import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Users, Sparkles, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { scrollY } = useScroll();

  // Parallax effects for different layers
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: BookOpen,
      title: "Private Journal",
      description: "Keep track of your prayers and reflections in your personal sacred space",
      color: "primary",
    },
    {
      icon: Heart,
      title: "Weekly Guidelines",
      description: "Follow structured prayer topics and spiritual guidance each week",
      color: "secondary",
    },
    {
      icon: Users,
      title: "Share Testimonies",
      description: "Inspire others by sharing your answered prayers and faith stories",
      color: "primary",
    },
  ];

  const howItWorks = [
    { step: 1, title: "Create Your Account", description: "Join our faith community in seconds" },
    { step: 2, title: "Follow Weekly Guides", description: "Structured prayer topics to deepen your faith" },
    { step: 3, title: "Track Your Journey", description: "Build streaks and see your spiritual growth" },
    { step: 4, title: "Share & Inspire", description: "Celebrate answered prayers with the community" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-hero">
        {/* Large Floating Orbs */}
        <motion.div
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl"
          animate={{
            y: [0, -50, 0],
            x: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-light/20 rounded-full blur-3xl"
          animate={{
            y: [0, 40, 0],
            x: [0, -40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-secondary/15 rounded-full blur-3xl"
          animate={{
            y: [0, -60, 0],
            x: [0, 50, 0],
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Small Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/40 rounded-full"
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <motion.div style={{ opacity }} className="text-center mb-20">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-secondary/40 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
              <div className="relative p-6 bg-white/20 backdrop-blur-md rounded-full shadow-glow border border-white/30">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white mb-6 drop-shadow-lg"
          >
            SpiritConnect
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl md:text-2xl lg:text-3xl text-white/95 mb-10 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Track your prayers, follow weekly guidelines, and share testimonies in a faith-centered community
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
              className="bg-white text-primary hover:bg-white/90 shadow-large text-lg px-10 h-14 font-medium relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-secondary/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth", { state: { mode: 'login' } })}
              className="border-2 border-white text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm text-lg px-10 h-14 font-medium"
            >
              Sign In
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="group"
            >
              <div className="relative h-full p-8 glass rounded-2xl shadow-large border border-white/20 overflow-hidden">
                {/* Hover Glow Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />

                <div className="relative z-10">
                  <motion.div
                    className="flex justify-center mb-6"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="p-4 bg-gradient-primary rounded-full shadow-glow-primary">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-heading font-semibold text-white mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-white/90 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-32"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-heading font-bold text-white text-center mb-12"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="relative"
              >
                <div className="glass rounded-xl p-6 shadow-medium border border-white/20 h-full">
                  <motion.div
                    className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-glow"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
                  >
                    {item.step}
                  </motion.div>
                  <div className="mt-4">
                    <h3 className="text-xl font-heading font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Gamification Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-32"
        >
          <div className="relative glass rounded-3xl shadow-large p-12 border border-white/20 overflow-hidden max-w-4xl mx-auto">
            {/* Animated Background Glow */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />

            <div className="relative z-10 text-center">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                <Sparkles className="h-16 w-16 text-secondary mx-auto mb-6 drop-shadow-lg" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                Build Your Prayer Streak
              </h2>
              <p className="text-white/90 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                Stay consistent with your prayer life and earn badges as you reach milestones. Track your daily streaks and celebrate your spiritual growth!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
            Ready to Transform Your Prayer Life?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of believers who are deepening their faith journey with SpiritConnect
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
            className="bg-gradient-secondary hover:shadow-glow text-white shadow-large text-lg px-12 h-14 font-medium relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Your Journey Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
