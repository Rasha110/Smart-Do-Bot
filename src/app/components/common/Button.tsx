import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "third";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) => {
  // Base classes
  let baseClasses =
    "rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

  // Size variants
  let sizeClasses = "";
  switch (size) {
    case "sm":
      sizeClasses = "py-1 px-2 text-sm";
      break;
    case "md":
      sizeClasses = "py-2 px-4 text-base";
      break;
    case "lg":
      sizeClasses = "py-3 px-6 text-lg";
      break;
  }

  // Color variants
  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses = "bg-blue-600 text-white hover:bg-blue-700";
      break;
    case "secondary":
      variantClasses = "bg-gray-200 text-gray-800 hover:bg-gray-300";
      break;
    case "danger":
      variantClasses = "bg-red-600 text-white hover:bg-red-700";
      break;
      case "third":
      variantClasses = "bg-grey-600 text-black hover:bg-grey-700";
      break;
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
