import React, { useState } from "react";
import styles from "./PortfolioForm.module.css";

//이부분 동적으로 처리할 거임 -> 심볼에 해당하는 etf이름 가져와서 여기에 추가
const etfNames = {
  /** 이 데이터 들은 예시
  SPY: "S&P 500 ETF",
  QQQ: "Nasdaq 100 ETF",
  DIA: "Dow Jones ETF",
  */
};

function PortfolioForm({ onSubmit }) {
  const [portfolio, setPortfolio] = useState([{ symbol: "", allocation: "" }]);
  const [displayPortfolio, setDisplayPortfolio] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialAmount, setInitialAmount] = useState(1000000);
  const [monthlyContribution, setMonthlyContribution] = useState(0);

  const addETF = () => {
    // 현재 입력된 symbol과 allocation 값을 displayPortfolio에 추가
    if (
      portfolio.length > 0 &&
      portfolio[0].symbol &&
      portfolio[0].allocation
    ) {
      setDisplayPortfolio([...displayPortfolio, portfolio[0]]);
      setPortfolio([{ symbol: "", allocation: "" }]); // 입력 필드 초기화
    } else {
      console.error("ETF symbol 또는 allocation 값이 없습니다.");
    }
  };

  const handlePortfolioChange = (index, field, value) => {
    const updatedPortfolio = [...portfolio];
    updatedPortfolio[index][field] = value;
    setPortfolio(updatedPortfolio);
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
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h2 className={styles.title}>포트폴리오 구성</h2>
      {portfolio.map((etf, index) => (
        <div key={index} className={styles.inputContainer}>
          <input
            type="text"
            placeholder="ETF 심볼"
            value={etf.symbol}
            onChange={(e) =>
              handlePortfolioChange(index, "symbol", e.target.value)
            }
            className={styles.inputField}
          />
          <input
            type="number"
            placeholder="비율 (%)"
            value={etf.allocation}
            onChange={(e) =>
              handlePortfolioChange(index, "allocation", e.target.value)
            }
            className={styles.inputField}
          />
        </div>
      ))}
      <button type="button" onClick={addETF} className={styles.button}>
        ETF 추가
      </button>

      <h3 className={styles.title}>나의 포트폴리오</h3>
      <div className={styles.tableContainer}>
        {displayPortfolio.length > 0 ? (
          <table className={styles.table}>
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
          <p>추가된 ETF가 없습니다.</p>
        )}
      </div>

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

      <button type="submit" className={styles.button}>
        백테스트 실행
      </button>
      <hr className={styles.hr} />
    </form>
  );
}

export default PortfolioForm;
