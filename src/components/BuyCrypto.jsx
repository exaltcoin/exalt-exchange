import { useI18n } from "../i18n";

function BuyCrypto() {
  const { t } = useI18n();

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
      alert(t("exaltContractCopied"));
    } catch {
      alert(t("copyFailed"));
    }
  };

  return (
    <div className="buy-crypto-page">
      <div className="buy-hero">
        <div>
          <h1>{t("buyExaltCoin")}</h1>
          <p>{t("buyCryptoSubtitle")}</p>
        </div>

        <button className="action-btn yellow-btn" onClick={copyContract}>
          {t("copyExaltContract")}
        </button>
      </div>

      <div className="buy-grid">
        <div className="buy-card">
          <span className="buy-step">{t("step1")}</span>
          <h2>{t("buyBnbUsdt")}</h2>
          <p>{t("buyBnbUsdtText")}</p>

          <button onClick={() => window.open(moonPayUrl, "_blank")}>
            {t("buyBnbUsdt")}
          </button>
        </div>

        <div className="buy-card">
          <span className="buy-step">{t("step2")}</span>
          <h2>{t("swapToExalt")}</h2>
          <p>{t("swapToExaltText")}</p>

          <button onClick={() => window.open(pancakeBuyUrl, "_blank")}>
            {t("buyExaltOnPancake")}
          </button>
        </div>

        <div className="buy-card">
          <span className="buy-step">{t("step3")}</span>
          <h2>{t("sellSwapBack")}</h2>
          <p>{t("sellSwapBackText")}</p>

          <button onClick={() => window.open(pancakeSellUrl, "_blank")}>
            {t("sellExalt")}
          </button>
        </div>
      </div>

      <div className="buy-note">
        <h3>{t("officialExaltContract")}</h3>
        <p>{EXALT_CONTRACT}</p>

        <button className="copy-contract-btn" onClick={copyContract}>
          {t("copyContract")}
        </button>
      </div>

      <div className="buy-security-box">
        <h3>{t("securityReminder")}</h3>
        <p>{t("verifyContractReminder")}</p>
        <p>{t("useBscReminder")}</p>
        <p>{t("fakeSupportReminder")}</p>
      </div>
    </div>
  );
}

export default BuyCrypto;