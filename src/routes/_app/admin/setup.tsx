import { createFileRoute } from "@tanstack/react-router";
import { createAdminUser } from "../../api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/setup")({
  component: AdminSetup,
});

function AdminSetup() {
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async () => {
    setLoading(true);
    try {
      await (createAdminUser as any)({});
      toast.success("Admin user created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Setup</h1>
        <p className="text-muted-foreground text-center mb-6">
          Click the button below to create the admin user with phone: 8307224756
        </p>
        <Button
          onClick={handleCreateAdmin}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating..." : "Create Admin User"}
        </Button>
      </div>
    </div>
  );
}