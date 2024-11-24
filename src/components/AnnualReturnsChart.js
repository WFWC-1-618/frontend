import React from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";


const AnnualReturnsChart = ({ startDate, endDate }) => {
  const generateLabels = () => {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year.toString());
    }
    return years;
  };

  const labels = startDate && endDate ? generateLabels() : [];
  const data = {
    labels,
    datasets: [
      {
        label: "Sample Portfolio",
        data: labels.map(() => Math.random() * 40 - 10), // Placeholder data
        backgroundColor: "#F25E86",
        borderWidth: 1,
        radius: 0,
      },
      {
        label: "S&P 500 ETF Trust",
        data: labels.map(() => Math.random() * 40 - 10), // Placeholder data
        backgroundColor: "#38ABF2",
        borderWidth: 1,
        radius: 0,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMin: -5, // 최소값 설정
        suggestedMax: 5,  // 최대값 설정
        title: {
          display: true,
          text: "연간 수익률", // Y축 이름 설정
        },
        ticks: {
          callback: function (value) {
            return `${value.toFixed(1)}%`; // 데이터 값을 소수점 1자리와 % 형식으로 표시
          },
        },
      },
      x: {
        ticks: {
          autoSkip: true, // X축 레이블 자동 생략
          maxTicksLimit: 10, // 최대 레이블 수 제한
        },
        grid: {
          display: false, // X축 세로선 제거
        },
      },
    },
  };
  

  return (
    <div style={{ height: "270px"}}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default AnnualReturnsChart;
