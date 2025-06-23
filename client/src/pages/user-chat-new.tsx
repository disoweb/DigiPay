import { useParams, useLocation } from "wouter";
import { ModernChat } from "@/components/modern-chat";

export default function UserChat() {
  const params = useParams();
  const [, setLocation] = useLocation();
  
  // Extract userId from params with detailed debugging
  const userId = params.userId;
  
  console.log("UserChat - Full params object:", params);
  console.log("UserChat - Extracted userId:", userId);
  console.log("UserChat - Current location:", window.location.pathname);

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (!userId || userId === '') {
    console.log("No userId found in params. Params:", params);
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Invalid user ID</p>
          <p className="text-sm text-gray-400 mt-2">Debug: {JSON.stringify(params)}</p>
          <p className="text-sm text-gray-400">Path: {window.location.pathname}</p>
        </div>
      </div>
    );
  }

  console.log("Rendering ModernChat with userId:", userId);
  return <ModernChat chatUserId={userId} onBack={handleBack} />;
}