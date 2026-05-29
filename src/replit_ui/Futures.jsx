import "./replit.css";
export default function Futures() {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        EXALT FUTURES
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-[#111] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">
            Futures Trading
          </h2>

          <div className="h-[400px] rounded-xl bg-black flex items-center justify-center text-gray-400">
            Futures Chart Area
          </div>
        </div>

        <div className="bg-[#111] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">
            Open Position
          </h2>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Leverage 1x - 125x"
              className="w-full p-3 rounded-lg bg-black border border-gray-700"
            />

            <input
              type="text"
              placeholder="Position Size"
              className="w-full p-3 rounded-lg bg-black border border-gray-700"
            />

            <button className="w-full bg-green-500 hover:bg-green-600 p-3 rounded-lg font-bold">
              Long
            </button>

            <button className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg font-bold">
              Short
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}