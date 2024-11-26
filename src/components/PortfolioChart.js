import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import styles from "./PortfolioChart.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function PortfolioChart({ data }) {
  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: "평가 금액",
        data: data.values,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
      {
        label: "누적 투자 금액",
        data: data.cumulativeInvestment, // 누적 투자 금액
        fill: false,
        borderColor: "rgb(255, 99, 132)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: "time",
        time: {
          unit: "month",
        },
        title: {
          display: true,
          text: "날짜",
        },
      },
      y: {
        title: {
          display: true,
          text: "금액 (원)",
        },
      },
    },
  };

  return (
    <Line data={chartData} options={options} className={styles.lineChart} />
  );
}

export default PortfolioChart;
