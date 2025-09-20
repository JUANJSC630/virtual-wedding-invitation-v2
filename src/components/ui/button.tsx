import React from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "custom";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "default",
  ...rest
}) => {
  const baseStyles = "!font-serif !font-semibold !shadow-xl !border-2 !whitespace-nowrap !transition-all !duration-200 !ease-in-out !tracking-wide";

  const defaultStyles = "!px-6 !py-4 !rounded-full !text-white !bg-[#466691] !border-[#ca8a04]";

  const finalClassName = cn(
    baseStyles,
    variant === "default" && defaultStyles,
    className
  );

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.04 }}
      className={finalClassName}
      type="button"
      {...(rest as HTMLMotionProps<"button">)}
    >
      {children}
    </motion.button>
  );
};

export default Button;
