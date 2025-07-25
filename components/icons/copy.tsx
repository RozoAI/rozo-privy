import type React from "react";

type CopyIconProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
};

export const CopyIcon: React.FC<CopyIconProps> = ({
  className,
  width = 16,
  height = 16,
  ...props
}) => {
  return (
    <svg
      {...props}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
};
