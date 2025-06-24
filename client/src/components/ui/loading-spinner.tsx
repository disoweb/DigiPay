import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "gray";
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  color = "primary", 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const colorClasses = {
    primary: "text-blue-600",
    white: "text-white",
    gray: "text-gray-400"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className={cn(
        "absolute inset-0 rounded-full border-2 border-transparent",
        "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-spin",
        "before:absolute before:inset-1 before:rounded-full before:bg-white before:content-['']"
      )} 
      style={{
        background: "conic-gradient(from 0deg, transparent, currentColor, transparent)",
        animation: "spin 1s linear infinite"
      }}
      />
      <div className={cn(
        "absolute inset-1 rounded-full bg-white",
        colorClasses[color]
      )} />
    </div>
  );
}

// Premium Pulse Spinner
export function PulseSpinner({ 
  size = "md", 
  color = "primary", 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12", 
    xl: "w-16 h-16"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-75" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse" />
      <div className="absolute inset-1 rounded-full bg-white" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
    </div>
  );
}

// Premium Dots Spinner
export function DotsSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "0.8s"
          }}
        />
      ))}
    </div>
  );
}

// Premium Page Loader
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-spin"
               style={{ animation: "spin 2s linear infinite" }} />
          <div className="absolute inset-2 rounded-full bg-white" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse" />
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="text-sm font-medium">Loading</span>
          <DotsSpinner />
        </div>
      </div>
    </div>
  );
}

// Premium Button Spinner
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-4 h-4", className)}>
      <div className="absolute inset-0 rounded-full border-2 border-white/30" />
      <div 
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
    </div>
  );
}