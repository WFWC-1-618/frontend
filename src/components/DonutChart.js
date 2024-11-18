import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Chart.js 요소 등록
ChartJS.register(ArcElement, Tooltip, Legend);

function DonutChart({ portfolioData }) {
  // 차트 데이터 준비
  const data = {
    labels: portfolioData.map((etf) => etf.symbol),
    datasets: [
      {
        data: portfolioData.map((etf) => etf.allocation),
        backgroundColor: ['#729cf5', '#c4d4e5', '#497376', '#a3f59c'], 
        hoverBackgroundColor: ['#5d84e1', '#a8bfc9', '#39605f', '#8dd48a'], 
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 20 } },
    },
    cutout: "70%",
  };

  return (
    <div style={{ width: "300px", margin: "auto" }}> {/* 크기 유지 */}
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default DonutChart;
