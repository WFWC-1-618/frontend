import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PortfolioForm from "../components/PortfolioForm";
import ETFTable from "../components/ETFTable";
import styles from "./ETFBacktest.module.css";
import AnnualReturnsTable from "../components/AnnualReturnsTable";
import GrowthChart from "../components/GrowthChart";

function ETFBacktest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState([]); //포트폴리오 데이터
  const [errorMessage, setErrorMessage] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1); // 기본 환율
  const [currency, setCurrency] = useState("USD");

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [growthData, setGrowthData] = useState([]);

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

  //처음 실행될 때 환율정보 한번 렌더링
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const handleDownloadCSV = () => {
    if (!result || portfolioData.length === 0 || annualReturns.length === 0)
      return;

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "")
      .split(".")[0]; // 현재 시간 (파일명에 사용)

    // **1. 포트폴리오 요약 정보**
    const summaryHeader = "\uFEFF포트폴리오 요약\n";
    const summaryContent =
      `총 투자 금액,${result.initialAmount.toFixed(2)} USD\n` +
      `최종 금액,${result.finalAmount.toFixed(2)} USD\n` +
      `총 수익률,${result.totalReturn.toFixed(2)} %\n` +
      `연간 수익률,${result.portfolioAnnualizedReturn.toFixed(2)} %\n`;

    // **2. ETF 데이터**
    const etfHeader =
      "\n포트폴리오 구성\nETF 심볼,비율 (%),수익률 (%),연간 수익률 (%),초기 금액,최종 금액\n";
    const etfContent = portfolioData
      .map((etf) => {
        const initialInvestment = (result.initialAmount * etf.allocation) / 100;
        const finalAmount = initialInvestment * (1 + etf.returns / 100);
        return (
          `${etf.symbol || "N/A"},${etf.allocation.toFixed(
            2
          )},${etf.returns.toFixed(2)},` +
          `${etf.annualizedReturn.toFixed(2)},${initialInvestment.toFixed(
            2
          )},${finalAmount.toFixed(2)}`
        );
      })
      .join("\n");

    // **3. 연간 수익률 데이터**
    const annualHeader =
      "\n연간 수익률\nYear,ETF Symbol,ETF Return (%),Portfolio Return (%)\n";
    const groupedReturns = annualReturns.reduce((acc, data) => {
      if (!acc[data.year]) acc[data.year] = [];
      acc[data.year].push(data);
      return acc;
    }, {});

    const annualContent = Object.keys(groupedReturns)
      .map((year) =>
        groupedReturns[year]
          .map((data, index) => {
            const portfolioReturn =
              index === 0
                ? portfolioData
                    .find((etf) => etf.symbol === data.symbol)
                    ?.returns.toFixed(2) || "N/A"
                : "";
            return `${year},${data.symbol},${data.return.toFixed(
              2
            )},${portfolioReturn}`;
          })
          .join("\n")
      )
      .join("\n");

    // **4. CSV 파일 합치기**
    const fullCSVContent = `${summaryHeader}${summaryContent}\n${etfHeader}${etfContent}\n${annualHeader}${annualContent}`;

    // Blob 생성 및 다운로드
    const blob = new Blob([fullCSVContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ETF_Backtest_Results_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  //=========여기까지 CSV파일 다운로드하는 함수=================

  const [annualReturns, setAnnualReturns] = useState([]); //연 수익률

  /*ETF 데이터를 가져오고 결과를 계산*/
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
    let annualReturnsData = [];

    setStartDate(startDate);
    setEndDate(endDate);

    try {
      //포트폴리오의 모든ETF에 대해 비동기로 API요청보냄
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

      //응답 데이터를 처리함
      responses.forEach((response, index) => {
        if (response.status === "fulfilled") {
          const priceData = response.value.data["Monthly Adjusted Time Series"];
          if (!priceData) return;

          //날짜 정렬
          const dates = Object.keys(priceData).sort(
            (a, b) => new Date(a) - new Date(b)
          );

          const formattedPriceData = dates.reduce((acc, date) => {
            const monthkey = date.slice(0, 7);
            acc[monthkey] = {
              close: parseFloat(priceData[date]["5. adjusted close"]),
            };
            return acc;
          }, {});

          //시작 및 종료 날짜에 가장 가까운 날짜 찾음
          const getClosestDate = (targetDate) =>
            dates.reduce((prev, curr) =>
              Math.abs(new Date(curr) - new Date(targetDate)) <
              Math.abs(new Date(prev) - new Date(targetDate))
                ? curr
                : prev
            );

          const start = getClosestDate(startDate);
          const end = getClosestDate(endDate);

          //시작가격과 종료가격을 계산함
          const startPrice = parseFloat(
            priceData[start]?.["5. adjusted close"]
          );
          const endPrice = parseFloat(priceData[end]?.["5. adjusted close"]);

          //수익률을 계산
          if (!isNaN(startPrice) && !isNaN(endPrice)) {
            const durationMonths =
              (new Date(end).getFullYear() - new Date(start).getFullYear()) *
                12 +
              (new Date(end).getMonth() - new Date(start).getMonth());
            const durationYears = durationMonths / 12;

            const annualizedReturn =
              Math.pow(endPrice / startPrice, 1 / durationYears) - 1;

            //패치포트폴리오에 push함
            fetchedPortfolioData.push({
              symbol: portfolio[index].symbol,
              allocation: parseFloat(portfolio[index].allocation),
              startPrice,
              endPrice,
              returns: ((endPrice - startPrice) / startPrice) * 100,
              annualizedReturn: annualizedReturn * 100,
              priceData: formattedPriceData,
            });

            // 연도별 수익률을 계산함
            const yearReturns = {};
            dates.forEach((date) => {
              const year = new Date(date).getFullYear();
              if (
                year >= new Date(startDate).getFullYear() &&
                year <= new Date(endDate).getFullYear()
              ) {
                if (!yearReturns[year]) {
                  yearReturns[year] = { year, returns: [] };
                }
                yearReturns[year].returns.push(
                  parseFloat(priceData[date]["5. adjusted close"])
                );
              }
            });

            Object.values(yearReturns).forEach((yearData) => {
              if (yearData.returns.length > 1) {
                const startYearPrice = yearData.returns[0];
                const endYearPrice =
                  yearData.returns[yearData.returns.length - 1];
                annualReturnsData.push({
                  year: yearData.year,
                  symbol: portfolio[index].symbol,
                  return:
                    ((endYearPrice - startYearPrice) / startYearPrice) * 100,
                });
              }
            });
          }
        }
      });

      //fetchedPortfolioData : 각 ETF의 수익률 및 연평균 수익률 데이터
      setPortfolioData(fetchedPortfolioData);
      setAnnualReturns(annualReturnsData); // 연도별 데이터 저장

      //입력값 및 결과를 상태로 저장
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

  // 포트폴리오의 총 성장과 수익률을 계산
  const calculatePortfolioGrowth = useCallback(() => {
    if (!result || portfolioData.length === 0) return;

    const { initialAmount, monthlyContribution } = result; // 시작금액(initialAmount) 월 적립 금액(monthlyContribution)을 result 객체에서 가져옴
    const start = new Date(startDate); // 시작 날짜
    const end = new Date(endDate); // 종료 날짜

    let cumulativeFinalAmount = initialAmount; // 초기 누적 금액
    const growthData = []; // 성장 데이터를 저장할 배열

    let currentDate = new Date(start); // 현재 계산 중인 월
    while (currentDate <= end) {
      console.log(`\n=== ${currentDate.toISOString().slice(0, 7)} ===`);

      // 월별 총 포트폴리오 가치를 계산
      const monthlyPortfolioValue = portfolioData.reduce((total, etf) => {
        const currentMonthStr = currentDate.toISOString().slice(0, 7); // YYYY-MM 형식
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1); // 다음 달로 이동
        const nextMonthStr = nextDate.toISOString().slice(0, 7);

        // ETF의 월별 성장률을 계산
        const currentPrice = etf.priceData?.[currentMonthStr]?.close || 1;
        const nextPrice = etf.priceData?.[nextMonthStr]?.close || currentPrice;
        const monthlyGrowthRate = (nextPrice - currentPrice) / currentPrice;

        // ETF의 초기 투자 금액 및 월 적립 금액 계산
        const etfInitialInvestment = (initialAmount * etf.allocation) / 100;
        const etfMonthlyInvestment =
          (monthlyContribution * etf.allocation) / 100;

        // ETF의 월별 최종 금액 계산
        const etfMonthlyFinalAmount =
          etfInitialInvestment * (1 + monthlyGrowthRate) +
          etfMonthlyInvestment * (1 + monthlyGrowthRate);

        console.log(
          `ETF: ${etf.symbol}, Growth Rate: ${monthlyGrowthRate}, Final Amount: ${etfMonthlyFinalAmount}`
        );

        return total + etfMonthlyFinalAmount; // 전체 포트폴리오 금액에 누적
      }, 0);

      console.log(
        `Final Portfolio Value for ${currentDate
          .toISOString()
          .slice(0, 7)}: ${monthlyPortfolioValue}`
      );

      // 월별 데이터를 성장 데이터 배열에 추가
      growthData.push({
        date: currentDate.toISOString().slice(0, 7), // YYYY-MM 형식
        value: monthlyPortfolioValue,
      });

      // 누적 금액 업데이트
      cumulativeFinalAmount = monthlyPortfolioValue;

      // 다음 달로 이동
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 최종 결과 계산
    const cumulativeInvestment =
      initialAmount +
      portfolioData.reduce(
        (sum, etf) =>
          sum +
          ((monthlyContribution * etf.allocation) / 100) *
            (12 * (end.getFullYear() - start.getFullYear()) +
              (end.getMonth() - start.getMonth() + 1)),
        0
      );

    const totalReturn =
      ((cumulativeFinalAmount - cumulativeInvestment) / cumulativeInvestment) *
      100;

    const durationMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    const durationYears = durationMonths / 12;

    const portfolioAnnualizedReturn =
      Math.pow(cumulativeFinalAmount / initialAmount, 1 / durationYears) - 1;

    // 결과 상태 업데이트
    setResult((prev) => ({
      ...prev,
      totalReturn,
      finalAmount: cumulativeFinalAmount,
      cumulativeInvestment,
      portfolioAnnualizedReturn: portfolioAnnualizedReturn * 100,
    }));

    // 성장 데이터를 상태로 저장
    setGrowthData(growthData);
  }, [portfolioData, result]);

  useEffect(() => {
    calculatePortfolioGrowth();
  }, [portfolioData]);

  // 표준편차 계산 함수
  const calculateStandardDeviation = (annualReturns) => {
    if (!annualReturns || annualReturns.length === 0) return null;

    // 연도별 수익률 값 추출
    const returns = annualReturns.map(
      ({ return: annualReturn }) => annualReturn
    );
    const mean =
      returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      returns.length;

    // 표준편차 계산
    return Math.sqrt(variance);
  };

  const standardDeviation = calculateStandardDeviation(annualReturns);

  // 최고 및 최저 연도 수익률 계산 함수
  const getMaxAndMinReturns = (annualReturns) => {
    if (!annualReturns || annualReturns.length === 0)
      return { max: null, min: null };

    let maxReturn = { year: null, symbol: null, value: -Infinity };
    let minReturn = { year: null, symbol: null, value: Infinity };

    annualReturns.forEach(({ year, symbol, return: annualReturn }) => {
      if (annualReturn > maxReturn.value) {
        maxReturn = { year, symbol, value: annualReturn };
      }
      if (annualReturn < minReturn.value) {
        minReturn = { year, symbol, value: annualReturn };
      }
    });

    return { max: maxReturn, min: minReturn };
  };

  const maxMinReturns = getMaxAndMinReturns(annualReturns);

  //샤프비율
  const calculateSharpeRatio = (
    portfolioReturn,
    riskFreeRate,
    standardDeviation
  ) => {
    if (!standardDeviation || standardDeviation === 0) return null;
    return (portfolioReturn - riskFreeRate) / standardDeviation;
  };
  //소르티노비율
  const calculateSortinoRatio = (
    portfolioReturn,
    riskFreeRate,
    annualReturns
  ) => {
    if (!annualReturns || annualReturns.length === 0) return null;

    const downsideReturns = annualReturns
      .map(({ return: annualReturn }) => Math.min(0, annualReturn))
      .filter((downside) => downside < 0)
      .map((downside) => Math.pow(downside, 2));

    if (downsideReturns.length === 0) return null;

    const downsideDeviation = Math.sqrt(
      downsideReturns.reduce((sum, value) => sum + value, 0) /
        downsideReturns.length
    );

    return downsideDeviation === 0
      ? null
      : (portfolioReturn - riskFreeRate) / downsideDeviation;
  };

  const riskFreeRate = 2; // 무위험 수익률

  const sharpeRatio = calculateSharpeRatio(
    result?.portfolioAnnualizedReturn,
    riskFreeRate,
    standardDeviation
  );

  const sortinoRatio = calculateSortinoRatio(
    result?.portfolioAnnualizedReturn,
    riskFreeRate,
    annualReturns
  );
  //수익금
  const profit = result
    ? (result.finalAmount - result.initialAmount) *
      (currency === "KRW" ? exchangeRate : 1)
    : null;

  return (
    <div className="etf-backtest">
      <h1 className={styles.maintitle}>ETF 백테스팅 애플리케이션</h1>
      <PortfolioForm onSubmit={handleFormSubmit} />
      {loading && <p className="loading">로딩 중...</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}
      {result && result.totalReturn !== undefined && (
        <div className={styles.results}>
          <div className="currency-selector">
            <label>
              통화:
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD (달러)</option>
                <option value="KRW">KRW (원)</option>
              </select>
            </label>
          </div>
          <h2>백테스트 결과</h2>
          <h3>Performance Summary</h3>
          <table className={styles.resultTable}>
            <thead>
              <tr>
                <th>값</th>
                <th>샘플 포트폴리오</th>
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
                <td>종료 잔액</td>
                <td>
                  {currency === "KRW"
                    ? `${(
                        result.finalAmount * exchangeRate
                      ).toLocaleString()} 원`
                    : `${result.finalAmount.toLocaleString()} USD`}
                </td>
              </tr>
              <tr>
                <td>수익금</td>
                <td>
                  {profit !== null
                    ? `${profit.toLocaleString()} ${
                        currency === "KRW" ? "원" : "USD"
                      }`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>총 수익률</td>
                <td>{`${result.totalReturn.toFixed(2)}%`}</td>
              </tr>
              <tr>
                <td>연간 수익률</td>
                <td>{`${result.portfolioAnnualizedReturn.toFixed(2)}%`}</td>
              </tr>
              <tr>
                <td>표준편차</td>
                <td>
                  {standardDeviation !== null
                    ? `${standardDeviation.toFixed(2)}%`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>최고 연도 수익률</td>
                <td>
                  {maxMinReturns.max
                    ? `${maxMinReturns.max.value.toFixed(2)}%`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>최저 연도 수익률</td>
                <td>
                  {maxMinReturns.min
                    ? `${maxMinReturns.min.value.toFixed(2)}%`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>샤프 비율</td>
                <td>{sharpeRatio !== null ? sharpeRatio.toFixed(2) : "N/A"}</td>
              </tr>
              <tr>
                <td>소르티노 비율</td>
                <td>
                  {sortinoRatio !== null ? sortinoRatio.toFixed(2) : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>
          <button onClick={handleDownloadCSV} className={styles.button}>
            결과 다운로드 (CSV)
          </button>
          <GrowthChart growthData={growthData} />
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
