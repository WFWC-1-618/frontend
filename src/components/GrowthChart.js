import React from "react";
import { Line } from "react-chartjs-2";

function GrowthChart({ growthData, spyGrowthData }) {
  const data = {
    labels: growthData.map((point) => point.date),
    datasets: [
      {
        label: "샘플 포트폴리오",
        data: growthData.map((point) => point.value),
        borderColor: "blue",
        fill: false,
      },
      {
        label: "SPY",
        data: spyGrowthData.map((point) => point.value),
        borderColor: "red",
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: "날짜",
        },
      },
      y: {
        title: {
          display: true,
          text: "가치",
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default GrowthChart;
