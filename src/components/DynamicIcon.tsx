import { LucideProps } from "lucide-react";
import {
  Sprout,
  TreeDeciduous,
  Trees,
  Flame,
  Gem,
  Crown,
  Globe,
  Star,
  HelpCircle,
} from "lucide-react";

// Map of icon names to components for milestone icons
// This avoids importing the entire lucide-react library (~400KB)
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Sprout,
  TreeDeciduous,
  Trees,
  Flame,
  Gem,
  Crown,
  Globe,
  Star,
};

interface DynamicIconProps extends LucideProps {
  name: string;
}

/**
 * DynamicIcon component that renders milestone icons without importing
 * the entire lucide-react library. Falls back to HelpCircle for unknown icons.
 */
export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`DynamicIcon: Unknown icon "${name}", using fallback`);
    return <HelpCircle {...props} />;
  }
  
  return <IconComponent {...props} />;
};

export default DynamicIcon;
