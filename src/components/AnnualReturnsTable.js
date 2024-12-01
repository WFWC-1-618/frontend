import React from "react";
import styles from "./AnnualReturnsTable.module.css";

const AnnualReturnsTable = ({ annualReturns, portfolioAnnualReturns }) => {
  if (!annualReturns || annualReturns.length === 0) {
    return <p>연도별 데이터가 없습니다.</p>;
  }

  const groupedReturns = annualReturns.reduce((acc, data) => {
    if (!acc[data.year]) acc[data.year] = [];
    acc[data.year].push(data);
    return acc;
  }, {});

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>연도</th>
          <th>ETF 종목</th>
          <th>ETF 수익률 (%)</th>
          <th>나의 포트폴리오 수익률 (%)</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(groupedReturns).map((year) =>
          groupedReturns[year].map((data, index) => (
            <tr key={`${year}-${data.symbol}-${index}`}>
              <td>{index === 0 ? year : ""}</td>
              <td>{data.symbol}</td>
              <td>{data.return.toFixed(2)}</td>
              {index === 0 && (
                <td rowSpan={groupedReturns[year].length}>
                  {portfolioAnnualReturns
                    ?.find((p) => p.year === parseInt(year))
                    ?.return?.toFixed(2) || "N/A"}
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default AnnualReturnsTable;