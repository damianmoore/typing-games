import Link from 'next/link';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  return (
    <>
      <ThemeToggle />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-8">Choose a Game</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Word Copying Game Card */}
          <Link href="/word-copying">
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
              <div className="card-body">
                <h2 className="card-title text-2xl">Word Copying</h2>
                <p>Practice typing by copying words. Perfect for learning to spell and improving typing skills!</p>
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-primary">Play Now</button>
                </div>
              </div>
            </div>
          </Link>

          {/* Counting and Entering Game Card */}
          <Link href="/counting">
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
              <div className="card-body">
                <h2 className="card-title text-2xl">Counting and Entering</h2>
                <p>Count the emojis and enter the number. A fun way to practice counting and number recognition!</p>
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-primary">Play Now</button>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
