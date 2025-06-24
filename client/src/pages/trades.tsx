import { ModernTradeManagement } from "@/components/modern-trade-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Plus, TrendingUp } from "lucide-react";

export default function Trades() {
  return <ModernTradeManagement />;
}