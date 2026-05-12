function TradingBook() {
  return (
    <div className="panel trade-panel">

      <h3>Spot Trading</h3>

      <div className="trade-box">

        <div className="buy-box">

          <h3>Buy EXALT</h3>

          <p>Buy EXALT directly from PancakeSwap</p>

          <a
            href="https://pancakeswap.finance/swap?outputCurrency=0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78"
            target="_blank"
            rel="noreferrer"
          >
            <button className="buy-btn">
              Buy On PancakeSwap
            </button>
          </a>

        </div>

        <div className="sell-box">

          <h3>Sell EXALT</h3>

          <p>Sell EXALT directly on PancakeSwap</p>

          <a
            href="https://pancakeswap.finance/swap?inputCurrency=0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78"
            target="_blank"
            rel="noreferrer"
          >
            <button className="sell-btn">
              Sell On PancakeSwap
            </button>
          </a>

        </div>

      </div>

    </div>
  );
}

export default TradingBook;