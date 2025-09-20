import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, className = "" }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.04 }}
      onClick={onClick}
      className={`${className}`}
      style={{ 
        padding: '1rem 2.5rem',
        borderRadius: '9999px', 
        backgroundColor: '#466691', 
        color: 'white',
        fontSize: '1.25rem',
        fontFamily: 'serif',
        fontWeight: '600',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        border: '2px solid #ca8a04',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        transition: 'all 200ms ease'
      }}
      type="button"
    >
      {children}
    </motion.button>
  );
};

export default Button;
