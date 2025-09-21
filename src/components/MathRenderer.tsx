"use client";
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export default function MathRenderer({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(text, ref.current, {
          throwOnError: false,
          displayMode: false,
          output: "html",
        });
      } catch (err) {
        ref.current.innerText = text;
      }
    }
  }, [text]);

  return (
    <div
      ref={ref}
      className="prose max-w-none text-gray-900 dark:text-gray-100"
    />
  );
}
