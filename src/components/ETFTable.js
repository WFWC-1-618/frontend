/**
 * 이 컴포넌트는 백테스트 실행 후
 * 각 ETF에 대한 테이블을 표시해 줌
 */
import React from "react";
import styles from "./ETFTable.module.css";

function ETFTable({ portfolioData }) {
  if (!portfolioData || portfolioData.length === 0) {
    return <p>포트폴리오 데이터 없음</p>;
  }
  console.log(portfolioData);
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>ETF 심볼</th>
          <th>비율 (%)</th>
          <th>수익률 (%)</th>
          <th>초기 금액</th>
          <th>최종 금액</th>
        </tr>
      </thead>
      <tbody>
        {portfolioData.map((etf, index) => (
          <tr key={index}>
            <td>{etf.symbol}</td>
            <td>{etf.allocation.toFixed(2)}</td>
            <td>{etf.returns.toFixed(2)}</td>
            <td>
              {((etf.startPrice * etf.allocation) / 100).toLocaleString()}
            </td>
            <td>{((etf.endPrice * etf.allocation) / 100).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ETFTable;
