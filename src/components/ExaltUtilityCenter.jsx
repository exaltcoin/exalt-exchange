import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./ExaltUtilityCenter.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function ExaltUtilityCenter() {
  const { t } = useI18n();

  const [tools, setTools] = useState([]);
  const [calculator, setCalculator] = useState({
    capital: 1000,
    riskPercent: 2,
    entry: 62000,
    stopLoss: 61000,
    takeProfit: 65000,
    leverage: 1,
  });

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchTools = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/exalt-utility`, authHeaders);
      setTools(res.data?.tools || []);
    } catch (err) {
      console.log("Utility tools load failed:", err);
      setTools([]);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const update = (e) => {
    const { name, value } = e.target;
    setCalculator((prev) => ({ ...prev, [name]: value }));
  };

  const result = useMemo(() => {
    const capital = Number(calculator.capital || 0);
    const riskPercent = Number(calculator.riskPercent || 0);
    const entry = Number(calculator.entry || 0);
    const stopLoss = Number(calculator.stopLoss || 0);
    const takeProfit = Number(calculator.takeProfit || 0);
    const leverage = Number(calculator.leverage || 1);

    const riskAmount = capital * (riskPercent / 100);
    const stopDistance = Math.abs(entry - stopLoss);
    const rewardDistance = Math.abs(takeProfit - entry);
    const positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;
    const positionValue = positionSize * entry;
    const leveragedValue = positionValue * leverage;
    const estimatedProfit = positionSize * rewardDistance * leverage;
    const rr = stopDistance > 0 ? rewardDistance / stopDistance : 0;
    const liquidation = leverage > 0 ? entry - entry / leverage : 0;

    return {
      riskAmount,
      positionSize,
      positionValue,
      leveragedValue,
      estimatedProfit,
      rr,
      liquidation,
    };
  }, [calculator]);

  return (
    <PageShell titleKey="exaltUtilityCenter" subtitleKey="exaltUtilityCenterSubtitle">
      <div className="utility-page">
        <div className="utility-top-action">
          <button onClick={fetchTools}>{t("refresh")}</button>
        </div>

        <div className="utility-layout">
          <div className="utility-calculator">
            <h2>{t("riskPositionCalculator")}</h2>

            <div className="utility-input-grid">
              <label>
                {t("capital")}
                <input name="capital" type="number" value={calculator.capital} onChange={update} />
              </label>

              <label>
                {t("riskPercent")}
                <input name="riskPercent" type="number" value={calculator.riskPercent} onChange={update} />
              </label>

              <label>
                {t("entryPrice")}
                <input name="entry" type="number" value={calculator.entry} onChange={update} />
              </label>

              <label>
                {t("stopLoss")}
                <input name="stopLoss" type="number" value={calculator.stopLoss} onChange={update} />
              </label>

              <label>
                {t("takeProfit")}
                <input name="takeProfit" type="number" value={calculator.takeProfit} onChange={update} />
              </label>

              <label>
                {t("leverage")}
                <input name="leverage" type="number" value={calculator.leverage} onChange={update} />
              </label>
            </div>
          </div>

          <div className="utility-result-grid">
            <div><span>{t("riskAmount")}</span><strong>{formatMoney(result.riskAmount)}</strong></div>
            <div><span>{t("positionSize")}</span><strong>{result.positionSize.toFixed(6)}</strong></div>
            <div><span>{t("riskReward")}</span><strong>{result.rr.toFixed(2)}R</strong></div>
            <div><span>{t("estimatedProfit")}</span><strong>{formatMoney(result.estimatedProfit)}</strong></div>
            <div><span>{t("positionValue")}</span><strong>{formatMoney(result.positionValue)}</strong></div>
            <div><span>{t("liquidationZone")}</span><strong>{formatMoney(result.liquidation)}</strong></div>
          </div>
        </div>

        <div className="utility-tools-box">
          <div className="utility-tools-head">
            <h2>{t("utilityTools")}</h2>
            <span>{tools.length} {t("tools")}</span>
          </div>

          <div className="utility-tools-grid">
            {tools.length === 0 ? (
              <div className="utility-empty">{t("noUtilityToolsFound")}</div>
            ) : (
              tools.map((tool) => (
                <div className="utility-tool" key={tool._id}>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>

                  <div className="utility-tool-meta">
                    <span>{tool.category}</span>
                    <span>{tool.accessType}</span>
                    <span>{tool.status}</span>
                  </div>

                  <button>
                    {tool.requiredExalt > 0
                      ? `${tool.requiredExalt} EXALT ${t("required")}`
                      : t("openTool")}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}