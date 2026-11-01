import Image from "next/image";
import { LOGOS } from "@/data/logos";

/** Team logo on a dark plate (some logos are white and would vanish on a light background). */
export default function TeamLogo({ tag, size = 36, className = "" }: { tag: string; size?: number; className?: string }) {
  const pad = Math.round(size * 0.14);
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-md bg-[var(--plate)] ${className}`}
      style={{ width: size, height: size, padding: pad }}
    >
      <Image src={LOGOS[tag]} alt="" className="max-h-full w-auto max-w-full object-contain" />
    </span>
  );
}
