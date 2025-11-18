import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/NotificationDropdown";
import logoOnly from "@/assets/logo-only.png";
import { useAuth } from "@/contexts/AuthContext";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  onBackClick?: () => void;
}

export const AppHeader = ({ title, showBack = true, backTo = "/dashboard", onBackClick }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(backTo);
    }
  };

  const handleLogoClick = () => {
    navigate("/dashboard");
  };

  // Hide notification center for admins ONLY on Admin Dashboard and Guided-Session pages
  const shouldHideNotification = isAdmin && (
    location.pathname === '/admin' ||
    location.pathname.includes('/guided-session')
  );

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {showBack ? (
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 border border-white/20"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <motion.img
            src={logoOnly}
            alt="SpiritConnect Home"
            className="h-10 w-10 cursor-pointer"
            whileHover={{ 
              scale: 1.1,
              filter: "brightness(1.2)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoClick}
          />
        )}
        {title && (
          <h1 className="text-2xl md:text-4xl font-heading font-bold text-white drop-shadow-lg">
            {title}
          </h1>
        )}
      </div>
      
      {user && !shouldHideNotification && (
        <NotificationDropdown userId={user.id} isAdmin={isAdmin} />
      )}
    </div>
  );
};
