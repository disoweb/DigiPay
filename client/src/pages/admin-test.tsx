import { useAuth } from "@/hooks/use-auth";

export default function AdminTest() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">User Data:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
      {user?.isAdmin ? (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          ✓ Admin access confirmed
        </div>
      ) : (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          ✗ No admin access
        </div>
      )}
    </div>
  );
}