"use client";
import { useEffect, useState, useRef } from "react";
import { File, Send } from "lucide-react";

/** belt-and-suspenders client-side masking so Free mode never reveals final answers */
function maskFinalsClient(s) {
	let t = s || "";
	t = t.replace(/([a-z]\s*=\s*)-?\d+(\.\d+)?/gi, "$1____");
	t = t.replace(/\b(answer|thus|therefore|so)\b[^.\n]*\b=\s*-?\d+(\.\d+)?/gi, "");
	t = t.replace(/(\d+)\s*([+\-*/])\s*(\d+)\s*=\s*-?\d+(\.\d+)?/g, "$1 $2 $3 = ____");
	return t;
}

export default function Chat({ initPrompt, clearInitPrompt }) {
	const [hasKey, setHasKey] = useState(null);
	const [inputOptions, setInputOptions] = useState(false);
	const [awaitingResponse, setAwaitingResponse] = useState(false);

	// keep your history as strings; we render bubbles by even/odd index (user/assistant)
	const [chatHistory, setChatHistory] = useState([]);
	const [textboxValue, setTextboxValue] = useState("");
	const [files, setFiles] = useState([]);

	const [questions, setQuestions] = useState([]);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [waiting, setWaiting] = useState(true);
	const [assessing, setAssessing] = useState(false);
	const [learning, setLearning] = useState(false);
	const [weakspots, setWeakspots] = useState([]);
	const [loadingText, setLoadingText] = useState("Thinking...");
	const [introtext, setIntroText] = useState("");

	// NEW: mode toggle ("learn" quiz flow vs "free" guided hints)
	const [mode, setMode] = useState("learn"); // "learn" | "free"

	// rotating loading text
	useEffect(() => {
		const loadingtexts = [
			"Thinking...",
			"Hang on...",
			"One sec...",
			"Working on it...",
			"Just a moment...",
			"Let me see...",
			"Double checking...",
			"Analyzing...",
		];
		if (awaitingResponse) {
			const loadingInterval = setInterval(() => {
				setLoadingText(
					loadingtexts[Math.floor(Math.random() * loadingtexts.length)]
				);
			}, 5000);
			return () => clearInterval(loadingInterval);
		}
	}, [awaitingResponse]);

	// initial theme + greeting
	useEffect(() => {
		document.documentElement.classList.add("dark");
		const introtexts = [
			"I'm ready when you are.",
			"What are we learning today?",
			"Ask me anything.",
			"Let's get started.",
			"Ready to study?",
		];
		setIntroText(introtexts[Math.floor(Math.random() * introtexts.length)]);
	}, []);

	// fetch key status once
	useEffect(() => {
		fetch("/api/vinay/status")
			.then((r) => r.json())
			.then((d) => setHasKey(!!d.hasKey))
			.catch(() => setHasKey(false));
	}, []);

	// autosend init prompt from homepage (micro-lesson)
	useEffect(() => {
		if (initPrompt && initPrompt.trim() !== "") {
			setTextboxValue(initPrompt);
			setWaiting(false);
			// tiny delay to let input state settle, then submit
			setTimeout(() => {
				handleSubmit();
				// clear the init prompt upstream (optional)
				try {
					clearInitPrompt && clearInitPrompt(undefined);
				} catch { }
			}, 60);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initPrompt]);

	async function handleSubmit(e) {
		e?.preventDefault?.();
		const prompt = textboxValue.trim();
		if (!prompt) return;

		// add user bubble
		setChatHistory((prev) => [...prev, prompt]);
		setTextboxValue("");
		setAwaitingResponse(true);
		setWaiting(false);

		try {
			if (mode === "learn") {
				// === DIAGNOSTIC / FLASHCARDS FLOW ===
				const res = await fetch("/api/kyrai/evaluate", {
					method: "POST",
					body: JSON.stringify({ prompt }),
				});
				let { response } = await res.json();
				response = JSON.parse(response);

				// shuffle choices per question (preserve your logic)
				for (const qIdx in response.questions) {
					let choices = response.questions[qIdx].choices;
					choices = choices.sort(() => Math.random() - 0.5);
					response.questions[qIdx].choices = choices;
				}

				setAssessing(true);
				setQuestions(response.questions);
				// small assistant note to show in chat
				setChatHistory((prev) => [
					...prev,
					"Great—let’s start with a quick diagnostic. Pick the best answer for each question.",
				]);
			} else {
				// === FREE MODE (GUIDED, NO FINAL ANSWER) ===
				// If files exist, run OCR first to get context; then call /api/hints
				let context = "";
				if (files.length > 0) {
					const formData = new FormData();
					files.forEach((file) => formData.append("file", file));
					formData.append("prompt", prompt);
					const ocrRes = await fetch("/api/vinay/ocr", {
						method: "POST",
						body: formData,
					});
					const ocrData = await ocrRes.json();
					context = ocrData?.text || "";
				}

				const hRes = await fetch("/api/hints", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ context, userPrompt: prompt }),
				});
				const hData = await hRes.json();
				const raw =
					hData?.text ||
					"Here’s a concept outline and some guiding steps (no final solution).";
				const guidance = maskFinalsClient(raw);
				setChatHistory((prev) => [...prev, guidance]);
			}
		} catch (err) {
			setChatHistory((prev) => [
				...prev,
				"Sorry—something went wrong. Try again in a moment.",
			]);
		} finally {
			setAwaitingResponse(false);
		}
	}

	const bottomRef = useRef(null);
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chatHistory, assessing, awaitingResponse]);

	return (
		<div className="flex flex-col h-[80vh] w-full text-gray-900 dark:text-gray-100">
			<div className="flex p-6 flex-col h-full w-full">
				<div className="flex flex-col items-center">
					<h1 className="text-3xl font-bold tracking-tight">VirtualProfessor</h1>
					<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
						Learn the <span className="font-semibold">why</span> — not just the
						answer.
					</p>

					{/* Mode toggle */}
					<div className="mt-3 flex gap-2">
						<button
							onClick={() => setMode("learn")}
							className={`px-3 py-1 rounded-lg text-sm font-medium border dark:border-gray-700 ${mode === "learn"
								? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
								: "hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
						>
							Learn mode
						</button>
						<button
							onClick={() => setMode("free")}
							className={`px-3 py-1 rounded-lg text-sm font-medium ${mode === "free"
								? "bg-indigo-600 text-white"
								: "border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
						>
							Free mode
						</button>
					</div>
				</div>

				<div className="flex justify-end mt-2">
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
						<span
							className={["h-2 w-2 rounded-full", hasKey ? "bg-emerald-500" : "bg-rose-500"].join(
								" "
							)}
						/>
						{hasKey === null ? "Loading..." : hasKey ? "Systems Nominal" : "Systems Offline"}
					</span>
				</div>

				<div className="flex flex-grow mt-6 w-full justify-center">
					<div className="flex flex-col h-full w-4/5 items-end gap-4">
						<div className="flex flex-col overflow-y-auto scrollbar-hide gap-4 w-full flex-grow">
							{/* Chat bubbles (even index = user, odd index = assistant) */}
							<div className="flex flex-col gap-4">
								{chatHistory.map((msg, i) => {
									const me = i % 2 === 0; // user bubble
									return (
										<div
											key={i}
											className={`max-w-[70%] rounded-2xl px-4 py-2 ${!me
												? "self-start bg-gray-700 text-gray-50"
												: "self-end bg-indigo-600 text-white"
												}`}
										>
											{msg}
										</div>
									);
								})}
							</div>

							{/* Learn mode assessment block */}
							{questions.length > 0 && assessing && (
								<div className="bg-gray-700 text-gray-50 p-4 rounded-xl flex flex-col gap-3">
									<div className="text-2xl">{questions[currentQuestion].question}</div>
									<div className="grid grid-flow-col grid-rows-2 gap-2">
										{questions[currentQuestion].choices.map((option, index) => (
											<div
												key={index}
												onClick={() => {
													let newWeakspots = weakspots;
													if (!option.is_correct) {
														newWeakspots = [
															...weakspots,
															questions[currentQuestion].concept_tag,
														];
														setWeakspots(newWeakspots);
													}
													if (currentQuestion + 1 === questions.length) {
														setAssessing(false);
														setLearning(true);
													} else {
														setCurrentQuestion(currentQuestion + 1);
													}
												}}
												className="m-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-600 cursor-pointer flex items-center justify-center"
											>
												{option.choice}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Loading / waiting */}
							{awaitingResponse && (
								<div className="text-gray-50 rounded-xl flex justify-center items-center">
									<div className="animate-pulse text-4xl">{loadingText}</div>
								</div>
							)}
							{waiting && chatHistory.length === 0 && (
								<div className="text-gray-50 rounded-xl flex justify-center items-center">
									<div className="text-4xl">{introtext}</div>
								</div>
							)}

							<div ref={bottomRef} />
						</div>

						{/* Input */}
						<div className="w-full flex justify-center">
							<form
								onSubmit={handleSubmit}
								className={`${awaitingResponse ? "opacity-50 pointer-events-none" : ""
									} text-gray-900 dark:text-gray-100 flex flex-col h-fit w-full mt-2 rounded-xl`}
							>
								<div className="w-full h-fit p-2 gap-2 rounded-xl flex flex-col bg-gray-50 dark:bg-gray-800">
									{files.length > 0 && (
										<div className="flex flex-row gap-2 overflow-x-auto scrollbar-hide">
											{files.map((file, index) => (
												<div
													key={index}
													className="flex flex-row items-center w-fit p-2 h-full rounded-xl bg-gray-700 text-gray-50 font-medium text-sm"
												>
													<File size={32} className="mr-2" />
													<div className="flex flex-col">
														{file.name}
														<div className="text-xs text-gray-400">
															{(file.size / (1024 * 1024)).toFixed(2)} MB
														</div>
													</div>
												</div>
											))}
										</div>
									)}

									<div className="flex flex-row w-full items-center">
										<div
											onClick={() => {
												document.getElementById("fileInput")?.click();
												setInputOptions((prev) => !prev);
											}}
											className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-lg font-medium text-center cursor-pointer"
											title="Attach files"
										>
											+
										</div>
										<input
											id="fileInput"
											type="file"
											multiple
											className="hidden"
											onChange={(e) => {
												if (e.target.files)
													setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
											}}
										/>
										<input
											value={textboxValue}
											onChange={(e) => setTextboxValue(e.target.value)}
											type="text"
											placeholder={
												mode === "free"
													? "Describe your problem (you can also attach a file)…"
													: "Type to begin the diagnostic…"
											}
											className="flex-grow mx-4 bg-transparent outline-none text-gray-100 placeholder-gray-400"
										/>
										<button
											type="submit"
											className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-lg font-medium text-center"
											aria-label="Send"
											title="Send"
										>
											<Send size={16} className="text-gray-300" />
										</button>
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
