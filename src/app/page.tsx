import React from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-indigo-700 mb-4">
          Virtual Professor AI
        </h1>
        <p className="text-lg text-gray-700 max-w-xl mx-auto">
          Your personal AI-powered professor. Ask questions, get explanations, and accelerate your learning journey.
        </p>
      </header>
      <section className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
          Ask a Question
        </h2>
        <input
          type="text"
          placeholder="Type your question here..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
        />
        <button className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition">
          Submit
        </button>
      </section>
      <footer className="mt-12 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Virtual Professor AI. All rights reserved.
      </footer>
    </main>
  );
}