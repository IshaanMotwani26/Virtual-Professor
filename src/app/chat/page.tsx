"use client"
// src/app/vinay/page.tsx
import { useEffect, useState, useRef } from "react";
import Header from "@/components/header";

import { Paperclip, File, Send } from 'lucide-react';


type Tab = "chat" | "image";
type Hist = { id: string; q: string; a: string; at: number };

export default function Vinay() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [inputOptions, setInputOptions] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [textboxValue, setTextboxValue] = useState("")
  const [files, setFiles] = useState<File[]>([])

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
    setTextboxValue("")
    setAwaitingResponse(true)
    let data: any;
    if (files.length > 0) {
      const formData = new FormData()
      files.forEach((file) => formData.append("file", file))
      formData.append("prompt", textboxValue)
      const res = await fetch("/api/vinay/ocr", {
        method: "POST",
        body: formData,
      });
      data = await res.json();
      setAwaitingResponse(false)
      setChatHistory(prev => prev.slice(0, -1))
      setChatHistory(prev => [
        ...prev,
        textboxValue,
        data.text || "Yeah your question so bad gpt didnt want to answer it😭",
      ])
    } else {
      const res = await fetch("/api/kyrai/evaluate", {
        method: "POST",
        body: JSON.stringify({ prompt: textboxValue }),
      });
      console.log(res)
      const { response } = await res.json();
      console.log(response);
      
      

      setAwaitingResponse(false)
      setChatHistory(prev => prev.slice(0, -1))
      setChatHistory(prev => [
        ...prev,
        textboxValue,
        response || "Yeah your question so bad gpt didnt want to answer it😭",
      ])
    }


  }

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
                <div key={index} className={`p-3 rounded-lg  shadow-md w-fit ${index % 2 === 0 ? "self-end bg-blue-600" : "self-start bg-white dark:bg-gray-800"} text-gray-100`}>
                  {message}
                </div>
              ))}
              {awaitingResponse && chatHistory.length > 0 && (
                <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md w-fit self-start animate-pulse">
                  ...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="w-full flex justify-center">
              <form onSubmit={handleSubmit} className={`${awaitingResponse ? "opacity-50 pointer-events-none" : ""} text-gray-900 dark:text-gray-100 flex flex-col h-fit w-full mt-6 rounded-xl`}>
                <div className="w-full h-fit p-2 gap-2 rounded-xl flex flex-col bg-gray-50 dark:bg-gray-800">
                  {(files.length > 0) && <div className="flex flex-row gap-2 overflow-x-auto scrollbar-hide">
                    {files.map((file, index) => (
                      <div key={index} className="flex flex-row items-center w-fit p-2 h-full rounded-xl bg-gray-700 text-gray-50 font-medium text-sm">
                        <File size={32} className="mr-2" />
                        <div className="flex flex-col">
                          {file.name}
                          <div className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                        </div>
                      </div>
                    ))}
                  </div>}
                  <div className="flex flex-row w-full">
                    <div onClick={() => {document.getElementById("fileInput")?.click(); setInputOptions((prev) => !prev)}} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-lg font-medium text-center cursor-pointer">+</div>
                    <input
                      id="fileInput"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files)])
                      }}
                    />
                    <input value={textboxValue} onChange={(e) => setTextboxValue(e.target.value)} type="text" placeholder="Type your message here..." className="flex-grow mx-4 bg-transparent outline-none text-gray-100 placeholder-gray-400" />
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-lg font-medium text-center cursor-pointer"><Send size={16} className="text-gray-400" /></div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
