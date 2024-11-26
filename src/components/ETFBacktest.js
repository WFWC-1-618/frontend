import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PortfolioForm from "./PortfolioForm";
import PortfolioChart from "./PortfolioChart";
import ETFTable from "./ETFTable";
import styles from "./ETFBacktest.module.css";
import AnnualReturnsTable from "./AnnualReturnsTable";


function ETFBacktest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1); // 기본 환율
  const [currency, setCurrency] = useState("KRW"); // 기본 통화: KRW

  // 환율 정보를 가져오는 함수
  const fetchExchangeRate = async () => {
    try {
      const response = await axios.get(
        "https://alpha-vantage.p.rapidapi.com/query",
        {
          params: {
            function: "CURRENCY_EXCHANGE_RATE",
            from_currency: "USD",
            to_currency: "KRW",
          },
          headers: {
            "X-RapidAPI-Key": process.env.REACT_APP_RAPIDAPI_KEY,
            "X-RapidAPI-Host": process.env.REACT_APP_RAPIDAPI_HOST,
          },
        }
      );

      const rate = parseFloat(
        response.data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]
      );

      if (!isNaN(rate)) {
        setExchangeRate(rate);
      }
    } catch (error) {
      console.error("환율 정보를 가져오는데 실패했습니다:", error);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const calculateETFPerformance = (
    etf,
    months,
    initialAmount,
    monthlyContribution
  ) => {
    const etfInitialAmount = (initialAmount * etf.allocation) / 100;
    let etfFinalAmount = etfInitialAmount;

    for (let i = 1; i <= months; i++) {
      const monthlyInvestment = (monthlyContribution * etf.allocation) / 100;
      etfFinalAmount += monthlyInvestment;
    }

    etfFinalAmount *= Math.pow(1 + etf.returns / 100, months / 12);
    return etfFinalAmount;
  };

  const handleDownloadCSV = () => {
    if (!result || portfolioData.length === 0) return;

    const csvHeader =
      "\uFEFFETF 심볼,비율 (%),수익률 (%),연간 수익률 (%),초기 금액,최종 금액\n";
    const csvContent = portfolioData
      .map((etf) => {
        const initialInvestment = (result.initialAmount * etf.allocation) / 100;
        const finalAmount = initialInvestment * (1 + etf.returns / 100);
        return `${etf.symbol},${etf.allocation},${etf.returns.toFixed(
          2
        )},${etf.annualizedReturn.toFixed(2)},${initialInvestment.toFixed(
          2
        )},${finalAmount.toFixed(2)}`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ETF_Backtest_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [annualReturns, setAnnualReturns] = useState([]);

  const handleFormSubmit = async ({ portfolio, startDate, endDate, initialAmount, monthlyContribution }) => {
    setLoading(true);
    setErrorMessage("");
    let fetchedPortfolioData = [];
    let annualReturnsData = [];

    try {
      const responses = await Promise.allSettled(
        portfolio.map((etf) =>
          axios.get("https://alpha-vantage.p.rapidapi.com/query", {
            params: {
              function: "TIME_SERIES_MONTHLY_ADJUSTED",
              symbol: etf.symbol,
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
          const priceData = response.value.data["Monthly Adjusted Time Series"];
          if (!priceData) return;

          const dates = Object.keys(priceData).sort((a, b) => new Date(a) - new Date(b));

          const getClosestDate = (targetDate) =>
            dates.reduce((prev, curr) =>
              Math.abs(new Date(curr) - new Date(targetDate)) < Math.abs(new Date(prev) - new Date(targetDate)) ? curr : prev
            );

          const start = getClosestDate(startDate);
          const end = getClosestDate(endDate);

          const startPrice = parseFloat(
            priceData[start]?.["5. adjusted close"]
          );
          const endPrice = parseFloat(
            priceData[end]?.["5. adjusted close"]
          );

          if (!isNaN(startPrice) && !isNaN(endPrice)) {
            const durationMonths =
              (new Date(end).getFullYear() - new Date(start).getFullYear()) * 12 +
              (new Date(end).getMonth() - new Date(start).getMonth());
            const durationYears = durationMonths / 12;

            const annualizedReturn =
              Math.pow(endPrice / startPrice, 1 / durationYears) - 1;

            fetchedPortfolioData.push({
              symbol: portfolio[index].symbol,
              allocation: parseFloat(portfolio[index].allocation),
              startPrice,
              endPrice,
              returns: ((endPrice - startPrice) / startPrice) * 100,
              annualizedReturn: annualizedReturn * 100,
            });

            // 연도별 데이터 계산
            const yearReturns = {};
            dates.forEach((date) => {
              const year = new Date(date).getFullYear();
              if (year >= new Date(startDate).getFullYear() && year <= new Date(endDate).getFullYear()) {
                if (!yearReturns[year]) {
                  yearReturns[year] = { year, returns: [] };
                }
                yearReturns[year].returns.push(parseFloat(priceData[date]["5. adjusted close"]));
              }
            });

            Object.values(yearReturns).forEach((yearData) => {
              if (yearData.returns.length > 1) {
                const startYearPrice = yearData.returns[0];
                const endYearPrice = yearData.returns[yearData.returns.length - 1];
                annualReturnsData.push({
                  year: yearData.year,
                  symbol: portfolio[index].symbol,
                  return: ((endYearPrice - startYearPrice) / startYearPrice) * 100,
                });
              }
            });
          }
        }
      });

      setPortfolioData(fetchedPortfolioData);
      setAnnualReturns(annualReturnsData); // 연도별 데이터 저장
      setResult({
        startDate,
        endDate,
        initialAmount: parseFloat(initialAmount),
        monthlyContribution: parseFloat(monthlyContribution),
      });
    } catch (error) {
      setErrorMessage(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioGrowth = useCallback(() => {
    const { initialAmount, monthlyContribution } = result;

    let cumulativeInvestment = initialAmount;
    let cumulativeFinalAmount = 0;

    portfolioData.forEach((etf) => {
      const etfInitialAmount = (initialAmount * etf.allocation) / 100;
      const etfFinalAmount = etfInitialAmount * (1 + etf.returns / 100);
      cumulativeFinalAmount += etfFinalAmount;

      // 월별 적립액 반영
      const monthlyInvestment = (monthlyContribution * etf.allocation) / 100;
      cumulativeInvestment += monthlyInvestment;
    });

    const totalReturn =
      ((cumulativeFinalAmount - cumulativeInvestment) / cumulativeInvestment) *
      100;

    const durationMonths =
      (new Date(result.endDate).getFullYear() -
        new Date(result.startDate).getFullYear()) *
      12 +
      (new Date(result.endDate).getMonth() -
        new Date(result.startDate).getMonth());
    const durationYears = durationMonths / 12;

    const portfolioAnnualizedReturn =
      Math.pow(cumulativeFinalAmount / initialAmount, 1 / durationYears) - 1;

    setResult((prev) => ({
      ...prev,
      totalReturn,
      finalAmount: cumulativeFinalAmount,
      cumulativeInvestment,
      portfolioAnnualizedReturn: portfolioAnnualizedReturn * 100,
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
      <div className="currency-selector">
        <label>
          통화:
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="KRW">KRW (원)</option>
            <option value="USD">USD (달러)</option>
          </select>
        </label>
      </div>
      {loading && <p className="loading">로딩 중...</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}
      {result && result.totalReturn !== undefined && (
        <div className={styles.results}>
          <h2>백테스트 결과</h2>
          <table className={styles.resultTable}>
            <thead>
              <tr>
                <th>미터법</th>
                <th>값</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>시작 잔액</td>
                <td>
                  {currency === "KRW"
                    ? `${(
                        result.initialAmount * exchangeRate
                      ).toLocaleString()} 원`
                    : `${result.initialAmount.toLocaleString()} USD`}
                </td>
              </tr>
              <tr>
                <td>잔액 종료</td>
                <td>
                  {currency === "KRW"
                    ? `${(
                        result.finalAmount * exchangeRate
                      ).toLocaleString()} 원`
                    : `${result.finalAmount.toLocaleString()} USD`}
                </td>
              </tr>
            </tbody>
          </table>
          <p>총 수익률: {result.totalReturn.toFixed(2)}%</p>
          <p>연간 수익률: {result.portfolioAnnualizedReturn.toFixed(2)}%</p>
          <button onClick={handleDownloadCSV} className={styles.button}>
            결과 다운로드 (CSV)
          </button>
          <ETFTable portfolioData={portfolioData} />
          <h3>Annual Returns</h3>
          <AnnualReturnsTable
            annualReturns={annualReturns}
            portfolioReturns={portfolioData.map((etf) => ({
              year: etf.year,
              return: etf.returns,
            }))}
          />

        </div>
      )}
    </div>
  );
}

export default ETFBacktest;
