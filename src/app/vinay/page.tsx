import Header from "@/components/header";

export default function Vinay() {

  return (
    <div className="flex h-full w-full flex-col">
      <Header />
      <div className="flex flex-col flex-1 p-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to VirtualProfessor</h1>
        <p className="text-lg text-gray-700">
          Your AI-powered assistant for learning and productivity.
        </p>
      </div>
    </div>
  );
}