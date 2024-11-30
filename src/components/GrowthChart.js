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
} from "chart.js";

// Chart.js에서 사용되는 요소 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GrowthChart = ({ growthData }) => {
  if (!growthData || growthData.length === 0) {
    return <p>데이터가 없습니다.</p>;
  }

  // X축(날짜)과 Y축(가치) 데이터 준비
  const labels = growthData.map((data) => data.date); // YYYY-MM
  const values = growthData.map((data) => data.value); // 월별 포트폴리오 가치

  // Chart.js 데이터 및 옵션 설정
  const chartData = {
    labels, // X축 레이블
    datasets: [
      {
        label: "Portfolio Growth", // 데이터셋 이름
        data: values, // Y축 값
        borderColor: "rgba(75, 192, 192, 1)", // 선 색상
        backgroundColor: "rgba(75, 192, 192, 0.2)", // 배경 색상
        tension: 0.3, // 선의 곡률
      },
    ],
  };

  const options = {
    responsive: true, // 반응형
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Portfolio Growth Over Time",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date (YYYY-MM)", // X축 제목
        },
      },
      y: {
        title: {
          display: true,
          text: "Portfolio Value", // Y축 제목
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default GrowthChart;
