import { motion } from 'framer-motion';

interface AnimatedRingsProps {
  title: string;
  description: string;
}

function AnimatedRingsContent({ title, description }: AnimatedRingsProps) {
  return (
    <div className="relative w-[40rem] h-[40rem] flex items-center justify-center">
      {/* Animated rings */}
      <motion.div
        className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/30"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute inset-[15%] rounded-full border-[2px] border-dotted border-primary/40"
        animate={{
          rotate: -360,
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: 25,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute inset-[30%] rounded-full border-[4px] border-primary/20"
        animate={{
          rotate: 360,
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 30,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute inset-[45%] rounded-full border-[1px] border-dashed border-primary/50"
        animate={{
          rotate: -360,
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 15,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Center content */}
      <motion.div
        className="relative flex flex-col items-center text-center space-y-4 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.div
          className="p-4 rounded-full bg-primary/5 ring-2 ring-primary/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-primary/60"
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 5,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
            role="img"
            aria-label="Chain link icon representing URL shortening"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </motion.svg>
        </motion.div>
        <motion.h2
          className="text-2xl font-bold text-primary/80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {description}
        </motion.p>
      </motion.div>
    </div>
  );
}

export function AnimatedRings({ title, description }: AnimatedRingsProps) {
  return (
    <div className="hidden lg:flex relative bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/[0.03] via-primary/[0.01] to-transparent" />
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.primary/[0.04])_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.primary/[0.04])_1px,transparent_1px)] bg-[size:24px_24px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      </div>
      <div className="absolute h-full w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedRingsContent title={title} description={description} />
        </div>
      </div>
    </div>
  );
}
