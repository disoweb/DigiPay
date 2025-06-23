import { useParams, useLocation } from "wouter";
import { ModernChat } from "@/components/modern-chat";

export default function UserChat() {
  const { userId } = useParams();
  const [, setLocation] = useLocation();

  console.log("UserChat params:", { userId });

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (!userId) {
    console.log("No userId found in params");
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Invalid user ID</p>
      </div>
    );
  }

  console.log("Rendering ModernChat with userId:", userId);
  return <ModernChat chatUserId={userId} onBack={handleBack} />;
}