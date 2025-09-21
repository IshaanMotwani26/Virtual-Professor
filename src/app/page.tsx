"use client";
import React, { useEffect, useState, useCallback } from "react";
import { CalendarDays, ChartBar, House, Moon, School, SquarePen, Star, Sun, Target, Users } from 'lucide-react';
import Chat from "./chat/page";

export default function VirtualProfessorHomepage() {
	// Core State
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [theme, setTheme] = useState<"light" | "dark">("dark");
	const [chatOpen, setChatOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState("home");
	const [isSignUp, setIsSignUp] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [username, setUsername] = useState<string | null>(null);
	const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, type: string, keyPoints: string[] }>>([]);

	// Error Handling State
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
	const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

	// Error handling utilities
	const clearError = useCallback((field: string) => {
		setErrors(prev => {
			const newErrors = { ...prev };
			delete newErrors[field];
			return newErrors;
		});
	}, []);

	const setError = useCallback((field: string, message: string) => {
		setErrors(prev => ({ ...prev, [field]: message }));
	}, []);

	const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
		setNotification({ type, message });
		setTimeout(() => setNotification(null), 5000);
	}, []);

	const setLoadingState = useCallback((key: string, isLoading: boolean) => {
		setLoading(prev => ({ ...prev, [key]: isLoading }));
	}, []);

	// Safe async wrapper
	const safeAsync = useCallback(async (operation: () => Promise<void>, errorKey: string) => {
		try {
			setLoadingState(errorKey, true);
			clearError(errorKey);
			await operation();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
			setError(errorKey, errorMessage);
			showNotification('error', errorMessage);
		} finally {
			setLoadingState(errorKey, false);
		}
	}, [setLoadingState, clearError, setError, showNotification]);

	// Search suggestions with error handling
	useEffect(() => {
		try {
			if (!query) {
				setSuggestions([]);
				return;
			}

			const pool = [
				"Introduction to Psychology",
				"Math: Calculus basics",
				"Computer Science: Data Structures",
				"History: World War II",
				"Economics: Supply and Demand",
				"Exam practice: General Knowledge",
			];

			const filtered = pool.filter((p) =>
				p.toLowerCase().includes(query.toLowerCase())
			).slice(0, 5);

			setSuggestions(filtered);
		} catch (error) {
			console.error('Error filtering suggestions:', error);
			setSuggestions([]);
		}
	}, [query]);

	// Theme handling with error handling
	useEffect(() => {
		try {
			const root = document.documentElement;
			if (theme === "dark") {
				root.classList.add("dark");
			} else {
				root.classList.remove("dark");
			}
		} catch (error) {
			console.error('Error applying theme:', error);
			showNotification('error', 'Failed to apply theme changes');
		}
	}, [theme, showNotification]);

	// On mount: check for a session cookie and validate it with the backend
	useEffect(() => {
		try {
			const cookies = document.cookie.split(';').map(c => c.trim());
			const sessionCookie = cookies.find(c => c.startsWith('session='));
			if (!sessionCookie) return;
			const sessionValue = sessionCookie.split('=')[1];
			if (!sessionValue) return;
			// validate with server
			fetch(`/api/db/validate-session?session=${encodeURIComponent(sessionValue)}`)
				.then(res => res.json().then(body => ({ ok: res.ok, body })))
				.then(({ ok, body }) => {
					if (ok && body.username) {
						setIsAuthenticated(true);
						setUsername(body.username);
						showNotification('success', `Welcome back, ${body.username}`);
					} else {
						// invalid session: clear cookie
						document.cookie = 'session=; path=/; max-age=0';
					}
				})
				.catch(err => console.error('Session validation failed', err));
		} catch (err) {
			console.error('Error checking session cookie', err);
		}
	}, [showNotification]);

	// Validation utilities
	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const validateRequired = (value: string, fieldName: string): boolean => {
		if (!value.trim()) {
			setError(fieldName, `${fieldName} is required`);
			return false;
		}
		clearError(fieldName);
		return true;
	};

	// Navigation with error handling
	const showPage = useCallback((pageId: string) => {
		try {
			setCurrentPage(pageId);
			setChatOpen(false);
			clearError('navigation');
		} catch (error) {
			setError('navigation', 'Failed to navigate to page');
			showNotification('error', 'Navigation failed');
		}
	}, [clearError, setError, showNotification]);

	// Authentication handlers with validation
	const handleAuthSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const fullName = formData.get('fullName') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		// Validation
		let hasErrors = false;

		if (isSignUp && !validateRequired(fullName, 'fullName')) hasErrors = true;
		if (!validateRequired(email, 'email')) hasErrors = true;
		if (!validateRequired(password, 'password')) hasErrors = true;

		if (email && !validateEmail(email)) {
			setError('email', 'Please enter a valid email address');
			hasErrors = true;
		}

		if (password && password.length < 6) {
			setError('password', 'Password must be at least 6 characters');
			hasErrors = true;
		}

		if (isSignUp && confirmPassword !== password) {
			setError('confirmPassword', 'Passwords do not match');
			hasErrors = true;
		}

		if (hasErrors) return;

		await safeAsync(async () => {
			if (isSignUp) {
				const userData = {
					name: fullName,
					email: email,
					password: password
				};

				const response = await fetch('/api/db/new-user', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(userData)
				});

				if (!response.ok) {
					const errorData = await response.json();
					if (response.status === 409) {
						throw new Error('Username already exists. Please try a different email.');
					}
					throw new Error(errorData.error || 'Failed to create account');
				}

				// Handle session cookie returned in response body (workaround for Set-Cookie not persisting)
				const responseData = await response.json();
				if (responseData.session_cookie) {
					// Set cookie client-side. Note: not HttpOnly.
					const cookieValue = responseData.session_cookie;
					// You can customize path/max-age as needed
					document.cookie = `session=${cookieValue}; path=/; max-age=${7 * 24 * 3600}`;
				}
			} else {
				// For sign in, you'll need to create a separate endpoint
				// This is just a placeholder for now
				const response = await fetch('/api/db/signin', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email, password })
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to sign in');
				} else {
					const responseData = await response.json();
					if (responseData.session_cookie) {
						const cookieValue = responseData.session_cookie;
						document.cookie = `session=${cookieValue}; path=/; max-age=${7 * 24 * 3600}`;
					}
				}
			}

			setIsAuthenticated(true);
			setCurrentPage("home");
			showNotification('success', isSignUp ? 'Account created successfully!' : 'Signed in successfully!');
		}, 'auth');
	}, [isSignUp, validateRequired, setError, safeAsync, showNotification]);

	const handleLogout = useCallback(() => {
		try {
			setIsAuthenticated(false);
			setCurrentPage("home");
			setChatOpen(false);
			showNotification('info', 'Signed out successfully');
		} catch (error) {
			showNotification('error', 'Failed to sign out');
		}
	}, [showNotification]);

	// Form submission handlers with error handling
	const handleUploadSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const title = formData.get('title') as string;
		const subject = formData.get('subject') as string;
		const dueDate = formData.get('dueDate') as string;

		let hasErrors = false;
		if (!validateRequired(title, 'uploadTitle')) hasErrors = true;
		if (!validateRequired(subject, 'uploadSubject')) hasErrors = true;
		if (!validateRequired(dueDate, 'uploadDueDate')) hasErrors = true;

		if (hasErrors) return;

		await safeAsync(async () => {
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					if (Math.random() > 0.1) {
						resolve(true);
					} else {
						reject(new Error('Failed to submit assignment'));
					}
				}, 1500);
			});

			showNotification('success', 'Assignment submitted successfully! You will receive feedback within 24 hours.');
			e.currentTarget.reset();
		}, 'upload');
	}, [validateRequired, safeAsync, showNotification]);

	const handleTutorSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const subject = formData.get('subject') as string;
		const level = formData.get('level') as string;

		let hasErrors = false;
		if (!validateRequired(subject, 'tutorSubject')) hasErrors = true;
		if (!validateRequired(level, 'tutorLevel')) hasErrors = true;

		if (hasErrors) return;

		await safeAsync(async () => {
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					if (Math.random() > 0.1) {
						resolve(true);
					} else {
						reject(new Error('Failed to submit tutor request'));
					}
				}, 2000);
			});

			showNotification('success', 'Tutor request submitted! We will match you with a suitable tutor and contact you shortly.');
			e.currentTarget.reset();
		}, 'tutor');
	}, [validateRequired, safeAsync, showNotification]);

	const handleMediaUpload = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		await safeAsync(async () => {
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					if (Math.random() > 0.15) {
						resolve(true);
					} else {
						reject(new Error('Failed to process media file'));
					}
				}, 3000);
			});

			const mockKeyPoints = [
				"Main concept: Photosynthesis converts light energy to chemical energy",
				"Key process: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2",
				"Location: Occurs in chloroplasts of plant cells",
				"Two stages: Light reactions and Calvin cycle",
				"Importance: Primary source of energy for most life on Earth"
			];

			const newFile = {
				name: "Biology Lecture - Photosynthesis",
				type: "video",
				keyPoints: mockKeyPoints
			};

			setUploadedFiles(prev => [...prev, newFile]);
			showNotification('success', 'Media file processed successfully! Key points extracted.');
		}, 'media');
	}, [safeAsync, showNotification]);

	// Error Display Component
	const ErrorDisplay = ({ field }: { field: string }) => {
		if (!errors[field]) return null;
		return (
			<div className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
				<span>⚠</span>
				<span>{errors[field]}</span>
			</div>
		);
	};

	// Loading Indicator Component
	const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
		const sizeClass = size === "lg" ? "w-6 h-6" : size === "md" ? "w-4 h-4" : "w-3 h-3";
		return (
			<div className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin`}></div>
		);
	};

	// Notification Component
	const NotificationBanner = () => {
		if (!notification) return null;

		const bgColor = {
			success: 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-200',
			error: 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-200',
			info: 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200'
		};

		return (
			<div className={`fixed top-4 right-4 max-w-sm p-4 border rounded-lg shadow-lg z-50 ${bgColor[notification.type]}`}>
				<div className="flex items-center justify-between">
					<span>{notification.message}</span>
					<button
						onClick={() => setNotification(null)}
						className="ml-2 text-lg leading-none hover:opacity-75"
					>
						×
					</button>
				</div>
			</div>
		);
	};

	// Landing Page Component
	const LandingPage = () => (
		<div className="min-h-screen flex flex-col">
			<header className="p-6 flex items-center justify-between border-b dark:border-gray-700">
				<div className="flex items-center gap-3">
					<div className="rounded-md bg-gradient-to-r from-indigo-500 to-emerald-400 p-2 text-white font-bold">VP</div>
					<h1 className="text-xl font-semibold">VirtualProfessor</h1>
				</div>
				<button
					onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
					aria-label="Toggle theme"
					className="px-3 py-2 rounded-md border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				>
					{theme === "dark" ? <Sun /> : <Moon />}
				</button>
			</header>

			<div className="flex-1 flex items-center justify-center px-6 py-12">
				<div className="max-w-4xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
					<div>
						<h2 className="text-5xl font-extrabold leading-tight mb-6">
							Your personal virtual professor for any subject
						</h2>
						<p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
							Ask questions, get micro-lessons, track your study schedule, and get help with assignments — all in one place.
						</p>
						<div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
							<div className="flex items-center gap-2">
								<span className="text-green-500">✓</span>
								<span>AI-powered tutoring</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-green-500">✓</span>
								<span>Progress tracking</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-green-500">✓</span>
								<span>Study groups</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-green-500">✓</span>
								<span>Expert tutors</span>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 p-8 rounded-xl border dark:border-gray-700 shadow-lg">
						<div className="text-center mb-6">
							<h3 className="text-2xl font-bold">Get Started Today</h3>
							<p className="text-gray-600 dark:text-gray-300 mt-2">
								{isSignUp ? "Create your account to unlock personalized learning" : "Welcome back! Sign in to continue learning"}
							</p>
						</div>

						<div className="flex gap-2 mb-6">
							<button
								onClick={() => setIsSignUp(true)}
								className={`flex-1 px-4 py-2 rounded-md transition-colors ${isSignUp ? 'bg-indigo-600 text-white' : 'border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
									}`}
							>
								Sign Up
							</button>
							<button
								onClick={() => setIsSignUp(false)}
								className={`flex-1 px-4 py-2 rounded-md transition-colors ${!isSignUp ? 'bg-indigo-600 text-white' : 'border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
									}`}
							>
								Sign In
							</button>
						</div>

						<form onSubmit={handleAuthSubmit} className="space-y-4">
							{isSignUp && (
								<div>
									<label className="block text-sm font-medium mb-1">Name</label>
									<input
										name="fullName"
										type="text"
										className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
										placeholder="Enter your name"
									/>
									<ErrorDisplay field="fullName" />
								</div>
							)}

							<div>
								<label className="block text-sm font-medium mb-1">Email Address</label>
								<input
									name="email"
									type="email"
									className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
									placeholder="Enter your email"
								/>
								<ErrorDisplay field="email" />
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Password</label>
								<input
									name="password"
									type="password"
									className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
									placeholder="Enter your password"
								/>
								<ErrorDisplay field="password" />
							</div>

							{isSignUp && (
								<div>
									<label className="block text-sm font-medium mb-1">Confirm Password</label>
									<input
										name="confirmPassword"
										type="password"
										className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
										placeholder="Confirm your password"
									/>
									<ErrorDisplay field="confirmPassword" />
								</div>
							)}

							<button
								type="submit"
								disabled={loading.auth}
								className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{loading.auth && <LoadingSpinner />}
								{isSignUp ? 'Create Account & Start Learning' : 'Sign In to Dashboard'}
							</button>
							<ErrorDisplay field="auth" />
						</form>

						{!isSignUp && (
							<div className="mt-4 text-center">
								<a href="#" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
									Forgot your password?
								</a>
							</div>
						)}
					</div>
				</div>
			</div>

			<footer className="p-6 text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700">
				<div className="max-w-4xl mx-auto flex justify-between">
					<div>© 2025 VirtualProfessor</div>
					<div className="flex gap-4">
						<a href="#privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
						<a href="#terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
						<a href="#contact" className="hover:text-gray-700 dark:hover:text-gray-300">Contact</a>
					</div>
				</div>
			</footer>
		</div>
	);

	// Main Header Component
	const Header = () => (
		<header className="max-w-6xl mx-auto p-6 flex items-center justify-between border-b dark:border-gray-700">
			<div className="flex items-center gap-3">
				<div className="rounded-md bg-gradient-to-r from-indigo-500 to-emerald-400 p-2 text-white font-bold">VP</div>
				<h1 className="text-xl font-semibold cursor-pointer" onClick={() => showPage("home")}>VirtualProfessor</h1>
			</div>
			<nav className="flex items-center gap-4">
				<button
					onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
					aria-label="Toggle theme"
					className="px-3 py-2 rounded-md border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				>
					{theme === "dark" ? <Sun /> : <Moon />}
				</button>
				<button
					onClick={() => showPage("home")}
					className="px-3 py-2 rounded-md border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				>
					Home
				</button>
				<button
					onClick={handleLogout}
					className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
				>
					Sign Out
				</button>
			</nav>
		</header>
	);

	// Navigation Menu
	const NavigationMenu = () => {
		const navigationItems = [
			{ id: "home", label: "Home", icon: <House size={18} /> },
			{ id: "upload", label: "Upload", icon: <SquarePen size={18} /> },
			{ id: "tutor", label: "Tutor", icon: <School size={18} /> },
			{ id: "study-group", label: "Groups", icon: <Users size={18} /> },
			{ id: "progress", label: "Progress", icon: <ChartBar size={18} /> }
		];

		return (
			<nav className="max-w-6xl mx-auto px-6 py-3 border-b dark:border-gray-700">
				<div className="flex gap-2 overflow-x-auto scrollbar-hide">
					{navigationItems.map((nav) => (
						<button
							key={nav.id}
							onClick={() => {
								if (nav.id === "upload") {
									showPage("chat")
								} else {
									showPage(nav.id)
								}
							}
							}
							className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm font-medium ${currentPage === nav.id
								? "bg-indigo-600 text-white shadow-md"
								: "border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500"
								}`}
						>
							<span className="text-base">{nav.icon}</span>
							<span className="hidden sm:inline">{nav.label}</span>
						</button>
					))}
				</div>
			</nav>
		);
	};

	// Homepage Content
	const HomePage = () => (
		<section className="max-w-6xl mx-auto px-6 grid gap-8 grid-cols-1 lg:grid-cols-3 items-start">
			<div className="lg:col-span-2">
				<h2 className="text-4xl font-extrabold leading-tight">Your personal virtual professor for any subject</h2>
				<p className="mt-3 text-lg text-gray-600 dark:text-gray-300">Ask questions, get micro-lessons, track your study schedule and get help with assignments — all in one place.</p>

				<div className="mt-6">
					<label htmlFor="search" className="sr-only">Search</label>
					<div className="relative">
						<input
							id="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									console.log("Main search query:", query);
								}
							}}
							placeholder="Search subjects, topics or ask a question..."
							className="w-full rounded-md border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:border-gray-700"
							aria-label="Search subjects or ask a question"
						/>
						<button
							onClick={() => console.log("Main search query:", query)}
							className="absolute right-2 top-2 px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
							aria-label="Search"
						>
							Search
						</button>
					</div>

					{suggestions.length > 0 && (
						<ul className="mt-2 bg-white dark:bg-gray-800 border rounded-md p-2 shadow-sm">
							{suggestions.map((s) => (
								<li key={s} className="py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={() => setQuery(s)}>
									{s}
								</li>
							))}
						</ul>
					)}
				</div>

				<h3 className="mt-8 text-xl font-semibold">Featured micro-lessons</h3>
				<div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
					{[
						{ title: "Intro to Algebra", minutes: 6 },
						{ title: "Essay Writing Basics", minutes: 8 },
						{ title: "Critical Thinking", minutes: 12 },
						{ title: "World History Overview", minutes: 10 },
					].map((c) => (
						<article key={c.title} className="p-4 border rounded-md hover:shadow-lg transition-shadow dark:border-gray-700 bg-white dark:bg-gray-800">
							<h4 className="font-semibold">{c.title}</h4>
							<p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{c.minutes} min • micro-lesson</p>
							<div className="mt-3 flex gap-2">
								<button
									onClick={() => {
										const prompt = `Please provide a lesson on "${c.title}" including main concepts, 3 key points, and a short practice question.`;
										window.location.href = `/chat?init=${encodeURIComponent(prompt)}`;
									}}
									className="px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
								>
									Start
								</button>
							</div>
						</article>
					))}
				</div>
			</div>

			<aside>
				<div className="p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
					<h4 className="font-semibold">Today</h4>
					<ul className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
						<li>09:00 — Review class notes</li>
						<li>13:00 — Group project meeting</li>
						<li>16:00 — Exam prep session</li>
					</ul>
					<div className="mt-4 flex gap-2">
						<button className="flex-1 px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Open schedule</button>
						<button className="px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setChatOpen((v) => !v)}>
							{chatOpen ? "Close chat" : "Chat"}
						</button>
					</div>
				</div>

				<div className="mt-4 p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
					<h4 className="font-semibold">Quick actions</h4>
					<div className="mt-3 grid gap-2">
						<button
							onClick={() => window.location.href = "/chat"}
							className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						>
							<SquarePen size={18} /> Upload assignment
						</button>
						<button
							onClick={() => showPage("tutor")}
							className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						>
							<School size={18} /> Request tutor
						</button>
						<button
							onClick={() => showPage("study-group")}
							className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						>
							<Users size={18} /> Join study group
						</button>
						<button
							onClick={() => showPage("progress")}
							className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						>
							<ChartBar size={18} /> Track progress
						</button>
						<button
							onClick={() => showPage("gpa")}
							className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
						>
							<Target size={18} /> GPA tracker
						</button>
					</div>
				</div>
			</aside>
		</section>
	);

	// Progress Tracking Page
	const ProgressPage = () => (
		<section className="max-w-6xl mx-auto px-6 py-8">
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold">Subject Progress Tracking</h2>
				<p className="mt-3 text-gray-600 dark:text-gray-300">Monitor your learning progress across all subjects</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{[
					{
						subject: "Mathematics",
						progress: 75,
						completedTopics: 15,
						totalTopics: 20,
						currentTopic: "Integral Calculus",
						recentActivity: "Completed derivatives quiz with 88% score",
						nextMilestone: "Final exam preparation"
					},
					{
						subject: "Physics",
						progress: 60,
						completedTopics: 12,
						totalTopics: 20,
						currentTopic: "Electromagnetic Waves",
						recentActivity: "Submitted lab report on optics",
						nextMilestone: "Quantum mechanics introduction"
					},
					{
						subject: "Computer Science",
						progress: 90,
						completedTopics: 18,
						totalTopics: 20,
						currentTopic: "Machine Learning Basics",
						recentActivity: "Completed data structures project",
						nextMilestone: "Capstone project presentation"
					},
					{
						subject: "Chemistry",
						progress: 45,
						completedTopics: 9,
						totalTopics: 20,
						currentTopic: "Organic Reactions",
						recentActivity: "Attended synthesis lab session",
						nextMilestone: "Organic chemistry midterm"
					},
					{
						subject: "History",
						progress: 85,
						completedTopics: 17,
						totalTopics: 20,
						currentTopic: "Modern Era",
						recentActivity: "Submitted research paper on WWII",
						nextMilestone: "Final comprehensive exam"
					},
					{
						subject: "Biology",
						progress: 70,
						completedTopics: 14,
						totalTopics: 20,
						currentTopic: "Genetics",
						recentActivity: "Completed cell biology module",
						nextMilestone: "Genetics lab practical"
					}
				].map((subject, index) => (
					<div key={index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
						<div className="flex justify-between items-start mb-4">
							<h3 className="text-xl font-semibold">{subject.subject}</h3>
							<span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{subject.progress}%</span>
						</div>

						<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
							<div
								className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-3 rounded-full transition-all duration-300"
								style={{ width: `${subject.progress}%` }}
							></div>
						</div>

						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600 dark:text-gray-400">Topics Completed:</span>
								<span>{subject.completedTopics}/{subject.totalTopics}</span>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600 dark:text-gray-400">Current Topic:</span>
								<span className="font-medium">{subject.currentTopic}</span>
							</div>

							<div className="pt-2 border-t dark:border-gray-600">
								<p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Recent Activity:</p>
								<p className="text-sm">{subject.recentActivity}</p>
							</div>

							<div className="pt-2">
								<p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Next Milestone:</p>
								<p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{subject.nextMilestone}</p>
							</div>
						</div>

						<div className="flex gap-2 mt-4">
							<button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm">
								Continue Learning
							</button>
							<button className="px-3 py-2 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
								View Details
							</button>
						</div>
					</div>
				))}
			</div>
		</section>
	);

	// GPA Tracker Page
	const GPAPage = () => (
		<section className="max-w-4xl mx-auto px-6 py-8">
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold">GPA Tracker</h2>
				<p className="mt-3 text-gray-600 dark:text-gray-300">Monitor your academic performance and grade trends</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3 mb-8">
				<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 text-center">
					<h3 className="text-lg font-semibold mb-2">Current GPA</h3>
					<div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">3.76</div>
					<p className="text-sm text-gray-600 dark:text-gray-400">out of 4.0</p>
				</div>

				<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 text-center">
					<h3 className="text-lg font-semibold mb-2">Semester GPA</h3>
					<div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">3.82</div>
					<p className="text-sm text-gray-600 dark:text-gray-400">Spring 2025</p>
				</div>

				<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 text-center">
					<h3 className="text-lg font-semibold mb-2">Credit Hours</h3>
					<div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">87</div>
					<p className="text-sm text-gray-600 dark:text-gray-400">completed</p>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 mb-6">
				<h3 className="text-xl font-semibold mb-4">Current Semester Courses</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b dark:border-gray-600">
								<th className="text-left py-2">Course</th>
								<th className="text-left py-2">Credits</th>
								<th className="text-left py-2">Current Grade</th>
								<th className="text-left py-2">Letter Grade</th>
								<th className="text-left py-2">Status</th>
							</tr>
						</thead>
						<tbody className="space-y-2">
							{[
								{ course: "Advanced Calculus", credits: 4, grade: 92, letter: "A", status: "On Track" },
								{ course: "Organic Chemistry", credits: 4, grade: 88, letter: "B+", status: "Good" },
								{ course: "Modern Physics", credits: 3, grade: 95, letter: "A", status: "Excellent" },
								{ course: "World Literature", credits: 3, grade: 85, letter: "B", status: "Good" },
								{ course: "Data Structures", credits: 4, grade: 91, letter: "A-", status: "On Track" }
							].map((course, index) => (
								<tr key={index} className="border-b dark:border-gray-700">
									<td className="py-3 font-medium">{course.course}</td>
									<td className="py-3">{course.credits}</td>
									<td className="py-3">{course.grade}%</td>
									<td className="py-3">
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${course.letter.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
											course.letter.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
												'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
											}`}>
											{course.letter}
										</span>
									</td>
									<td className="py-3">
										<span className={`px-2 py-1 rounded-full text-xs ${course.status === 'Excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
											course.status === 'Good' || course.status === 'On Track' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
												'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
											}`}>
											{course.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
					<h3 className="text-lg font-semibold mb-4">GPA Trends</h3>
					<div className="space-y-3">
						{[
							{ semester: "Fall 2024", gpa: 3.65, credits: 16 },
							{ semester: "Spring 2024", gpa: 3.72, credits: 15 },
							{ semester: "Fall 2023", gpa: 3.58, credits: 17 },
							{ semester: "Spring 2023", gpa: 3.81, credits: 14 }
						].map((sem, index) => (
							<div key={index} className="flex justify-between items-center py-2 border-b dark:border-gray-600 last:border-b-0">
								<div>
									<div className="font-medium">{sem.semester}</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">{sem.credits} credits</div>
								</div>
								<div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{sem.gpa}</div>
							</div>
						))}
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
					<h3 className="text-lg font-semibold mb-4">Grade Calculator</h3>
					<form className="space-y-3">
						<div>
							<label className="block text-sm font-medium mb-1">Course Name</label>
							<input type="text" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="Enter course name" />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium mb-1">Credits</label>
								<input type="number" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="3" />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Grade</label>
								<select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500">
									<option>A (4.0)</option>
									<option>A- (3.7)</option>
									<option>B+ (3.3)</option>
									<option>B (3.0)</option>
									<option>B- (2.7)</option>
									<option>C+ (2.3)</option>
									<option>C (2.0)</option>
								</select>
							</div>
						</div>
						<button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
							Calculate Impact
						</button>
					</form>
				</div>
			</div>
		</section>
	);

	// Media Analysis Page
	const MediaAnalysisPage = () => (
		<section className="max-w-4xl mx-auto px-6 py-8">
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold">Media Analysis & Key Points</h2>
				<p className="mt-3 text-gray-600 dark:text-gray-300">Upload video or voice memos to extract key learning points</p>
			</div>

			<div className="grid gap-8 lg:grid-cols-2">
				<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
					<h3 className="text-xl font-semibold mb-4">Upload Media</h3>
					<form onSubmit={handleMediaUpload} className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-1">Media Type</label>
							<select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500">
								<option>Video File</option>
								<option>Audio File</option>
								<option>Voice Memo</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Subject Area</label>
							<select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500">
								<option>Biology</option>
								<option>Chemistry</option>
								<option>Physics</option>
								<option>Mathematics</option>
								<option>History</option>
								<option>Literature</option>
								<option>Computer Science</option>
								<option>Other</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Media File</label>
							<div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
								<div className="text-4xl mb-4">🎥</div>
								<h3 className="text-lg font-medium mb-2">Drop media files here or click to browse</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400">Supported: MP4, AVI, MP3, WAV, M4A</p>
								<input type="file" accept="video/*,audio/*" className="hidden" />
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Additional Context (Optional)</label>
							<textarea
								className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
								rows={3}
								placeholder="Any specific topics or concepts you want us to focus on?"
							/>
						</div>

						<button
							type="submit"
							disabled={loading.media}
							className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading.media && <LoadingSpinner />}
							Upload & Analyze
						</button>
						<ErrorDisplay field="media" />
					</form>
				</div>

				<div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
					<h3 className="text-xl font-semibold mb-4">Analysis Features</h3>
					<div className="space-y-4">
						<div className="flex items-start gap-3">
							<div className="text-2xl">🧠</div>
							<div>
								<h4 className="font-semibold">AI-Powered Analysis</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">Advanced AI extracts key concepts and learning points from your media</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="text-2xl">⚡</div>
							<div>
								<h4 className="font-semibold">Fast Processing</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">Get your key points within minutes, not hours</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="text-2xl"><SquarePen size={18} /></div>
							<div>
								<h4 className="font-semibold">Structured Notes</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">Organized, searchable notes ready for study sessions</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="text-2xl">🔗</div>
							<div>
								<h4 className="font-semibold">Smart Connections</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">Links concepts to your existing coursework</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{uploadedFiles.length > 0 && (
				<div className="mt-8">
					<h3 className="text-xl font-semibold mb-4">Analyzed Media Files</h3>
					<div className="space-y-4">
						{uploadedFiles.map((file, index) => (
							<div key={index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
								<div className="flex justify-between items-start mb-4">
									<div>
										<h4 className="font-semibold text-lg">{file.name}</h4>
										<p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{file.type} File • Analyzed</p>
									</div>
									<span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-sm">
										Complete
									</span>
								</div>

								<div>
									<h5 className="font-medium mb-2">Key Points Extracted:</h5>
									<ul className="space-y-2">
										{file.keyPoints.map((point, pointIndex) => (
											<li key={pointIndex} className="flex items-start gap-2">
												<span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
												<span className="text-sm">{point}</span>
											</li>
										))}
									</ul>
								</div>

								<div className="flex gap-2 mt-4">
									<button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm">
										Export Notes
									</button>
									<button className="px-4 py-2 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
										Create Study Guide
									</button>
									<button className="px-4 py-2 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
										Share Notes
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</section>

	);


	// Tutor Request Page
	const TutorPage = () => (
		<section className="max-w-4xl mx-auto px-6 py-8">
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold">Request a Tutor</h2>
				<p className="mt-3 text-gray-600 dark:text-gray-300">Connect with expert tutors for personalized one-on-one learning</p>
			</div>

			<div className="grid gap-8 lg:grid-cols-2">
				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
					<form onSubmit={handleTutorSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-1">Subject Area</label>
							<select
								name="subject"
								className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
							>
								<option value="">Select subject</option>
								<option>Mathematics</option>
								<option>Physics</option>
								<option>Chemistry</option>
								<option>Biology</option>
								<option>English Literature</option>
								<option>History</option>
								<option>Computer Science</option>
								<option>Economics</option>
								<option>Other</option>
							</select>
							<ErrorDisplay field="tutorSubject" />
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Learning Level</label>
							<select
								name="level"
								className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
							>
								<option value="">Select level</option>
								<option>High School</option>
								<option>Undergraduate</option>
								<option>Graduate</option>
								<option>Professional</option>
							</select>
							<ErrorDisplay field="tutorLevel" />
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Session Type</label>
							<select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500">
								<option>One-time session</option>
								<option>Weekly sessions</option>
								<option>Intensive course</option>
								<option>Exam preparation</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Availability</label>
							<input type="text" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Weekends, evenings, specific days" />
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Learning Goals</label>
							<textarea
								className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
								rows={3}
								placeholder="What specific topics or skills would you like to focus on?"
							/>
						</div>

						<button
							type="submit"
							disabled={loading.tutor}
							className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading.tutor && <LoadingSpinner />}
							Find My Tutor
						</button>
						<ErrorDisplay field="tutor" />
					</form>
				</div>

				<div className="space-y-4">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
						<h3 className="font-semibold text-lg mb-2"><Target size={18} /> Personalized Learning</h3>
						<p className="text-sm text-gray-600 dark:text-gray-300">Tailored sessions based on your learning style and pace</p>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
						<h3 className="font-semibold text-lg mb-2"><Star size={18} /> Expert Tutors</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400">Certified professionals with proven track records</p>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
						<h3 className="font-semibold text-lg mb-2"><CalendarDays size={18} /> Flexible Scheduling</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400">Book sessions that fit your busy schedule</p>
					</div>
				</div>
			</div>
		</section>
	);

	// Study Group Page
	const StudyGroupPage = () => (
		<section className="max-w-4xl mx-auto px-6 py-8">
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold">Join a Study Group</h2>
				<p className="mt-3 text-gray-600 dark:text-gray-300">Collaborate with peers and enhance your learning through group study</p>
			</div>

			<div className="mb-6">
				<input
					type="text"
					className="w-full px-4 py-3 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
					placeholder="Search study groups by subject or topic..."
				/>
			</div>

			<div className="space-y-4">
				{[
					{
						title: "Calculus Study Group",
						subject: "Mathematics",
						members: 12,
						schedule: "Tuesdays 7PM",
						description: "Focusing on derivatives and integrals. Preparing for midterm exams."
					},
					{
						title: "Organic Chemistry Lab",
						subject: "Chemistry",
						members: 8,
						schedule: "Thursdays 6PM",
						description: "Lab report discussions and reaction mechanisms practice."
					},
					{
						title: "World History Essays",
						subject: "History",
						members: 15,
						schedule: "Sundays 3PM",
						description: "Peer review sessions and research paper collaboration."
					},
					{
						title: "Python Programming",
						subject: "Computer Science",
						members: 20,
						schedule: "Saturdays 2PM",
						description: "Algorithm practice and coding challenges."
					}
				].map((group, index) => (
					<div key={index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 flex justify-between items-center">
						<div className="flex-1">
							<h3 className="font-semibold text-lg">{group.title}</h3>
							<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{group.subject} • {group.members} members • Meets {group.schedule}
							</div>
							<p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{group.description}</p>
						</div>
						<button className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
							Join Group
						</button>
					</div>
				))}
			</div>

			<div className="text-center mt-8">
				<button className="px-6 py-3 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
					Create New Study Group
				</button>
			</div>
		</section>
	);

	// Footer
	const Footer = () => (
		<footer className="max-w-6xl mx-auto p-6 text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 mt-16">
			<div className="flex justify-between">
				<div>© 2025 VirtualProfessor</div>
				<div className="flex gap-4">
					<a href="#privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
					<a href="#terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
				</div>
			</div>
		</footer>
	);

	// Main render logic
	if (!isAuthenticated) {
		return (
			<main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
				<NotificationBanner />
				<LandingPage />
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
			<NotificationBanner />
			<Header />
			<NavigationMenu />

			<div className="py-8">
				{currentPage === "home" && <HomePage />}
				{currentPage === "tutor" && <TutorPage />}
				{currentPage === "study-group" && <StudyGroupPage />}
				{currentPage === "progress" && <ProgressPage />}
				{currentPage === "gpa" && <GPAPage />}
				{currentPage === "media" && <MediaAnalysisPage />}
				{currentPage === "chat" && <Chat />}
			</div>
			<Footer />
		</main>
	);
}

