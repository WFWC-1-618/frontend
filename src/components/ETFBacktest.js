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

  const [annualReturns, setAnnualReturns] = useState([]);
  const [portfolioAnnualReturns, setPortfolioAnnualReturns] = useState([]);
  const [spyAnnualReturns, setSpyAnnualReturns] = useState([]);
  const [spyData, setSpyData] = useState(null);

  const [standardDeviation, setStandardDeviation] = useState(null);
  const [maxMinReturns, setMaxMinReturns] = useState({ max: null, min: null });
  const [sharpeRatio, setSharpeRatio] = useState(null);
  const [sortinoRatio, setSortinoRatio] = useState(null);

  const [spyStandardDeviation, setSpyStandardDeviation] = useState(null);
  const [spyMaxMinReturns, setSpyMaxMinReturns] = useState({
    max: null,
    min: null,
  });
  const [spySharpeRatio, setSpySharpeRatio] = useState(null);
  const [spySortinoRatio, setSpySortinoRatio] = useState(null);

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
    if (
      !result ||
      portfolioData.length === 0 ||
      annualReturns.length === 0 ||
      standardDeviation === null ||
      !maxMinReturns.max ||
      !maxMinReturns.min ||
      sharpeRatio === null ||
      sortinoRatio === null
    ) {
      alert("모든 성과 지표가 준비되지 않았습니다.");
      return;
    }

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
      `종료 금액,${result.finalAmount.toFixed(2)} USD\n` +
      `수익금,${(result.finalAmount - result.initialAmount).toFixed(2)} USD\n` +
      `총 수익률,${result.totalReturn.toFixed(2)} %\n` +
      `연간 수익률,${result.portfolioAnnualizedReturn.toFixed(2)} %\n` +
      `표준편차,${standardDeviation.toFixed(2)} %\n` +
      `최고 연도 수익률,${maxMinReturns.max.value.toFixed(2)}% (${
        maxMinReturns.max.year
      })\n` +
      `최저 연도 수익률,${maxMinReturns.min.value.toFixed(2)}% (${
        maxMinReturns.min.year
      })\n` +
      `샤프 비율,${sharpeRatio.toFixed(2)}\n` +
      `소르티노 비율,${sortinoRatio.toFixed(2)}\n`;

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
                ? portfolioAnnualReturns
                    .find((p) => p.year === parseInt(year))
                    ?.return?.toFixed(2) || "N/A"
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

  /* ETF 데이터를 가져오고 결과를 계산 */
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
    let fetchedSpyData = null;
    let fetchedSpyAnnualReturns = [];

    setStartDate(startDate);
    setEndDate(endDate);

    try {
      // 포트폴리오의 ETF 요청 배열 생성
      const portfolioRequests = portfolio.map((etf) =>
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
      );

      // SPY 데이터 요청 추가
      const spyRequest = axios.get(
        "https://alpha-vantage.p.rapidapi.com/query",
        {
          params: {
            function: "TIME_SERIES_MONTHLY_ADJUSTED",
            symbol: "SPY",
          },
          headers: {
            "X-RapidAPI-Key": process.env.REACT_APP_RAPIDAPI_KEY,
            "X-RapidAPI-Host": process.env.REACT_APP_RAPIDAPI_HOST,
          },
        }
      );

      // 모든 요청을 하나의 배열로 합치기
      const requests = [...portfolioRequests, spyRequest];

      // 모든 요청을 병렬로 실행
      const responses = await Promise.allSettled(requests);

      // 응답 처리
      responses.forEach((response, index) => {
        if (response.status === "fulfilled") {
          const priceData = response.value.data["Monthly Adjusted Time Series"];
          if (!priceData) return;

          const dates = Object.keys(priceData).sort(
            (a, b) => new Date(a) - new Date(b)
          );

          //월별 종가 데이터 저장
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

            if (index === portfolio.length) {
              // SPY 데이터 처리
              fetchedSpyData = {
                startPrice,
                endPrice,
                returns: ((endPrice - startPrice) / startPrice) * 100,
                annualizedReturn: annualizedReturn * 100,
                initialAmount: parseFloat(initialAmount),
                finalAmount:
                  parseFloat(initialAmount) *
                  (1 + (endPrice - startPrice) / startPrice),
                priceData: formattedPriceData, //월별 SPY종가를 저장
              };
            } else {
              // 포트폴리오 ETF 데이터 처리
              if (!portfolio[index]) return;
              fetchedPortfolioData.push({
                symbol: portfolio[index].symbol,
                allocation: parseFloat(portfolio[index].allocation),
                startPrice,
                endPrice,
                returns: ((endPrice - startPrice) / startPrice) * 100,
                annualizedReturn: annualizedReturn * 100,
                priceData: formattedPriceData, //월별 샘플 포트폴리오 종가를 저장
              });
            }

            // 연도별 수익률 계산
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
                const annualReturn =
                  ((endYearPrice - startYearPrice) / startYearPrice) * 100;

                if (index === portfolio.length) {
                  // SPY의 연도별 수익률을 fetchedSpyAnnualReturns에 저장
                  fetchedSpyAnnualReturns.push({
                    year: yearData.year,
                    symbol: "SPY",
                    return: annualReturn,
                  });
                } else {
                  // 포트폴리오 ETF의 연도별 수익률을 annualReturnsData에 저장
                  annualReturnsData.push({
                    year: yearData.year,
                    symbol: portfolio[index].symbol,
                    return: annualReturn,
                  });
                }
              }
            });
          }
        }
      });

      //fetchedPortfolioData : 각 ETF의 수익률 및 연평균 수익률 데이터
      setPortfolioData(fetchedPortfolioData);
      setAnnualReturns(annualReturnsData); // 연도별 데이터 저장
      setSpyAnnualReturns(fetchedSpyAnnualReturns); // SPY 연도별 데이터 저장
      setSpyData(fetchedSpyData);

      // 포트폴리오 연간 수익률 계산
      const portfolioReturnsByYear = {};

      annualReturnsData.forEach(({ year, symbol, return: etfReturn }) => {
        const etfAllocation =
          portfolio.find((p) => p.symbol === symbol)?.allocation || 0;
        if (!portfolioReturnsByYear[year]) {
          portfolioReturnsByYear[year] = 0;
        }
        portfolioReturnsByYear[year] += (etfReturn * etfAllocation) / 100;
      });

      const portfolioAnnualReturnsArray = Object.keys(
        portfolioReturnsByYear
      ).map((year) => ({
        year: parseInt(year),
        return: portfolioReturnsByYear[year],
      }));

      setPortfolioAnnualReturns(portfolioAnnualReturnsArray);

      setResult({
        startDate,
        endDate,
        initialAmount: parseFloat(initialAmount),
        monthlyContribution: parseFloat(monthlyContribution),
      });
    } catch (error) {
      setErrorMessage(`데이터를 가져오는 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 포트폴리오의 총 성장과 수익률을 계산
  const calculatePortfolioGrowth = useCallback(() => {
    if (!result || portfolioData.length === 0) return;

    const { initialAmount, monthlyContribution } = result; // 시작 금액과 월 적립 금액
    const start = new Date(startDate); // 시작 날짜
    const end = new Date(endDate); // 종료 날짜

    // ETF별 누적 금액을 저장하는 배열 (초기 투자 금액으로 초기화)
    let cumulativeETFValues = portfolioData.map((etf) => ({
      symbol: etf.symbol,
      value: (initialAmount * etf.allocation) / 100, // 초기 투자 금액
    }));

    const growthData = []; // 월별 성장 데이터를 저장할 배열
    let currentDate = new Date(start);

    let monthlyPortfolioValue = 0; // 해당 월의 포트폴리오 가치
    while (currentDate <= end) {
      monthlyPortfolioValue = 0; // 해당 월의 포트폴리오 가치

      portfolioData.forEach((etf, index) => {
        const currentMonthStr = currentDate.toISOString().slice(0, 7);
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        const nextMonthStr = nextDate.toISOString().slice(0, 7);

        // 가격 데이터 가져오기
        const currentPrice = etf.priceData?.[currentMonthStr]?.close || 1;
        const nextPrice = etf.priceData?.[nextMonthStr]?.close || currentPrice;

        // 월별 성장률 계산
        const monthlyGrowthRate =
          currentPrice > 0 ? (nextPrice - currentPrice) / currentPrice : 0;

        // 월 적립 금액 계산
        const etfMonthlyInvestment =
          (monthlyContribution * etf.allocation) / 100;

        // 누적 금액에 월 적립 금액과 성장률 적용
        cumulativeETFValues[index].value =
          (cumulativeETFValues[index].value + etfMonthlyInvestment) *
          (1 + monthlyGrowthRate);

        // 월별 포트폴리오 가치에 해당 ETF의 누적 금액 합산
        monthlyPortfolioValue += cumulativeETFValues[index].value;

        console.log(
          `ETF: ${
            etf.symbol
          }, Month: ${currentMonthStr}, Growth Rate: ${monthlyGrowthRate.toFixed(
            4
          )}, Cumulative Value: ${cumulativeETFValues[index].value.toFixed(2)}`
        );
      });

      // 월별 성장 데이터를 저장
      growthData.push({
        date: currentDate.toISOString().slice(0, 7),
        value: monthlyPortfolioValue,
      });

      currentDate.setMonth(currentDate.getMonth() + 1); // 다음 달로 이동
    }

    // 총 투자 금액 계산 (초기 투자 + 누적된 모든 월 적립 금액)
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

    // 총 수익률 계산
    const totalReturn =
      ((monthlyPortfolioValue - cumulativeInvestment) / cumulativeInvestment) *
      100;

    // 연환산 수익률 계산
    const durationMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    const durationYears = durationMonths / 12;

    const portfolioAnnualizedReturn =
      Math.pow(monthlyPortfolioValue / initialAmount, 1 / durationYears) - 1;

    // 결과를 상태에 저장
    setResult((prev) => ({
      ...prev,
      totalReturn,
      finalAmount: monthlyPortfolioValue,
      cumulativeInvestment,
      portfolioAnnualizedReturn: portfolioAnnualizedReturn * 100,
    }));

    // 성장 데이터를 상태로 저장
    setGrowthData(growthData);
  }, [portfolioData, result, startDate, endDate]);

  useEffect(() => {
    calculatePortfolioGrowth();
  }, [portfolioData, result, calculatePortfolioGrowth]);

  // 포트폴리오 성과 지표 계산
  useEffect(() => {
    if (portfolioAnnualReturns.length > 0) {
      const stdDev = calculateStandardDeviation(portfolioAnnualReturns);
      setStandardDeviation(stdDev);

      const maxMin = getMaxAndMinReturns(portfolioAnnualReturns);
      setMaxMinReturns(maxMin);

      const sharpe = calculateSharpeRatio(
        result?.portfolioAnnualizedReturn,
        riskFreeRate,
        stdDev
      );
      setSharpeRatio(sharpe);

      const sortino = calculateSortinoRatio(
        result?.portfolioAnnualizedReturn,
        riskFreeRate,
        portfolioAnnualReturns
      );
      setSortinoRatio(sortino);
    }
  }, [portfolioAnnualReturns, result]);

  const [spyGrowthData, setSpyGrowthData] = useState([]);

  //SPY 성장세 계산
  const calculateSPYGrowth = useCallback(() => {
    if (!spyData || !spyData.priceData) return;

    const { initialAmount } = spyData; // SPY의 초기 투자 금액
    const start = new Date(startDate); // 시작 날짜
    const end = new Date(endDate); // 종료 날짜

    let spyValue = initialAmount; // 초기 SPY 가치
    const spyGrowthData = []; // SPY의 월별 성장 데이터를 저장할 배열

    let currentDate = new Date(start);

    while (currentDate <= end) {
      const currentMonthStr = currentDate.toISOString().slice(0, 7);
      const nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextMonthStr = nextDate.toISOString().slice(0, 7);

      // SPY의 현재 및 다음 달 가격 데이터
      const currentPrice = spyData.priceData?.[currentMonthStr]?.close || 1;
      const nextPrice =
        spyData.priceData?.[nextMonthStr]?.close || currentPrice;

      // 월별 성장률 계산
      const monthlyGrowthRate =
        currentPrice > 0 ? (nextPrice - currentPrice) / currentPrice : 0;

      // SPY 가치에 성장률 적용
      spyValue = spyValue * (1 + monthlyGrowthRate);

      // 월별 SPY 성장 데이터를 저장
      spyGrowthData.push({
        date: currentDate.toISOString().slice(0, 7),
        value: spyValue,
      });

      currentDate.setMonth(currentDate.getMonth() + 1); // 다음 달로 이동
    }

    return spyGrowthData;
  }, [spyData, startDate, endDate]);

  useEffect(() => {
    const growth = calculateSPYGrowth();
    if (growth) {
      setSpyGrowthData(growth);
    }
  }, [calculateSPYGrowth]);

  // SPY 성과 지표 계산
  useEffect(() => {
    if (spyAnnualReturns.length > 0 && spyData) {
      const stdDev = calculateStandardDeviation(spyAnnualReturns);
      setSpyStandardDeviation(stdDev);

      const maxMin = getMaxAndMinReturns(spyAnnualReturns);
      setSpyMaxMinReturns(maxMin);

      const sharpe = calculateSharpeRatio(
        spyData?.annualizedReturn,
        riskFreeRate,
        stdDev
      );
      setSpySharpeRatio(sharpe);

      const sortino = calculateSortinoRatio(
        spyData?.annualizedReturn,
        riskFreeRate,
        spyAnnualReturns
      );
      setSpySortinoRatio(sortino);
    }
  }, [spyAnnualReturns, spyData]);

  // 표준편차 계산 함수
  const calculateStandardDeviation = (returnsArray) => {
    if (!returnsArray || returnsArray.length === 0) return null;

    // 수익률을 소수(decimal)로 변환
    const returnsInDecimal = returnsArray.map(
      ({ return: annualReturn }) => annualReturn / 100
    );
    const mean =
      returnsInDecimal.reduce((sum, value) => sum + value, 0) /
      returnsInDecimal.length;
    const variance =
      returnsInDecimal.reduce(
        (sum, value) => sum + Math.pow(value - mean, 2),
        0
      ) / returnsInDecimal.length;

    // 표준편차 계산 후 퍼센트(%)로 변환
    return Math.sqrt(variance) * 100;
  };

  // 최고 및 최저 연도 수익률 계산 함수
  const getMaxAndMinReturns = (returnsArray) => {
    if (!returnsArray || returnsArray.length === 0)
      return { max: null, min: null };

    let maxReturn = { year: null, symbol: null, value: -Infinity };
    let minReturn = { year: null, symbol: null, value: Infinity };

    returnsArray.forEach(({ year, symbol, return: annualReturn }) => {
      if (annualReturn > maxReturn.value) {
        maxReturn = { year, symbol, value: annualReturn };
      }
      if (annualReturn < minReturn.value) {
        minReturn = { year, symbol, value: annualReturn };
      }
    });

    return { max: maxReturn, min: minReturn };
  };

  // 샤프비율 계산 함수
  const calculateSharpeRatio = (
    portfolioReturn,
    riskFreeRate,
    standardDeviation
  ) => {
    if (!standardDeviation || standardDeviation === 0) return null;

    const portfolioReturnDecimal = portfolioReturn / 100;
    const riskFreeRateDecimal = riskFreeRate / 100;
    const standardDeviationDecimal = standardDeviation / 100;

    return (
      (portfolioReturnDecimal - riskFreeRateDecimal) / standardDeviationDecimal
    );
  };
  const riskFreeRate = 2; // 무위험 수익률

  // 소르티노비율 계산 함수
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

  // 수익금 계산
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
          <h3>성과 요약</h3>
          <table className={styles.resultTable}>
            <thead>
              <tr>
                <th>값</th>
                <th>샘플 포트폴리오</th>
                <th>SPDR S&P 500 ETF Trust</th>
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
                <td>
                  {spyData
                    ? currency === "KRW"
                      ? `${(
                          spyData.initialAmount * exchangeRate
                        ).toLocaleString()} 원`
                      : `${spyData.initialAmount.toLocaleString()} USD`
                    : "N/A"}
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
                <td>
                  {spyData
                    ? currency === "KRW"
                      ? `${(
                          spyData.finalAmount * exchangeRate
                        ).toLocaleString()} 원`
                      : `${spyData.finalAmount.toLocaleString()} USD`
                    : "N/A"}
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
                <td>
                  {spyData
                    ? currency === "KRW"
                      ? `${(
                          (spyData.finalAmount - spyData.initialAmount) *
                          exchangeRate
                        ).toLocaleString()} 원`
                      : `${(
                          spyData.finalAmount - spyData.initialAmount
                        ).toLocaleString()} USD`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>총 수익률</td>
                <td>{`${result.totalReturn.toFixed(2)}%`}</td>
                <td>{spyData ? `${spyData.returns.toFixed(2)}%` : "N/A"}</td>
              </tr>
              <tr>
                <td>연간 수익률</td>
                <td>{`${result.portfolioAnnualizedReturn.toFixed(2)}%`}</td>
                <td>
                  {spyData ? `${spyData.annualizedReturn.toFixed(2)}%` : "N/A"}
                </td>
              </tr>
              <tr>
                <td>표준편차</td>
                <td>
                  {standardDeviation !== null
                    ? `${standardDeviation.toFixed(2)}%`
                    : "N/A"}
                </td>
                <td>
                  {spyStandardDeviation !== null
                    ? `${spyStandardDeviation.toFixed(2)}%`
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
                <td>
                  {spyMaxMinReturns.max
                    ? `${spyMaxMinReturns.max.value.toFixed(2)}%`
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
                <td>
                  {spyMaxMinReturns.min
                    ? `${spyMaxMinReturns.min.value.toFixed(2)}%`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>샤프 비율</td>
                <td>{sharpeRatio !== null ? sharpeRatio.toFixed(2) : "N/A"}</td>
                <td>
                  {spySharpeRatio !== null ? spySharpeRatio.toFixed(2) : "N/A"}
                </td>
              </tr>
              <tr>
                <td>소르티노 비율</td>
                <td>
                  {sortinoRatio !== null ? sortinoRatio.toFixed(2) : "N/A"}
                </td>
                <td>
                  {spySortinoRatio !== null
                    ? spySortinoRatio.toFixed(2)
                    : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>
          <br></br>
          <h3>나의 ETF</h3>
          <ETFTable portfolioData={portfolioData} />
          <br></br>
          <h3>연도별 수익률</h3>
          <AnnualReturnsTable
            annualReturns={annualReturns}
            portfolioAnnualReturns={portfolioAnnualReturns}
          />
          <br></br>
          <button onClick={handleDownloadCSV} className={styles.button}>
            결과 다운로드 (CSV)
          </button>
          <GrowthChart growthData={growthData} spyGrowthData={spyGrowthData} />
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
