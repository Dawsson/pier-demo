import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

export function CounterValue({ value }: { readonly value: number }) {
  const previousValue = useRef(value);
  const direction = value >= previousValue.current ? "up" : "down";
  const characters = String(value).split("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  const distance = direction === "up" ? "0.72em" : "-0.72em";
  const exitDistance = direction === "up" ? "-0.72em" : "0.72em";

  return (
    <span
      aria-label={String(value)}
      aria-live="polite"
      className="flex min-w-[2ch] justify-center px-2 py-2 font-semibold text-8xl leading-none tabular-nums sm:text-[7.5rem] md:text-[8.25rem]"
    >
      {characters.map((character, index) => {
        return (
          <span
            aria-hidden
            className="relative inline-grid h-[1.08em] w-[0.58em] place-items-center overflow-hidden"
            key={index}
          >
            <span className="invisible leading-none">{character}</span>
            <AnimatePresence initial={false}>
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 grid place-items-center leading-none"
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: exitDistance }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: distance }}
                key={`${index}-${character}`}
                transition={{
                  bounce: 0.22,
                  duration: 0.28,
                  type: "spring",
                }}
              >
                {character}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}
