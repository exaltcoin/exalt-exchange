export default function Trade() {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        EXALT TRADE PANEL
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-[#111] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">Live Trading Chart</h2>

         <div className="h-[500px] rounded-xl bg-black overflow-hidden">
  <iframe
    title="EXALT Live Chart"
    src="https://dexscreener.com/bsc/0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78?embed=1&theme=dark"
    width="100%"
    height="100%"
    frameBorder="0"
  ></iframe>
</div>
        </div>

        <div className="bg-[#111] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">Buy / Sell</h2>

          <input
            type="text"
            placeholder="Amount"
            className="w-full mb-4 p-3 rounded-lg bg-black border border-gray-700"
          />

          <button className="w-full bg-green-500 hover:bg-green-600 p-3 rounded-lg font-bold mb-3">
            Buy
          </button>

          <button className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg font-bold">
            Sell
          </button>
        </div>

      </div>
    </div>
  );
}