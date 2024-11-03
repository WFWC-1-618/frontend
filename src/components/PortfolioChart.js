import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

function PortfolioChart({ data }) {
  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: '포트폴리오 가치',
        data: data.values,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month', // x축을 월 단위로 설정
        },
        title: {
          display: true,
          text: '날짜',
        },
      },
      y: {
        title: {
          display: true,
          text: '금액 (원)',
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

export default PortfolioChart;
