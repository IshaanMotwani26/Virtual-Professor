// src/app/vinay/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Header from "@/components/header";

export default function Vinay() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [inputOptions, setInputOptions] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [textboxValue, setTextboxValue] = useState("")

  // fetch key status once
  useEffect(() => {
    fetch("/api/vinay/status")
      .then((r) => r.json())
      .then((d) => setHasKey(!!d.hasKey))
      .catch(() => setHasKey(false));
  }, []);

  

  const handleSubmit = useCallback(async (e: { preventDefault: () => void; } | null) => {
    if (e) e.preventDefault()
    if (textboxValue.trim() === "") return
    setChatHistory(prev => [...prev, textboxValue])
    setAwaitingResponse(true)
    const res = await fetch("/api/vinay/ask", {
      method: "POST",
      body: JSON.stringify({ prompt: textboxValue }),
    });
    const data = await res.json();
    setAwaitingResponse(false)
    setChatHistory(prev => prev.slice(0, -1))
    setChatHistory(prev => [
      ...prev,
      textboxValue,
      data.choices[0]?.message?.content || "Yeah your question so bad gpt didnt want to answer it😭",
    ])
    setTextboxValue("")
  }, [textboxValue]);

  // If an initial prompt is provided via the `init` query param, set it and submit
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const init = params.get('init');
      if (init && init.trim() !== "") {
        // set the textbox value and auto-submit after a tick so component mounts
        setTextboxValue(init);
        // small timeout to let state update and UI render
        setTimeout(() => {
          // create a fake event object compatible with handleSubmit
          handleSubmit({ preventDefault: () => {} });
          // remove the param from URL to avoid re-submitting on reload
          params.delete('init');
          const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
          window.history.replaceState({}, '', newUrl);
        }, 50);
      }
    } catch (e) {
      console.error('Failed to auto-send init prompt:', e);
    }
  }, [handleSubmit]);

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])


  return (
    <div className="flex flex-col h-full w-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <div className="flex p-6 flex-col h-full w-full">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-tight">VirtualProfessor</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Learn the <span className="font-semibold">why</span> — not just the answer.
          </p>
        </div>
        <div className="flex justify-end">
          <span
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium justify-end w-fit",
              hasKey === null
                ? "bg-gray-200/60 text-gray-700 dark:bg-gray-800 dark:text-gray-300 animate-pulse"
                : hasKey
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300",
            ].join(" ")}
          >
            <span className={["h-2 w-2 rounded-full", hasKey ? "bg-emerald-500" : "bg-rose-500"].join(" ")} />
            {hasKey === null ? "Loading..." : hasKey ? "Systems Nominal" : "Systems Offline"}
          </span>
        </div>
        <div className="flex flex-grow mt-6 w-full justify-center">
          <div className="flex flex-col h-full w-4/5 items-end gap-4">
            <div className="flex flex-col h-16 overflow-y-auto scrollbar-hide gap-4 w-full flex-grow">
              {chatHistory.map((message, index) => (
                <div key={index} className={`p-3 rounded-lg  shadow-md w-fit ${index % 2 === 0 ? "self-start bg-blue-600" : "self-end bg-white dark:bg-gray-800"} text-gray-100`}>
                  {message}
                </div>
              ))}
              {awaitingResponse && chatHistory.length > 0 && (
                <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md w-fit self-end animate-pulse">
                  ...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="w-full flex justify-center">
              {inputOptions ? (<div className="absolute bottom-24 left-44 bg-gray-800 text-gray-100 rounded-lg shadow-lg">
                <div className="flex flex-col gap-2 items-start">
                  <button className="rounded-lg text-white hover:bg-gray-700 w-full transition duration-300 p-2">Image</button>
                  <button className="rounded-lg text-white hover:bg-gray-700 w-full transition duration-300 p-2">Microphone</button>
                </div>
              </div>) : null}
              <form onSubmit={handleSubmit} className=" text-gray-900 dark:text-gray-100 flex flex-col h-fit w-full mt-6 rounded-xl  p-2">
                <div className="w-full h-14 p-2 rounded-xl flex flex-row items-center bg-gray-50 dark:bg-gray-800">
                  <div onClick={() => setInputOptions((prev) => !prev)} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-lg font-medium text-center cursor-pointer">+</div>
                  <input value={textboxValue} onChange={(e) => setTextboxValue(e.target.value)} type="text" placeholder="Type your message here..." className="flex-grow mx-4 bg-transparent outline-none text-gray-100 placeholder-gray-400" />
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-lg font-medium text-center cursor-pointer">🔎  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
