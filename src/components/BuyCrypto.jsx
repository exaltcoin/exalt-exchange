function BuyCrypto() {
  const EXALT_CONTRACT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";
  const BNB_CONTRACT = "BNB";

  const MOONPAY_KEY = import.meta.env.VITE_MOONPAY_PUBLIC_KEY || "";

  const moonPayUrl = MOONPAY_KEY
    ? `https://buy.moonpay.com?apiKey=${MOONPAY_KEY}&currencyCode=bnb&baseCurrencyCode=usd&baseCurrencyAmount=50`
    : "https://buy.moonpay.com";

  const pancakeBuyUrl = `https://pancakeswap.finance/swap?chain=bsc&inputCurrency=${BNB_CONTRACT}&outputCurrency=${EXALT_CONTRACT}`;

  const pancakeSellUrl = `https://pancakeswap.finance/swap?chain=bsc&inputCurrency=${EXALT_CONTRACT}&outputCurrency=${BNB_CONTRACT}`;

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(EXALT_CONTRACT);
      alert("EXALT contract copied");
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <div className="buy-crypto-page">
      <div className="buy-hero">
        <div>
          <h1>Buy EXALT Coin</h1>
          <p>
            Buy BNB/USDT by card or bank, then swap safely to EXALT on
            PancakeSwap.
          </p>
        </div>

        <button className="action-btn yellow-btn" onClick={copyContract}>
          Copy EXALT Contract
        </button>
      </div>

      <div className="buy-grid">
        <div className="buy-card">
          <span className="buy-step">Step 1</span>
          <h2>Buy BNB / USDT</h2>
          <p>
            Use card, Apple Pay, Google Pay or bank options where supported.
          </p>

          <button onClick={() => window.open(moonPayUrl, "_blank")}>
            Buy BNB / USDT
          </button>
        </div>

        <div className="buy-card">
          <span className="buy-step">Step 2</span>
          <h2>Swap To EXALT</h2>
          <p>Open PancakeSwap with EXALT contract pre-filled.</p>

          <button onClick={() => window.open(pancakeBuyUrl, "_blank")}>
            Buy EXALT on PancakeSwap
          </button>
        </div>

        <div className="buy-card">
          <span className="buy-step">Step 3</span>
          <h2>Sell / Swap Back</h2>
          <p>Swap EXALT back to BNB any time using PancakeSwap.</p>

          <button onClick={() => window.open(pancakeSellUrl, "_blank")}>
            Sell EXALT
          </button>
        </div>
      </div>

      <div className="buy-note">
        <h3>Official EXALT Contract</h3>
        <p>{EXALT_CONTRACT}</p>

        <button className="copy-contract-btn" onClick={copyContract}>
          Copy Contract
        </button>
      </div>

      <div className="buy-security-box">
        <h3>Security Reminder</h3>
        <p>✅ Always verify the official EXALT contract before swapping.</p>
        <p>✅ Use BNB Smart Chain on PancakeSwap.</p>
        <p>✅ Never send funds to unknown addresses or fake support accounts.</p>
      </div>
    </div>
  );
}

export default BuyCrypto;