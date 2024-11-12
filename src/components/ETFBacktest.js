import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PortfolioForm from "./PortfolioForm";
import PortfolioChart from "./PortfolioChart";
import styles from "./ETFBacktest.module.css";
//import './ETFBacktest.css';

function ETFBacktest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState([]);

  const handleFormSubmit = async ({
    portfolio,
    startDate,
    endDate,
    initialAmount,
    monthlyContribution,
  }) => {
    setLoading(true);
    let fetchedPortfolioData = [];

    try {
      for (const etf of portfolio) {
        const response = await axios.get(
          "https://alpha-vantage.p.rapidapi.com/query",
          {
            params: {
              function: "TIME_SERIES_DAILY_ADJUSTED",
              symbol: etf.symbol,
              outputsize: "full", // 'full' 설정으로 모든 데이터 가져오기
            },
            headers: {
              "X-RapidAPI-Key": process.env.REACT_APP_RAPIDAPI_KEY,
              "X-RapidAPI-Host": process.env.REACT_APP_RAPIDAPI_HOST,
            },
          }
        );

        const priceData = response.data["Time Series (Daily)"];
        if (!priceData) {
          console.error(`No price data available for ${etf.symbol}.`);
          continue;
        }

        const dates = Object.keys(priceData).sort(
          (a, b) => new Date(a) - new Date(b)
        );
        const getClosestDate = (targetDate) => {
          return dates.reduce((prev, curr) =>
            Math.abs(new Date(curr) - new Date(targetDate)) <
            Math.abs(new Date(prev) - new Date(targetDate))
              ? curr
              : prev
          );
        };

        const start = getClosestDate(startDate);
        const end = getClosestDate(endDate);

        if (!start || !end) {
          console.warn(
            `Couldn't find suitable start or end date for ${etf.symbol}.`
          );
          continue;
        }

        const startPrice = parseFloat(priceData[start]?.["5. adjusted close"]);
        const endPrice = parseFloat(priceData[end]?.["5. adjusted close"]);

        if (isNaN(startPrice) || isNaN(endPrice)) {
          console.warn(`Invalid start or end price for ${etf.symbol}.`);
          continue;
        }

        fetchedPortfolioData.push({
          symbol: etf.symbol,
          allocation: parseFloat(etf.allocation),
          startPrice,
          endPrice,
          returns: ((endPrice - startPrice) / startPrice) * 100,
        });
      }

      setPortfolioData(fetchedPortfolioData);
      setResult({
        startDate,
        endDate,
        initialAmount,
        monthlyContribution,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioGrowth = useCallback(() => {
    const { initialAmount } = result;
    let cumulativeFinalAmount = 0;

    portfolioData.forEach((etf) => {
      const etfInitialAmount = (initialAmount * etf.allocation) / 100;
      const etfFinalAmount = etfInitialAmount * (1 + etf.returns / 100);
      cumulativeFinalAmount += etfFinalAmount;
    });

    const totalReturn =
      ((cumulativeFinalAmount - initialAmount) / initialAmount) * 100;
    const dates = [result.startDate, result.endDate];
    const values = [initialAmount, cumulativeFinalAmount];

    setResult((prev) => ({
      ...prev,
      portfolioData,
      totalReturn,
      finalAmount: cumulativeFinalAmount,
      dates,
      values,
    }));
  }, [portfolioData, result]);

  useEffect(() => {
    if (portfolioData.length === 0 || !result) return;
    calculatePortfolioGrowth();
  }, [portfolioData, result, calculatePortfolioGrowth]);

  return (
    <div className="etf-backtest">
      <h1 className={styles.maintitle}>ETF 백테스팅 애플리케이션</h1>
      <PortfolioForm onSubmit={handleFormSubmit} />
      {loading && <p className="loading">로딩 중...</p>}
      {result && result.totalReturn !== undefined && (
        <div className="results">
          <h2>백테스트 결과</h2>
          <p>총 수익률: {result.totalReturn.toFixed(2)}%</p>
          <p>최종 금액: {result.finalAmount.toLocaleString()}원</p>
          <h3>자산별 상세 정보</h3>
          <ul>
            {result.portfolioData.map((etf, index) => (
              <li key={index}>
                {etf.symbol}: 수익률 {etf.returns.toFixed(2)}%, 비율{" "}
                {etf.allocation}%
              </li>
            ))}
          </ul>
          <PortfolioChart
            data={{ dates: result.dates, values: result.values }}
          />
        </div>
      )}
    </div>
  );
}

export default ETFBacktest;
