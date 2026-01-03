"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface YieldData {
  period: number;
  rentalYield: number;
  defiYield: number;
  total: number;
}

interface YieldChartProps {
  data: YieldData[];
}

export const YieldChart: React.FC<YieldChartProps> = ({ data }) => {
  const formatTooltipValue = (value: number) => {
    return formatCurrency(BigInt(value * 10 ** 18));
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="period"
          label={{ value: "Period", position: "insideBottom", offset: -5 }}
          stroke="#6B7280"
        />
        <YAxis
          label={{ value: "Yield (USDC)", angle: -90, position: "insideLeft" }}
          stroke="#6B7280"
        />
        <Tooltip
          formatter={(value: number | undefined) => value !== undefined ? formatTooltipValue(value) : ""}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #10B981",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="rentalYield" fill="#10B981" name="Rental Yield" />
        <Bar dataKey="defiYield" fill="#059669" name="DeFi Yield" />
      </BarChart>
    </ResponsiveContainer>
  );
};

