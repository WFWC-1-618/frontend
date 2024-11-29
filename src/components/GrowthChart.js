import React from "react";
import { Line } from "react-chartjs-2";

function GrowthChart({ growthData }) {
  // 차트 데이터 준비
  const chartData = {
    labels: growthData.map((point) => point.date), // X축: 날짜
    datasets: [
      {
        label: "포트폴리오 가치",
        data: growthData.map((point) => point.value), // Y축: 포트폴리오 가치
        borderColor: "rgba(75, 192, 192, 1)", // 선 색상
        backgroundColor: "rgba(75, 192, 192, 0.2)", // 배경 색상
        tension: 0.4, // 곡선 부드러움
        fill: true, // 그래프 아래 채우기
      },
    ],
  };

  // 차트 옵션 설정
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "기간",
        },
      },
      y: {
        title: {
          display: true,
          text: "포트폴리오 가치",
        },
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

export default GrowthChart;
