import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Users, TrendingUp, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: BookOpen,
      title: "Personal Prayer Journal",
      description: "Document your prayers and reflections in a private, secure space designed for spiritual growth.",
    },
    {
      icon: TrendingUp,
      title: "Guided Prayer Framework",
      description: "Follow structured weekly guidelines that help deepen your prayer practice and spiritual discipline.",
    },
    {
      icon: Heart,
      title: "Community Testimonies",
      description: "Share and discover stories of answered prayers that inspire and strengthen faith across the community.",
    },
    {
      icon: Shield,
      title: "Progress Tracking",
      description: "Monitor your prayer consistency with streak tracking and milestone achievements that celebrate your commitment.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
                <div className="relative p-6 bg-white rounded-full shadow-premium border-2 border-primary/10">
                  <BookOpen className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 tracking-tight">
              <span className="text-gradient">SpiritConnect</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 leading-relaxed">
              A thoughtfully designed platform for cultivating a deeper prayer life
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
              Track your prayers, follow weekly spiritual guidelines, and connect with a community
              of believers sharing their stories of faith and answered prayers.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="xl"
                variant="premium"
                onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Begin Your Journey
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => navigate("/auth", { state: { mode: 'login' } })}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Everything you need for a consistent prayer life
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Designed with care to support your spiritual journey through thoughtful features
              and an intuitive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group border-2 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="shrink-0">
                      <div className="p-4 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-heading font-semibold">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof / Community Section */}
      <div className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary/10 shadow-xl overflow-hidden">
            <div className="gradient-card p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-full shadow-md">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Join a Growing Community
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Be part of a supportive community where believers share their prayer requests,
                celebrate answered prayers, and encourage one another in faith.
              </p>
              <Button
                size="lg"
                variant="premium"
                onClick={() => navigate("/auth", { state: { mode: 'signup' } })}
              >
                Get Started Free
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-heading font-semibold text-lg">SpiritConnect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SpiritConnect. Cultivating deeper faith through prayer.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
