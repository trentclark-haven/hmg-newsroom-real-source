import { useEffect, useMemo, useRef, useState } from "react";

interface Word {
  word: string;
  start: number;
  end: number;
}

interface CaptionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  words: Word[];
  brandColor: string;
  /** Number of words to show in the caption window centered on current */
  windowSize?: number;
}

export function CaptionOverlay({
  videoRef,
  words,
  brandColor,
  windowSize = 7,
}: CaptionOverlayProps) {
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  // Mirror of activeIdx readable inside the rAF loop without re-subscribing,
  // so we only call setState (and re-render) when the word actually changes.
  const activeIdxRef = useRef<number>(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset tracking whenever the transcript changes.
    activeIdxRef.current = -1;

    const findIdx = (t: number) => {
      // words are sorted by start → binary search for the active word.
      let lo = 0;
      let hi = words.length - 1;
      let found = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const w = words[mid];
        if (t < w.start) hi = mid - 1;
        else if (t > w.end) lo = mid + 1;
        else {
          found = mid;
          break;
        }
      }
      if (found === -1) {
        // Between words: fall back to the last word that has already started.
        for (let i = words.length - 1; i >= 0; i--) {
          if (words[i].start <= t) {
            found = i;
            break;
          }
        }
      }
      return found;
    };

    const commit = (idx: number) => {
      if (idx !== activeIdxRef.current) {
        activeIdxRef.current = idx;
        setActiveIdx(idx);
      }
    };

    let raf = 0;
    const tick = () => {
      commit(findIdx(video.currentTime));
      raf = requestAnimationFrame(tick);
    };
    const startLoop = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const syncOnce = () => commit(findIdx(video.currentTime));

    // Initial position + run the loop only while the video is actually playing.
    syncOnce();
    if (!video.paused && !video.ended) startLoop();

    const onPlay = () => startLoop();
    const onPause = () => {
      stopLoop();
      syncOnce();
    };
    const onSeeked = () => syncOnce();
    const onEnded = () => {
      stopLoop();
      syncOnce();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);

    return () => {
      stopLoop();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
    };
  }, [videoRef, words]);

  const { visible, start } = useMemo(() => {
    if (!words.length) return { visible: [] as Word[], start: 0 };
    const safeActive =
      activeIdx >= 0 && activeIdx < words.length ? activeIdx : -1;
    const half = Math.floor(windowSize / 2);
    let s = Math.max(0, (safeActive === -1 ? 0 : safeActive) - half);
    const e = Math.min(words.length, s + windowSize);
    s = Math.max(0, e - windowSize);
    return { visible: words.slice(s, e), start: s };
  }, [words, activeIdx, windowSize]);

  if (!words.length) return null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 px-4 pb-6 pt-8 pointer-events-none flex justify-center"
      style={{
        background:
          "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))",
      }}
    >
      <div
        className="font-black uppercase tracking-tight text-center leading-tight"
        style={{
          color: "#ffffff",
          fontSize: "clamp(14px, 4.5vw, 24px)",
          textShadow: "0 2px 6px rgba(0,0,0,0.7)",
        }}
        data-testid="caption-overlay"
      >
        {visible.map((w, i) => {
          const realIdx = start + i;
          const isActive = realIdx === activeIdx;
          return (
            <span
              key={`${realIdx}-${w.start}`}
              className="inline-block transition-colors duration-100"
              style={{
                color: isActive ? brandColor : "#ffffff",
                marginRight: "0.35em",
                transform: isActive ? "scale(1.08)" : undefined,
                transformOrigin: "center",
                display: "inline-block",
              }}
            >
              {w.word.trim()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
