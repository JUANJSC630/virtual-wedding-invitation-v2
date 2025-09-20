import React from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "custom";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "default",
  ...rest
}) => {
  // Estilos base que NO interfieren con colores personalizados
  const baseStyles = "!text-xl !font-serif !font-semibold !shadow-xl !border-2 !whitespace-nowrap !transition-all !duration-200 !ease-in-out !tracking-wide";

  let finalClassName = baseStyles;

  if (variant === "custom") {
    // Para variant="custom", usar estilos base + className del padre (sin estilos de color/tamaño por defecto)
    finalClassName = baseStyles + (className ? " " + className : "");
  } else {
    // Para variant="default", usar estilos base + estilos por defecto + className del padre
    finalClassName = baseStyles + " !px-10 !py-4 !rounded-full !text-white !bg-[#466691] !border-[#ca8a04]" + (className ? " " + className : "");
  }

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
