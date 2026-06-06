/**
 * OPERATION ARRRUGGA — staged "hero reveal" wrapper.
 *
 * Replaces a sudden DOM dump with a brief staggered slide-in. Use as
 * the outermost wrapper around any "result is ready" surface (image
 * grid, social pack, transcript card). Children are detected by index:
 * each direct child gets a 60ms-stagger card-rise animation.
 *
 *   <HeroReveal trigger={pack?.id}>
 *     <PlatformCard ... />
 *     <PlatformCard ... />
 *   </HeroReveal>
 *
 * `trigger` is a stable key — when it changes the children re-animate.
 * Pass the result id / hash so reveals only fire once per real result.
 */

import { Children, type ReactNode } from "react";

export interface HeroRevealProps {
  trigger: string | number | null | undefined;
  children: ReactNode;
  /** Per-child stagger offset in ms. */
  staggerMs?: number;
  /** Initial delay before first child rises. */
  delayMs?: number;
  className?: string;
  /** Direction for the rise — useful when content fills bottom-up. */
  direction?: "up" | "down";
  /** Optional test id. */
  testId?: string;
}

export function HeroReveal({
  trigger,
  children,
  staggerMs = 70,
  delayMs = 0,
  className,
  direction = "up",
  testId,
}: HeroRevealProps) {
  const arr = Children.toArray(children);
  // null / undefined trigger means "no reveal yet" — render nothing so
  // the consumer can keep an empty slot. Empty children also render
  // nothing.
  if (trigger === null || trigger === undefined) return null;
  if (arr.length === 0) return null;

  return (
    <div
      data-testid={testId ?? "arrugga-hero-reveal"}
      data-trigger={String(trigger)}
      className={className}
    >
      {arr.map((child, i) => (
        <div
          // include trigger in the key so changing trigger replays animation
          key={`${trigger}-${i}`}
          className="arrugga-card-rise"
          style={{
            animationDelay: `${delayMs + i * staggerMs}ms`,
            transform:
              direction === "down" ? "translateY(-18px)" : undefined,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
