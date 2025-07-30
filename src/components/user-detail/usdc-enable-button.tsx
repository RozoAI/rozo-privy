import { memo } from "react";
import { Button } from "../ui/button";

interface UsdcEnableButtonProps {
  isEnabling: boolean;
  onEnable: () => void;
}

export const UsdcEnableButton = memo(function UsdcEnableButton({ 
  isEnabling, 
  onEnable 
}: UsdcEnableButtonProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t">
      <span className="text-sm font-medium text-muted-foreground">USDC</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onEnable}
        disabled={isEnabling}
      >
        {isEnabling ? "Enabling..." : "Enable USDC"}
      </Button>
    </div>
  );
});
