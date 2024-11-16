import React, { useState } from "react";
import "./PortfolioPopup.css"; // 일반 CSS로 변경

function PortfolioPopup({ isOpen, onSave, onClose }) {
  const [symbol, setSymbol] = useState(""); // 현재 입력 중인 ETF 심볼
  const [allocation, setAllocation] = useState(""); // 현재 입력 중인 비율
  const [popupPortfolio, setPopupPortfolio] = useState([]); // 팝업 창 내부 테이블 데이터

  // ETF 추가 버튼 핸들러
  const handleAddETF = () => {
    if (!symbol || !allocation) {
      alert("ETF 심볼과 비율을 입력해주세요.");
      return;
    }
    setPopupPortfolio([...popupPortfolio, { symbol, allocation }]); // 테이블에 추가
    setSymbol(""); // 입력 필드 초기화
    setAllocation(""); // 입력 필드 초기화
  };

  // 수정 완료 버튼 핸들러
  const handleSave = () => {
    if (popupPortfolio.length === 0) {
      alert("추가된 ETF가 없습니다.");
      return;
    }
    onSave(popupPortfolio); // 부모 창으로 데이터 전달
    onClose(); // 팝업 닫기
  };

  if (!isOpen) return null;

  return (
    <div className="popupContainer">
      <h2>포트폴리오 수정</h2>
      <div className="inputContainer">
        <input
          type="text"
          placeholder="ETF 심볼"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="inputField"
        />
        <input
          type="number"
          placeholder="비율 (%)"
          value={allocation}
          onChange={(e) => setAllocation(e.target.value)}
          className="inputField"
        />
        <button onClick={handleAddETF} className="button">
          ETF 추가
        </button>
      </div>

      <h3>추가된 포트폴리오</h3>
      {popupPortfolio.length > 0 ? (
        <table className="table">
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
        <p>포트폴리오가 존재하지 않습니다.</p>
      )}

      <div className="buttonContainer">
        <button onClick={handleSave} className="button">
          수정 완료
        </button>
        <button onClick={onClose} className="button">
          닫기
        </button>
      </div>
    </div>
  );
}

export default PortfolioPopup;
