"use client"
import { useEffect, useState, useRef } from "react";

import { Paperclip, File, Send } from 'lucide-react';
import { isNull } from "util";



export default function Chat({ initPrompt, clearInitPrompt }) {
	const [hasKey, setHasKey] = useState(null);
	const [inputOptions, setInputOptions] = useState(false);
	const [awaitingResponse, setAwaitingResponse] = useState(false);
	const [chatHistory, setChatHistory] = useState([]);
	const [textboxValue, setTextboxValue] = useState("")
	const [files, setFiles] = useState([])

	const [questions, setQuestions] = useState([])
	const [currentQuestion, setCurrentQuestion] = useState(0)
	const [answering, setAnswering] = useState(true)
	const [answer, setAnswer] = useState(null)

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
		<div className="mx-auto flex flex-col h-[80vh] max-w-6xl text-gray-900 dark:text-gray-100">
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
							{(questions.length > 0) && answering &&
								<div className="bg-gray-700 text-gray-50 p-4 h-full w-full rounded-xl flex justify-center items-center flex-col ">
									<div className="text-2xl">{questions[currentQuestion].question}</div>
									<div className="grid grid-flow-col grid-rows-2 h-full w-full">
										{questions[currentQuestion].choices.map((option, index) => (
											<div key={index} onClick={() => { setAnswer(index); setAnswering(false) }} className="m-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-600 cursor-pointer flex items-center justify-center">
												{option}
											</div>
										))}
									</div>
								</div>
							}
							{(questions.length > 0) && !answering &&
								<div className="bg-gray-700 text-gray-50 p-4 h-full w-full rounded-xl flex justify-center items-center flex-col ">
									<div className="text-2xl">{questions[currentQuestion].question}</div>
									<div className="text-xl mt-4">You answered: <span className="font-bold">{questions[currentQuestion].choices[answer]}</span></div>
									<div className={`text-xl ${questions[currentQuestion].correct_answer == answer ? "text-emerald-400" : "text-rose-400"} mt-2`}>{questions[currentQuestion].correct_answer == answer ? "Correct!" : "Incorrect!"}</div>
									<div className="text-xl">{questions[currentQuestion].explanations[answer - 1]}</div>
									{
										questions[currentQuestion].correct_answer == answer && (
											<div onClick={() => { setAnswering(true); setAnswer(null); setCurrentQuestion(currentQuestion + 1) }} className="cursor-pointer p-4 bg-blue-400 hover:bg-blue-600 transition duration-300 rounded-md">Next Question</div>
										)
									}
									{
										questions[currentQuestion].correct_answer !== answer && (
											<div onClick={() => { setAnswering(true); setAnswer(null) }} className="cursor-pointer p-4 bg-blue-400 hover:bg-blue-600 transition duration-300 rounded-md">Try Again</div>
										)
									}
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
