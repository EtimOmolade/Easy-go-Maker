import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Users, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen gradient-hero">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full shadow-glow">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
            SpiritConnect
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Track your prayers, follow weekly guidelines, and share testimonies in a faith-centered community
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 shadow-medium text-lg px-8"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-white text-white hover:bg-white/10 bg-transparent text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl shadow-soft">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-heading font-semibold text-white mb-2">
              Private Journal
            </h3>
            <p className="text-white/80">
              Keep track of your prayers and reflections in your personal space
            </p>
          </div>

          <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl shadow-soft">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-heading font-semibold text-white mb-2">
              Weekly Guidelines
            </h3>
            <p className="text-white/80">
              Follow structured prayer topics and spiritual guidance each week
            </p>
          </div>

          <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl shadow-soft">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-heading font-semibold text-white mb-2">
              Share Testimonies
            </h3>
            <p className="text-white/80">
              Inspire others by sharing your answered prayers and faith stories
            </p>
          </div>
        </div>

        {/* Gamification Teaser */}
        <div className="mt-20 text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-medium max-w-3xl mx-auto">
          <Sparkles className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-heading font-bold text-white mb-4">
            Build Your Prayer Streak
          </h2>
          <p className="text-white/90 text-lg">
            Stay consistent with your prayer life and earn badges as you reach milestones. Track your daily streaks and celebrate your spiritual growth!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
