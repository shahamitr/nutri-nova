import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">Nutri-Nova</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your personal AI-powered diet planner and nutritionist. Get personalized meal plans, workout videos, and gamified health tracking.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}