import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PortfolioForm from "./PortfolioForm";
import PortfolioChart from "./PortfolioChart";
import ETFTable from "./ETFTable"; // PortfolioPieChart는 제거
import styles from "./ETFBacktest.module.css";

function ETFBacktest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // 헬퍼 함수: ETF 수익률 및 최종 금액 계산
  const calculateETFPerformance = (etf, months, initialAmount, monthlyContribution) => {
    const etfInitialAmount = (initialAmount * etf.allocation) / 100;
    let etfFinalAmount = etfInitialAmount;

    for (let i = 1; i <= months; i++) {
      const monthlyInvestment = (monthlyContribution * etf.allocation) / 100;
      etfFinalAmount += monthlyInvestment;
    }

    etfFinalAmount *= Math.pow(1 + etf.returns / 100, months / 12);
    return etfFinalAmount;
  };

  // 폼 제출 핸들러
  const handleFormSubmit = async ({
    portfolio,
    startDate,
    endDate,
    initialAmount,
    monthlyContribution,
  }) => {
    setLoading(true);
    setErrorMessage("");
    let fetchedPortfolioData = [];

    try {
      const responses = await Promise.allSettled(
        portfolio.map((etf) =>
          axios.get("https://alpha-vantage.p.rapidapi.com/query", {
            params: {
              function: "TIME_SERIES_DAILY_ADJUSTED",
              symbol: etf.symbol,
              outputsize: "full",
            },
            headers: {
              "X-RapidAPI-Key": process.env.REACT_APP_RAPIDAPI_KEY,
              "X-RapidAPI-Host": process.env.REACT_APP_RAPIDAPI_HOST,
            },
          })
        )
      );

      responses.forEach((response, index) => {
        if (response.status === "fulfilled") {
          const priceData = response.value.data["Time Series (Daily)"];
          if (!priceData) {
            console.warn(`No price data available for ${portfolio[index].symbol}.`);
            return;
          }

          const dates = Object.keys(priceData).sort(
            (a, b) => new Date(a) - new Date(b)
          );

          const getClosestDate = (targetDate) =>
            dates.reduce((prev, curr) =>
              Math.abs(new Date(curr) - new Date(targetDate)) <
              Math.abs(new Date(prev) - new Date(targetDate))
                ? curr
                : prev
            );

          const start = getClosestDate(startDate);
          const end = getClosestDate(endDate);

          const startPrice = parseFloat(priceData[start]?.["5. adjusted close"]);
          const endPrice = parseFloat(priceData[end]?.["5. adjusted close"]);

          if (!isNaN(startPrice) && !isNaN(endPrice)) {
            fetchedPortfolioData.push({
              symbol: portfolio[index].symbol,
              allocation: parseFloat(portfolio[index].allocation),
              startPrice,
              endPrice,
              returns: ((endPrice - startPrice) / startPrice) * 100,
            });
          }
        } else {
          console.warn(`Error fetching data for ${portfolio[index].symbol}: ${response.reason}`);
        }
      });

      setPortfolioData(fetchedPortfolioData);
      setResult({
        startDate,
        endDate,
        initialAmount: parseFloat(initialAmount), // 숫자로 변환
        monthlyContribution: parseFloat(monthlyContribution), // 숫자로 변환
      });
    } catch (error) {
      setErrorMessage(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 포트폴리오 성장 계산
  const calculatePortfolioGrowth = useCallback(() => {
    const { initialAmount, startDate, endDate, monthlyContribution } = result;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    let cumulativeInvestment = initialAmount; // 초기 금액을 누적 투자 금액으로 초기화
    let cumulativeFinalAmount = 0; // 최종 금액 초기화

    portfolioData.forEach((etf) => {
      const etfFinalAmount = calculateETFPerformance(etf, months, initialAmount, monthlyContribution);
      cumulativeInvestment += (monthlyContribution * etf.allocation) / 100 * months; // 누적 투자 금액 계산
      cumulativeFinalAmount += etfFinalAmount; // ETF 최종 금액 누적
    });

    // 총 수익률 계산
    const totalReturn =
      cumulativeInvestment > 0
        ? ((cumulativeFinalAmount - cumulativeInvestment) / cumulativeInvestment) * 100
        : 0;

    setResult((prev) => ({
      ...prev,
      totalReturn,
      finalAmount: cumulativeFinalAmount,
      cumulativeInvestment,
    }));

    console.log("Debug Info:", {
      cumulativeInvestment,
      cumulativeFinalAmount,
      totalReturn,
    });
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
      {errorMessage && <p className="error">{errorMessage}</p>}
      {result && result.totalReturn !== undefined && (
        <div className="results">
          <h2>백테스트 결과</h2>
          <p>총 수익률: {result.totalReturn.toFixed(2)}%</p>
          <p>최종 금액: {result.finalAmount.toLocaleString()}원</p>
          <p>누적 투자 금액: {result.cumulativeInvestment.toLocaleString()}원</p>
          <ETFTable portfolioData={portfolioData} />
          <PortfolioChart data={{ dates: result.dates, values: result.values }} />
        </div>
      )}
    </div>
  );
}

export default ETFBacktest;
