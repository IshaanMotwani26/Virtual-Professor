"use client"
import { useEffect, useState, useRef } from "react";

import { File, Send } from 'lucide-react';



export default function Chat({ initPrompt, clearInitPrompt }) {
	const [hasKey, setHasKey] = useState(null);
	const [inputOptions, setInputOptions] = useState(false);
	const [awaitingResponse, setAwaitingResponse] = useState(false);
	const [chatHistory, setChatHistory] = useState([]);
	const [textboxValue, setTextboxValue] = useState("")
	const [files, setFiles] = useState([])

  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [waiting, setWaiting] = useState(true)
  const [assessing, setAssessing] = useState(false)
  const [learning, setLearning] = useState(false)
  const [weakspots, setWeakspots] = useState([])
  const [loadingText, setLoadingText] = useState("Thinking...")

  useEffect(() => {
    const loadingtexts = ["Thinking...", "Hang on...", "One sec...", "Working on it...", "Just a moment...", "Let me see...", "Double checking...", "Analyzing..."]
    if (awaitingResponse) {
      const loadingInterval = setInterval(() => {
        setLoadingText(loadingtexts[Math.floor(Math.random() * loadingtexts.length)])
      }, 5000);
      return () => clearInterval(loadingInterval);
    }
  }, [awaitingResponse]);
  // fetch key status once
  useEffect(() => {
    fetch("/api/vinay/status")
      .then((r) => r.json())
      .then((d) => setHasKey(!!d.hasKey))
      .catch(() => setHasKey(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault()
    if (textboxValue.trim() === "") return
    setChatHistory(prev => [...prev, textboxValue])
    setTextboxValue("")
    setAwaitingResponse(true)
    setWaiting(false)
    let data;
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
      var { response } = await res.json();
      response = JSON.parse(response)
      console.log(response.questions)
      setAwaitingResponse(false)
      for (const question in response.questions) {
        var choices = response.questions[question].choices;
        choices = choices.sort(() => Math.random() - 0.5);
        response.questions[question].choices = choices;
      }
      setAssessing(true)
      setQuestions(response.questions)
    }

		// // If an initial prompt is provided via the `init` query param, set it and submit
		// useEffect(() => {
		// 	try {
		// 		if (initPrompt && initPrompt.trim() !== "") {
		// 			// set the textbox value and auto-submit after a tick so component mounts
		// 			setTextboxValue(initPrompt);
		// 			// small timeout to let state update and UI render
		// 			setTimeout(() => {
		// 				// create a fake event object compatible with handleSubmit
		// 				handleSubmit({ preventDefault: () => { } });
		// 			}, 70);
		// 			clearInitPrompt("");
		// 		}
		// 	} catch (e) {
		// 		console.error('Failed to auto-send init prompt:', e);
		// 	}
		// }, [handleSubmit]);

	}

	const bottomRef = useRef(null)

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
              {(questions.length > 0) && assessing &&
                <div className="bg-gray-700 text-gray-50 p-4 h-full w-full rounded-xl flex justify-center items-center flex-col ">
                  <div className="text-2xl">{questions[currentQuestion].question}</div>
                  <div className="grid grid-flow-col grid-rows-2 h-full w-full">
                    {questions[currentQuestion].choices.map((option, index) => (
                      <div key={index} onClick={() => {
                        let newWeakspots = weakspots;
                        if (!option.is_correct) {
                          newWeakspots = [...weakspots, questions[currentQuestion].concept_tag];
                          setWeakspots(newWeakspots);
                        }

                        if (currentQuestion + 1 === questions.length) {
                          setAssessing(false);
                          console.log(newWeakspots); // now it includes the last question
                          setLearning(true);
                        } else {
                          setCurrentQuestion(currentQuestion + 1);
                        }
                      }} className="m-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-600 cursor-pointer flex items-center justify-center">
                        {option.choice}
                      </div>
                    ))}
                  </div>
                </div>
              }

              {(awaitingResponse) &&
                <div className=" text-gray-50 h-full w-full rounded-xl flex justify-center items-center">
                  <div className="animate-pulse text-4xl">{loadingText}</div>
                </div>
              }
              {(waiting) &&
                <div className=" text-gray-50 h-full w-full rounded-xl flex justify-center items-center">
                  <div className="text-4xl">I'm ready when you are.</div>
                </div>
              }

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
                    <div onClick={() => { document.getElementById("fileInput")?.click(); setInputOptions((prev) => !prev) }} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-lg font-medium text-center cursor-pointer">+</div>
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
