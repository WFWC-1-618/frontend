import React, { useEffect, useState } from "react";
import styles from "./PortfolioPopup.module.css";

const ETF_LIST = [
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF" },
  { symbol: "DIA", name: "Dow Jones ETF" },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF" },
];

function PortfolioPopup({ isOpen, onSave, onClose }) {
  const [symbol, setSymbol] = useState("");
  const [allocation, setAllocation] = useState("");
  const [popupPortfolio, setPopupPortfolio] = useState([]);

  const filteredETFs = ETF_LIST.filter((etf) =>
    etf.symbol.toLowerCase().includes(symbol.toLowerCase())
  );

  useEffect(() => {
    //렌더링되면서 모달창 열렸을 떄, 초기화
    if (isOpen) {
      setPopupPortfolio([]); //modal 상태 초기화
      setSymbol("");
      setAllocation("");
    }
  }, [isOpen]);

  const handleAddETF = () => {
    if (!symbol || !allocation) {
      alert("ETF 심볼과 비율을 입력해주세요.");
      return;
    }
    setPopupPortfolio([...popupPortfolio, { symbol, allocation }]);
    setSymbol("");
    setAllocation("");
  };

  const handleSave = () => {
    if (popupPortfolio.length === 0) {
      alert("포트폴리오가 비어 있습니다.");
      return;
    }
    onSave(popupPortfolio);
  };

  if (!isOpen) return null; //true일때만 렌더링

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>포트폴리오 수정</h2>
        <div>
          <input
            type="text"
            placeholder="ETF 심볼"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className={styles.inputField}
            list="etf-suggestions"
          />
          <datalist id="etf-suggestions">
            {filteredETFs.map((etf, index) => (
              <option key={index} value={etf.symbol}>
                {etf.name}
              </option>
            ))}
          </datalist>
          <input
            type="number"
            placeholder="비율 (%)"
            value={allocation}
            onChange={(e) => setAllocation(e.target.value)}
            className={styles.inputField}
          />
          <button onClick={handleAddETF} className={styles.button}>
            추가
          </button>
        </div>

        <h3>추가된 ETF 목록</h3>
        {popupPortfolio.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ETF 심볼</th>
                <th>비율 (%)</th>
              </tr>
            </thead>
            <tbody>
              {popupPortfolio.map((etf, index) => (
                <tr key={index}>
                  <td>{etf.symbol}</td>
                  <td>{etf.allocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>포트폴리오가 없습니다.</p>
        )}

        <div>
          <button onClick={handleSave} className={styles.button}>
            저장
          </button>
          <button onClick={onClose} className={styles.button}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PortfolioPopup;
