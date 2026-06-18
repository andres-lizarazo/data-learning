import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Tweens a number when it changes (XP, stats). Falls back gracefully if motion is off.
export default function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{display}</span>;
}
