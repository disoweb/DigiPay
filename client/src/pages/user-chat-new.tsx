import { useParams, useLocation } from "wouter";
import { ModernChat } from "@/components/modern-chat";

export default function UserChat() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  
  // Extract userId from params with detailed debugging
  const userId = params.userId;
  
  console.log("UserChat - Full params object:", params);
  console.log("UserChat - Extracted userId:", userId);
  console.log("UserChat - Current location:", location);
  console.log("UserChat - Window location:", window.location.pathname);
  
  // Fallback: extract userId from URL path if params is empty
  let finalUserId = userId;
  if (!finalUserId && location) {
    const match = location.match(/\/user-chat\/(\d+)/);
    if (match) {
      finalUserId = match[1];
      console.log("UserChat - Extracted userId from URL:", finalUserId);
    }
  }

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (!finalUserId || finalUserId === '') {
    console.log("No userId found in params or URL. Params:", params, "Location:", location);
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Invalid user ID</p>
          <p className="text-sm text-gray-400 mt-2">Debug: {JSON.stringify(params)}</p>
          <p className="text-sm text-gray-400">Path: {window.location.pathname}</p>
          <p className="text-sm text-gray-400">Location: {location}</p>
        </div>
      </div>
    );
  }

  console.log("Rendering ModernChat with userId:", finalUserId);
  return <ModernChat chatUserId={finalUserId} onBack={handleBack} />;
}