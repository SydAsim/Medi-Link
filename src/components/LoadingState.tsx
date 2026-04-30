import { motion } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Analyzing your symptoms..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-8">
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-blue-600 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-200"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl" />
        </motion.div>
      </div>
      <p className="text-sm font-bold text-blue-900 uppercase tracking-widest animate-pulse">{message}</p>
    </div>
  );
}
