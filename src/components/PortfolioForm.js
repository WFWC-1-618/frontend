import React, { useState } from "react";
import PortfolioPopup from "./PortfolioPopup";
import styles from "./PortfolioForm.module.css";

function PortfolioForm({ onSubmit }) {
  const [displayPortfolio, setDisplayPortfolio] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialAmount, setInitialAmount] = useState(1000000);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setDisplayPortfolio([...popupPortfolio]);
    closeModal();
  };

  const isFormValid = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (
      displayPortfolio.length > 0 &&
      startDate &&
      endDate &&
      start < end &&
      initialAmount > 0 &&
      monthlyContribution >= 0
    );
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("입력값을 확인하세요.");
      return;
    }
    onSubmit({
      portfolio: displayPortfolio,
      startDate,
      endDate,
      initialAmount,
      monthlyContribution,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h2 className={styles.maintitle}>포트폴리오 구성</h2>

      <h3 className={styles.title}>나의 포트폴리오</h3>
      <div className={styles.tableContainer}>
        {displayPortfolio.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ETF 심볼</th>
                <th>비율 (%)</th>
              </tr>
            </thead>
            <tbody>
              {displayPortfolio.map((etf, index) => (
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
      </div>

      <button type="button" onClick={openModal} className={styles.button}>
        포트폴리오 수정
      </button>

      <PortfolioPopup
        isOpen={isModalOpen}
        onSave={handleSave}
        onClose={closeModal}
      />

      <hr className={styles.hr} />

      <h2 className={styles.title}>투자 설정</h2>
      <label className={styles.label}>
        시작 금액:
        <input
          type="number"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
          className={styles.inputField}
        />
      </label>

      <label className={styles.label}>
        월 적립 금액:
        <input
          type="number"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
          className={styles.inputField}
        />
      </label>

      <label className={styles.label}>
        시작 날짜:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={styles.inputField}
        />
      </label>

      <label className={styles.label}>
        종료 날짜:
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={styles.inputField}
        />
      </label>

      <button
        type="submit"
        className={styles.button}
        disabled={!isFormValid()}
      >
        백테스트 실행
      </button>
    </form>
  );
}

export default PortfolioForm;
