import { memo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface RefreshBalanceButtonProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const RefreshBalanceButton = memo(function RefreshBalanceButton({ 
  isRefreshing, 
  onRefresh 
}: RefreshBalanceButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="h-8 w-8 p-0"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  );
});
