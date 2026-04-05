import { CarouselSlide } from "@/lib/api";

interface CarouselPreviewProps {
  slides: CarouselSlide[];
}

function slideStyles(type: string): { card: string; headline: string; body: string } {
  switch (type) {
    case "cover":
      return {
        card: "bg-gradient-to-br from-blue-600 to-blue-800 text-white",
        headline: "text-white text-xl font-bold leading-tight",
        body: "text-blue-100 text-sm",
      };
    case "stat":
      return {
        card: "bg-gradient-to-br from-indigo-500 to-purple-700 text-white",
        headline: "text-white text-2xl font-extrabold",
        body: "text-indigo-100 text-sm",
      };
    case "quote":
      return {
        card: "bg-gray-900 text-white border border-gray-700",
        headline: "text-white text-lg font-semibold italic",
        body: "text-gray-300 text-sm",
      };
    case "cta":
      return {
        card: "bg-gradient-to-br from-gray-900 to-gray-800 text-white",
        headline: "text-white text-lg font-bold",
        body: "text-gray-300 text-sm",
      };
    default:
      // insight, list
      return {
        card: "bg-white border-2 border-blue-500 text-gray-900",
        headline: "text-gray-900 text-base font-bold",
        body: "text-gray-600 text-sm",
      };
  }
}

export function CarouselPreview({ slides }: CarouselPreviewProps) {
  if (!slides || slides.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        LinkedIn Carousel — {slides.length} slides
      </p>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300">
        {slides.map((slide) => {
          const styles = slideStyles(slide.slide_type);
          const bodyLines = slide.body ? slide.body.split("\n").filter(Boolean) : [];

          return (
            <div
              key={slide.slide_number}
              className={`
                flex-none w-64 h-64 rounded-xl p-4 snap-start
                flex flex-col justify-between shadow-md
                ${styles.card}
              `}
            >
              {/* Top: slide number + type badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-60 font-mono">
                  {slide.slide_number}/{slides.length}
                </span>
                <span className="text-xs opacity-60 capitalize bg-black/10 px-2 py-0.5 rounded-full">
                  {slide.slide_type}
                </span>
              </div>

              {/* Middle: emoji + headline */}
              <div className="flex flex-col gap-1">
                <span className="text-2xl">{slide.emoji}</span>
                <p className={styles.headline}>{slide.headline}</p>
                {slide.subheadline && (
                  <p className="text-xs opacity-70 font-medium">{slide.subheadline}</p>
                )}
              </div>

              {/* Bottom: body */}
              {bodyLines.length > 0 && (
                <div className={`${styles.body} space-y-0.5`}>
                  {bodyLines.length === 1 ? (
                    <p className="line-clamp-3">{bodyLines[0]}</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {bodyLines.slice(0, 3).map((line, i) => (
                        <li key={i} className="flex gap-1">
                          <span className="opacity-50">•</span>
                          <span className="line-clamp-1">{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full slide list below for readability */}
      <details className="group">
        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 select-none">
          View all slide text
        </summary>
        <div className="mt-3 space-y-3">
          {slides.map((slide) => (
            <div
              key={slide.slide_number}
              className="border border-gray-200 rounded-lg p-3 text-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{slide.emoji}</span>
                <span className="font-semibold text-gray-900">{slide.headline}</span>
                <span className="ml-auto text-xs text-gray-400 capitalize">{slide.slide_type}</span>
              </div>
              {slide.subheadline && (
                <p className="text-gray-500 text-xs mb-1">{slide.subheadline}</p>
              )}
              {slide.body && (
                <p className="text-gray-700 whitespace-pre-line text-xs">{slide.body}</p>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
