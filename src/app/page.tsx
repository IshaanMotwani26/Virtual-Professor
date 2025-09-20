"use client";
import React, { useEffect, useState } from "react";

export default function VirtualProfessorHomepage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [chatOpen, setChatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [isSignUp, setIsSignUp] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, type: string, keyPoints: string[]}>>([]);
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Hi! I'm Prof. V. Ask me anything about your courses or assignments." },
  ]);

  useEffect(() => {
    if (!query) return setSuggestions([]);
    const pool = [
      "Introduction to Psychology",
      "Math: Calculus basics",
      "Computer Science: Data Structures",
      "History: World War II",
      "Economics: Supply and Demand",
      "Exam practice: General Knowledge",
    ];
    setSuggestions(pool.filter((p) => p.toLowerCase().includes(query.toLowerCase())).slice(0, 5));
  }, [query]);

  useEffect(() => {
    document.documentElement.classList.add("dark"); // Set dark mode as default
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setQuery("");

    // simulate a bot answer — replace with actual API call (fetch / websockets)
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: "Great question — here's a quick explanation. You can also review a related micro-lesson for deeper learning." }]);
    }, 750);
  }

  const showPage = (pageId: string) => {
    setCurrentPage(pageId);
    setChatOpen(false); // Close chat when navigating
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isSignUp ? 'Account created successfully!' : 'Signed in successfully!');
    setCurrentPage("home");
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Assignment submitted successfully! You will receive feedback within 24 hours.');
  };

  const handleTutorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Tutor request submitted! We will match you with a suitable tutor and contact you shortly.');
  };

  const handleMediaUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate file processing and key point extraction
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
    alert('Media file processed successfully! Key points extracted.');
  };

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
          className="px-3 py-2 rounded-md border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button 
          onClick={() => showPage("home")} 
          className="px-3 py-2 rounded-md border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Home
        </button>
        <button 
          onClick={() => showPage("auth")} 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95"
        >
          Sign up
        </button>
      </nav>
    </header>
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
              <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95 text-sm">
                Continue Learning
              </button>
              <button className="px-3 py-2 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.letter.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      course.letter.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {course.letter}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.status === 'Excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
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
              <input type="text" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Enter course name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Credits</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="3" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grade</label>
                <select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
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
            <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95">
              Calculate Impact
            </button>
          </form>
        </div>
      </div>
    </section>
  );

  // Media Analysis Page
  const MediaAnalysisPage = () => {
    return (
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
              <select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                <option>Video File</option>
                <option>Audio File</option>
                <option>Voice Memo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Subject Area</label>
              <select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
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
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">🎥</div>
                <h3 className="text-lg font-medium mb-2">Drop media files here or click to browse</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Supported: MP4, AVI, MP3, WAV, M4A</p>
                <input type="file" accept="video/*,audio/*" className="hidden" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Additional Context (Optional)</label>
              <textarea 
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" 
                rows={3}
                placeholder="Any specific topics or concepts you want us to focus on?"
              />
            </div>
            
            <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95">
              Upload & Analyze
            </button>
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
              <div className="text-2xl">📝</div>
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
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95 text-sm">
                    Export Notes
                  </button>
                  <button className="px-4 py-2 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
                    Create Study Guide
                  </button>
                  <button className="px-4 py-2 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
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
  };

  // Navigation Menu
  const NavigationMenu = () => {
    const navigationItems = [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "auth", label: "Auth", icon: "👤" },
      { id: "upload", label: "Upload", icon: "📝" },
      { id: "tutor", label: "Tutor", icon: "👨‍🏫" },
      { id: "study-group", label: "Groups", icon: "👥" },
      { id: "progress", label: "Progress", icon: "📊" },
      { id: "gpa", label: "GPA", icon: "🎯" },
      { id: "media", label: "Media", icon: "🎥" }
    ];

    return (
      <nav className="max-w-6xl mx-auto px-6 py-3 border-b dark:border-gray-700">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {navigationItems.map((nav) => (
            <button
              key={nav.id}
              onClick={() => showPage(nav.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm font-medium ${
                currentPage === nav.id 
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
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(query); }}
              placeholder="Search subjects, topics or ask a question..."
              className="w-full rounded-md border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:border-gray-700"
              aria-label="Search subjects or ask a question"
            />
            <button
              onClick={() => sendMessage(query)}
              className="absolute right-2 top-2 px-3 py-1 rounded bg-indigo-600 text-white hover:opacity-95"
              aria-label="Ask question"
            >
              Ask
            </button>
          </div>

          {suggestions.length > 0 && (
            <ul className="mt-2 bg-white dark:bg-gray-800 border rounded-md p-2 shadow-sm">
              {suggestions.map((s) => (
                <li key={s} className="py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={() => sendMessage(s)}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Course grid (sample) */}
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
                <button className="px-3 py-1 rounded bg-emerald-500 text-white hover:opacity-95">Start</button>
                <button className="px-3 py-1 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Preview</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Right column: schedule card + quick actions */}
      <aside>
        <div className="p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
          <h4 className="font-semibold">Today</h4>
          <ul className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li>09:00 — Review class notes</li>
            <li>13:00 — Group project meeting</li>
            <li>16:00 — Exam prep session</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 px-3 py-2 rounded bg-indigo-600 text-white hover:opacity-95">Open schedule</button>
            <button className="px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setChatOpen((v) => !v)}>
              {chatOpen ? "Close chat" : "Chat"}
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
          <h4 className="font-semibold">Quick actions</h4>
          <div className="mt-3 grid gap-2">
            <button 
              onClick={() => showPage("upload")}
              className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              📝 Upload assignment
            </button>
            <button 
              onClick={() => showPage("tutor")}
              className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              👨‍🏫 Request tutor
            </button>
            <button 
              onClick={() => showPage("study-group")}
              className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              👥 Join study group
            </button>
            <button 
              onClick={() => showPage("progress")}
              className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              📊 Track progress
            </button>
            <button 
              onClick={() => showPage("gpa")}
              className="text-left px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              🎯 GPA tracker
            </button>
          </div>
        </div>
      </aside>
    </section>
  );

  // Auth Page
  const AuthPage = () => (
    <section className="max-w-md mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Welcome to VirtualProfessor</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">Sign up to access personalized learning and expert tutoring</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setIsSignUp(true)}
            className={`flex-1 px-4 py-2 rounded-md ${isSignUp ? 'bg-indigo-600 text-white' : 'border dark:border-gray-700'}`}
          >
            Sign Up
          </button>
          <button 
            onClick={() => setIsSignUp(false)}
            className={`flex-1 px-4 py-2 rounded-md ${!isSignUp ? 'bg-indigo-600 text-white' : 'border dark:border-gray-700'}`}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Enter your full name" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input type="email" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Enter your email" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Enter your password" />
          </div>
          
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input type="password" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Confirm your password" />
            </div>
          )}
          
          <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </section>
  );

  // Upload Assignment Page
  const UploadPage = () => (
    <section className="max-w-2xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Upload Assignment</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">Submit your assignment for personalized feedback and guidance</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Assignment Title</label>
            <input type="text" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Enter assignment title" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
              <option value="">Select a subject</option>
              <option>Mathematics</option>
              <option>Science</option>
              <option>English</option>
              <option>History</option>
              <option>Computer Science</option>
              <option>Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input type="date" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Assignment Files</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Supported formats: PDF, DOC, DOCX, TXT</p>
              <input type="file" multiple accept=".pdf,.doc,.docx,.txt" className="hidden" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Additional Instructions</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" 
              rows={4}
              placeholder="Any specific requirements or questions about this assignment?"
            />
          </div>
          
          <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95">
            Submit Assignment
          </button>
        </form>
      </div>
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
              <select required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
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
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Learning Level</label>
              <select required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                <option value="">Select level</option>
                <option>High School</option>
                <option>Undergraduate</option>
                <option>Graduate</option>
                <option>Professional</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Session Type</label>
              <select required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                <option>One-time session</option>
                <option>Weekly sessions</option>
                <option>Intensive course</option>
                <option>Exam preparation</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Availability</label>
              <input type="text" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., Weekends, evenings, specific days" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Learning Goals</label>
              <textarea 
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" 
                rows={3}
                placeholder="What specific topics or skills would you like to focus on?"
              />
            </div>
            
            <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95">
              Find My Tutor
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2">🎯 Personalized Learning</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Tailored sessions based on your learning style and pace</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2">⭐ Expert Tutors</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Certified professionals with proven track records</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2">📅 Flexible Scheduling</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Book sessions that fit your busy schedule</p>
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
          className="w-full px-4 py-3 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
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
            <button className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:opacity-95">
              Join Group
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <button className="px-6 py-3 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
          Create New Study Group
        </button>
      </div>
    </section>
  );

  // Chat Widget (existing)
  const ChatWidget = () => (
    <div className={`fixed right-6 bottom-6 w-96 shadow-xl rounded-md overflow-hidden transform transition-all z-50 ${chatOpen ? "translate-y-0" : "translate-y-8 opacity-80"}`}>
      <div className="bg-indigo-600 px-4 py-2 text-white flex items-center justify-between">
        <strong>Prof Chat</strong>
        <div className="flex gap-2">
          <button onClick={() => setChatOpen(false)} aria-label="Close chat">✕</button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-3 max-h-80 overflow-auto">
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.from === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block px-3 py-2 rounded-md ${m.from === "user" ? "bg-indigo-50 dark:bg-indigo-900" : "bg-gray-100 dark:bg-gray-700"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 p-2 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(query); }}
          placeholder="Type a question or topic..."
          className="flex-1 rounded px-3 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800"
          aria-label="Type a chat message"
        />
        <button onClick={() => sendMessage(query)} className="px-3 py-2 rounded bg-indigo-600 text-white hover:opacity-95">Send</button>
      </div>
    </div>
  );

  // Footer
  const Footer = () => (
    <footer className="max-w-6xl mx-auto p-6 text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 mt-16">
      <div className="flex justify-between">
        <div>© VirtualProfessor</div>
        <div className="flex gap-4">
          <a href="#privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
          <a href="#terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
        </div>
      </div>
    </footer>
  );

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Header />
      <NavigationMenu />
      
      {currentPage === "home" && <HomePage />}
      {currentPage === "auth" && <AuthPage />}
      {currentPage === "upload" && <UploadPage />}
      {currentPage === "tutor" && <TutorPage />}
      {currentPage === "study-group" && <StudyGroupPage />}
      {currentPage === "progress" && <ProgressPage />}
      {currentPage === "gpa" && <GPAPage />}
      {currentPage === "media" && <MediaAnalysisPage />}
      
      <ChatWidget />
      <Footer />
    </main>
  );
}