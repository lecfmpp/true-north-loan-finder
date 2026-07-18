import { useEffect } from "react";

interface CalendlyInlineProps {
  url: string;
  height?: number;
}

const CalendlyInline = ({ url, height = 700 }: CalendlyInlineProps) => {
  useEffect(() => {
    const src = "https://assets.calendly.com/assets/external/widget.js";
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (!existing) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      className="calendly-inline-widget"
      data-url={url}
      style={{ minWidth: "320px", height: `${height}px` }}
    />
  );
};

export default CalendlyInline;
