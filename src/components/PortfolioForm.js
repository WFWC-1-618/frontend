import React, { useState } from 'react';

function PortfolioForm({ onSubmit }) {
  const [portfolio, setPortfolio] = useState([{ symbol: '', allocation: '' }]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialAmount, setInitialAmount] = useState(1000000);
  const [monthlyContribution, setMonthlyContribution] = useState(0);

  const addETF = () => {
    setPortfolio([...portfolio, { symbol: '', allocation: '' }]);
  };

  const handlePortfolioChange = (index, field, value) => {
    const updatedPortfolio = [...portfolio];
    updatedPortfolio[index][field] = value;
    setPortfolio(updatedPortfolio);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      portfolio,
      startDate,
      endDate,
      initialAmount,
      monthlyContribution,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>포트폴리오 구성</h2>
      {portfolio.map((etf, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="ETF 심볼"
            value={etf.symbol}
            onChange={(e) => handlePortfolioChange(index, 'symbol', e.target.value)}
          />
          <input
            type="number"
            placeholder="비율 (%)"
            value={etf.allocation}
            onChange={(e) => handlePortfolioChange(index, 'allocation', e.target.value)}
          />
        </div>
      ))}
      <button type="button" onClick={addETF}>ETF 추가</button>

      <h2>투자 설정</h2>
      <label>
        시작 금액:
        <input
          type="number"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
        />
      </label>
      <label>
        월 적립 금액:
        <input
          type="number"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
        />
      </label>
      <label>
        시작 날짜:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </label>
      <label>
        종료 날짜:
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </label>
      <button type="submit">백테스트 실행</button>
    </form>
  );
}

export default PortfolioForm;
