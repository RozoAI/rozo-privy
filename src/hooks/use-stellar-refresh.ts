import { useCallback, useState } from "react";
import { useStellar } from "@/providers/stellar.provider";
import { toast } from "sonner";

export function useStellarRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshAccount } = useStellar();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshAccount();
      toast.success("Balance refreshed successfully");
    } catch (error: any) {
      console.error("Error refreshing balance:", error);
      toast.error("Failed to refresh balance");
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAccount]);

  return {
    isRefreshing,
    handleRefresh,
  };
}
