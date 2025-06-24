import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface GlobalLoaderProps {
  children: React.ReactNode;
}

export function GlobalLoader({ children }: GlobalLoaderProps) {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Show loader on route change
    setIsLoading(true);
    setLoadingProgress(0);

    // Simulate loading progress
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(loadingInterval);
          setTimeout(() => setIsLoading(false), 200);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 80);

    return () => {
      clearInterval(loadingInterval);
    };
  }, [location]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-spin"
                   style={{ animation: "spin 1s linear infinite" }} />
              <div className="absolute inset-1.5 rounded-full bg-white" />
              <div className="absolute inset-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse" />
            </div>
            
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <span className="text-xs font-medium">Loading</span>
              <div className="flex space-x-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: "0.6s"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}