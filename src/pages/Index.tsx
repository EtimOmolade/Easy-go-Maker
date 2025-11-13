import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Users, Sparkles, Flame, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-accent rounded-full blur-2xl opacity-50 animate-pulse-glow" />
              <div className="relative p-6 glass-card rounded-full shadow-xl">
                <BookOpen className="h-20 w-20 text-primary" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            SpiritConnect
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl text-foreground/80 mb-4 max-w-3xl mx-auto font-body leading-relaxed">
            Your Personal Prayer Companion
          </p>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Track your spiritual journey, follow guided prayer sessions, and share testimonies in a peaceful, faith-centered community
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
              className="bg-gradient-accent hover:opacity-90 text-white shadow-lg hover:shadow-glow transition-all hover:scale-105 text-lg px-10 py-6 rounded-full"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth", { state: { mode: 'login' } })}
              className="border-2 border-primary text-primary hover:bg-primary/5 text-lg px-10 py-6 rounded-full transition-all hover:scale-105"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: BookOpen,
              title: "Private Prayer Journal",
              description: "Record your prayers, reflections, and answered prayers in your personal sacred space",
              gradient: "from-primary/10 to-primary/5"
            },
            {
              icon: Flame,
              title: "Build Your Streak",
              description: "Stay consistent with daily prayer tracking and earn meaningful spiritual milestones",
              gradient: "from-accent/10 to-accent/5"
            },
            {
              icon: Users,
              title: "Share Testimonies",
              description: "Inspire and encourage the community by sharing your answered prayers and faith stories",
              gradient: "from-primary/10 to-primary/5"
            }
          ].map((feature, index) => (
            <div
              key={feature.title}
              className={`animate-fade-in-up stagger-${index + 1} opacity-0`}
            >
              <div className="group h-full p-8 glass-card rounded-3xl shadow-md hover-lift cursor-default">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-sm group-hover:shadow-glow-blue transition-all`}>
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                
                <h3 className="text-2xl font-heading font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Gamification Section */}
        <div className="max-w-4xl mx-auto mb-20 animate-scale-in">
          <div className="relative p-10 md:p-16 glass-card rounded-3xl shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative text-center">
              <div className="inline-block p-4 bg-gradient-accent rounded-full mb-6 shadow-glow">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
                Build Your Prayer Streak
              </h2>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Stay consistent with your prayer life and unlock meaningful badges as you reach spiritual milestones. Track your daily streaks and celebrate your growth!
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {[
                  { emoji: "🌱", label: "First Prayer", days: "Day 1" },
                  { emoji: "🔥", label: "One Week", days: "7 Days" },
                  { emoji: "💎", label: "Three Weeks", days: "21 Days" }
                ].map((milestone) => (
                  <div key={milestone.label} className="p-4 bg-background/50 rounded-2xl border border-border/50">
                    <div className="text-4xl mb-2">{milestone.emoji}</div>
                    <div className="text-sm font-semibold text-foreground">{milestone.label}</div>
                    <div className="text-xs text-muted-foreground">{milestone.days}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-foreground mb-12">
            Why Choose SpiritConnect?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: "Private & Secure",
                description: "Your prayers and reflections are completely private and encrypted"
              },
              {
                icon: TrendingUp,
                title: "Track Your Growth",
                description: "Visualize your spiritual journey with meaningful statistics and insights"
              },
              {
                icon: Heart,
                title: "Community Support",
                description: "Be inspired by others' testimonies and share your own faith stories"
              },
              {
                icon: Sparkles,
                title: "Beautiful Experience",
                description: "Enjoy a peaceful, elegantly designed interface that enhances prayer"
              }
            ].map((benefit, index) => (
              <div
                key={benefit.title}
                className={`flex gap-4 p-6 glass-card rounded-2xl shadow-sm hover-lift animate-fade-in-up stagger-${index + 1} opacity-0`}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center animate-fade-in">
          <div className="inline-block p-12 md:p-16 glass-card rounded-3xl shadow-xl">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Begin Your Prayer Journey Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands strengthening their faith through consistent prayer
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
              className="bg-gradient-accent hover:opacity-90 text-white shadow-lg hover:shadow-glow transition-all hover:scale-105 text-lg px-12 py-6 rounded-full"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Free Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
