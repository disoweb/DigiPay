import { useParams, useLocation } from "wouter";
import { ModernChat } from "@/components/modern-chat";

export default function UserChat() {
  const { userId } = useParams();
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Invalid user ID</p>
      </div>
    );
  }

  return <ModernChat chatUserId={userId} onBack={handleBack} />;
}