function BuyCrypto() {
  const EXALT_CONTRACT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

  const moonPayUrl =
    "https://buy.moonpay.com" +
    "?apiKey=YOUR_MOONPAY_PUBLISHABLE_KEY" +
    "&currencyCode=bnb" +
    "&baseCurrencyCode=usd" +
    "&baseCurrencyAmount=50";

  const pancakeUrl =
    `https://pancakeswap.finance/swap?outputCurrency=${EXALT_CONTRACT}`;

  return (
    <div className="buy-crypto-page">
      <div className="buy-hero">
        <h1>Buy EXALT Coin</h1>
        <p>Buy BNB/USDT by card or bank, then swap to EXALT on PancakeSwap.</p>
      </div>

      <div className="buy-grid">
        <div className="buy-card">
          <h2>Buy With Card / Bank</h2>
          <p>Visa, Mastercard, Apple Pay, Google Pay where supported.</p>
          <button onClick={() => window.open(moonPayUrl, "_blank")}>
            Buy BNB / USDT
          </button>
        </div>

        <div className="buy-card">
          <h2>Swap To EXALT</h2>
          <p>After buying BNB/USDT, swap directly to EXALT.</p>
          <button onClick={() => window.open(pancakeUrl, "_blank")}>
            Buy EXALT on PancakeSwap
          </button>
        </div>
      </div>

      <div className="buy-note">
        <h3>Official EXALT Contract</h3>
        <p>{EXALT_CONTRACT}</p>
      </div>
    </div>
  );
}

export default BuyCrypto;