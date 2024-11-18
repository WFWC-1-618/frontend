import React from "react";

function ETFTable({ portfolioData }) {
    return (
      <table>
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
              <td>
                {((etf.endPrice * etf.allocation) / 100).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  
  

export default ETFTable;