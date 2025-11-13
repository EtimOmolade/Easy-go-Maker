import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Users, Flame, Sparkles, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-accent">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        {/* Light Rays */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-white/20 via-transparent to-transparent rotate-12 animate-pulse-glow" />
        <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-white/15 via-transparent to-transparent -rotate-12 animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="p-6 glass rounded-full shadow-glow-gold">
              <BookOpen className="h-20 w-20 text-white animate-pulse-glow" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-heading font-bold text-white mb-6 text-glow-gold tracking-tight">
            SpiritConnect
          </h1>
          
          <p className="text-xl md:text-3xl text-white/95 mb-4 max-w-3xl mx-auto font-light leading-relaxed">
            Deepen Your Prayer Journey
          </p>
          
          <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track prayers, follow guided sessions, and share your spiritual victories in a faith-centered community
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="gold"
              onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
              className="text-lg px-10 py-7 h-auto font-semibold min-w-[200px]"
            >
              Begin Your Journey
            </Button>
            <Button
              size="lg"
              variant="glass"
              onClick={() => navigate("/auth", { state: { mode: 'login' } })}
              className="text-lg px-10 py-7 h-auto text-white border-2 border-white/30 min-w-[200px]"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: BookOpen,
              title: "Private Prayer Journal",
              description: "Record prayers, reflections, and voice notes in your personal sacred space",
              gradient: "from-primary-light to-primary"
            },
            {
              icon: Heart,
              title: "Guided Prayer Sessions",
              description: "Follow structured weekly guidelines with audio prompts and scripture meditation",
              gradient: "from-accent to-accent-light"
            },
            {
              icon: Users,
              title: "Community Testimonies",
              description: "Share and celebrate answered prayers with fellow believers worldwide",
              gradient: "from-primary to-accent"
            }
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="glass p-8 rounded-3xl hover-lift cursor-default animate-scale-in border border-white/20"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-large`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/80 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works - Visual Steps */}
        <div className="mb-20 animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Your Spiritual Journey, Simplified
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Three simple steps to transform your prayer life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            {[
              { number: "1", title: "Sign Up Free", icon: CheckCircle },
              { number: "2", title: "Follow Daily Prayers", icon: BookOpen },
              { number: "3", title: "Track Your Growth", icon: Flame }
            ].map((step, index) => (
              <div key={step.number} className="relative">
                <div className="glass p-8 rounded-3xl border border-white/20 text-center relative z-10">
                  <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-accent-foreground shadow-glow-gold">
                    {step.number}
                  </div>
                  <step.icon className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-bold text-white">
                    {step.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gamification Teaser */}
        <div className="glass p-12 rounded-3xl border border-white/20 max-w-4xl mx-auto text-center animate-fade-in hover-lift">
          <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-gold">
            <Sparkles className="h-10 w-10 text-accent-foreground animate-pulse-glow" />
          </div>
          <h2 className="text-4xl font-heading font-bold text-white mb-6">
            Build Your Prayer Streak
          </h2>
          <p className="text-white/90 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            Stay consistent with daily prayers and earn beautiful badges as you reach milestones. 
            Track your spiritual growth journey and celebrate every victory along the way.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="text-center">
              <div className="text-5xl mb-2">🔥</div>
              <p className="text-white/80 text-sm">Daily Streaks</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-2">🏆</div>
              <p className="text-white/80 text-sm">Achievements</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-2">⭐</div>
              <p className="text-white/80 text-sm">Milestones</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-2">👑</div>
              <p className="text-white/80 text-sm">Champion Level</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-20">
          <Button
            size="lg"
            variant="gold"
            onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
            className="text-xl px-12 py-8 h-auto font-bold shadow-glow-gold hover:shadow-glow-gold hover:scale-110"
          >
            Start Praying Today
          </Button>
          <p className="text-white/70 mt-4 text-sm">Free forever. No credit card required.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
