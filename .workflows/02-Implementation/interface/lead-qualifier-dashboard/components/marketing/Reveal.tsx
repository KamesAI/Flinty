"use client";

import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reducedMotion = useReducedMotion();

  // Toujours rendre le même arbre serveur/client : brancher sur reducedMotion
  // avec un <div> simple casse l'hydratation et laisse la page à opacity 0.
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
