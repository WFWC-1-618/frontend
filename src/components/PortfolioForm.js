import React, { useState } from "react";
import PortfolioPopup from "./PortfolioPopup"; // 모달 컴포넌트 임포트
import "./PortfolioForm.module.css"; // 일반 CSS 사용

const etfNames = {
  SPY: "S&P 500 ETF",
  QQQ: "Nasdaq 100 ETF",
  DIA: "Dow Jones ETF",
};

function PortfolioForm({ onSubmit }) {
  const [displayPortfolio, setDisplayPortfolio] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialAmount, setInitialAmount] = useState(1000000);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 추가

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSave = (popupPortfolio) => {
    if (
      !popupPortfolio ||
      !Array.isArray(popupPortfolio) ||
      popupPortfolio.length === 0
    ) {
      alert("유효한 ETF 데이터를 전달받지 못했습니다.");
      return;
    }
    setDisplayPortfolio([...popupPortfolio]); // 포트폴리오 업데이트
    closeModal(); // 모달 닫기
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      portfolio: displayPortfolio,
      startDate,
      endDate,
      initialAmount,
      monthlyContribution,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="formContainer">
      <h2 className="maintitle">포트폴리오 구성</h2>

      <h3 className="title">나의 포트폴리오</h3>
      <div className="tableContainer">
        {displayPortfolio.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>ETF 심볼</th>
                <th>ETF 전체 이름</th>
                <th>비율 (%)</th>
              </tr>
            </thead>
            <tbody>
              {displayPortfolio.map((etf, index) => (
                <tr key={index}>
                  <td>{etf.symbol}</td>
                  <td>{etfNames[etf.symbol] || "알 수 없음"}</td>
                  <td>{etf.allocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>포트폴리오가 존재하지 않습니다.</p>
        )}
      </div>

      <button type="button" onClick={openModal} className="button">
        포트폴리오 수정
      </button>

      <PortfolioPopup
        isOpen={isModalOpen}
        onSave={handleSave}
        onClose={closeModal}
      />

      <hr className="hr" />

      <h2 className="title">투자 설정</h2>
      <label className="label">
        시작 금액:
        <input
          type="number"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
          className="inputField"
        />
      </label>

      <label className="label">
        월 적립 금액:
        <input
          type="number"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
          className="inputField"
        />
      </label>

      <label className="label">
        시작 날짜:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="inputField"
        />
      </label>

      <label className="label">
        종료 날짜:
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="inputField"
        />
      </label>

      <button type="submit" className="button">
        백테스트 실행
      </button>
      <hr className="hr" />
    </form>
  );
}

export default PortfolioForm;
