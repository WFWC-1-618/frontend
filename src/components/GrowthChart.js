import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "chartjs-adapter-date-fns"; // 날짜 어댑터

// 데이터 초기화
const dataPoints1 = [];
const dataPoints2 = [];
let prev = 10000;
let prev2 =10000;
for (let i = 0; i < 10000; i++) {
  prev += 5 - Math.random() * 10;
  prev2 += 5 - Math.random() * 10;
  const currentDate = new Date(2012, 0, 1); // 시작 날짜 (2012년 1월 1일)
  currentDate.setMonth(currentDate.getMonth() + i); // 월 단위로 증가
  dataPoints1.push({ x: currentDate, y: prev });
  dataPoints2.push({ x: currentDate, y: prev2 });
}

const GrowthChart = ({ startDate, endDate }) => {
  // 시작 및 종료 날짜에 따라 데이터를 필터링
  const filteredData1 = startDate && endDate
    ? dataPoints1.filter(
        (d) => new Date(d.x) >= new Date(startDate) && new Date(d.x) <= new Date(endDate)
      )
    : [];
  const filteredData2 = startDate && endDate
    ? dataPoints2.filter(
        (d) => new Date(d.x) >= new Date(startDate) && new Date(d.x) <= new Date(endDate)
      )
    : [];

  const chartData = {
    datasets: [
      {
        label: "Sample Portfolio",
        data: filteredData1,
        borderColor: "#F26389",
        borderWidth: 1,
        radius: 0,
      },
      {
        label: "S&P 500 ETF Trust",
        data: filteredData2,
        borderColor: "#3DADF2",
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
    layout: {
      padding: {
        right: 20, // 오른쪽 여백 추가
      },
    },
    scales: {
      x: {
        type: "time", // 날짜 기반 X축
        time: {
          unit: "month", // 월 단위 라벨
          displayFormats: {
            month: "MMM yyyy", // 라벨 형식 (예: Jan 2024)
          },
        },
        title: {
          display: true,
          text: "Date",
        },
        grid: {
          display: false, // 세로선 제거
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 30, // 최대 표시 레이블 수 제한
        },
      },
      y: {
        type:"linear",
        beginAtZero: false,
        suggestedMin:
          Math.min(...filteredData1.map((d) => d.y), ...filteredData2.map((d) => d.y)) - 5,
        suggestedMax:
          Math.max(...filteredData1.map((d) => d.y), ...filteredData2.map((d) => d.y)) + 5,
        title: {
          display: true,
          text: "Portfolio Balance ($)",
        },
        ticks: {
          stepSize: 50,
          callback: (value) => `$${value.toLocaleString()}`, // 통화 형식
        },
      },
    },
  };

  return (
    <div style={{ height: "300px", padding: "0 20px" }}>
      {startDate && endDate ? (
        <Line data={chartData} options={options} />
      ) : (
        <p style={{ textAlign: "center", fontSize: "16px", color: "#888" }}>
          Please select a start date and an end date to view the chart.
        </p>
      )}
    </div>
  );
};

export default GrowthChart;
