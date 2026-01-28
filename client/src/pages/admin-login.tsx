import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("POST", "/api/admin/login", { password });
      setLocation("/admin/dashboard");
    } catch (err: any) {
      setError("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto bg-midnight w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <img src="/images/staq-logo.png" alt="Staq" className="w-8 h-8 brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-display font-bold text-midnight">Staq Admin</h1>
            <p className="text-gray-500 mt-1">Sign in to access the dashboard</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-midnight">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pl-10 border-gray-200 focus:border-[#00B4C4] focus:ring-[#00B4C4]/20"
                  data-testid="input-admin-password"
                  autoFocus
                />
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-red-600" data-testid="text-login-error">
                {error}
              </p>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-[#00B4C4] hover:bg-[#0099A8] text-white" 
              disabled={loading || !password}
              data-testid="button-admin-login"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          <a href="/" className="hover:text-white transition-colors">← Back to main site</a>
        </p>
      </div>
    </div>
  );
}
