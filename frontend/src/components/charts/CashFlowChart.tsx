
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CashFlowData {
  period: number;
  rent: number;
  expenses: number;
  distributable: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  const formatTooltipValue = (value: number) => {
    return formatCurrency(BigInt(value * 10 ** 18));
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="period"
          label={{ value: "Period", position: "insideBottom", offset: -5 }}
          stroke="#6B7280"
        />
        <YAxis
          label={{ value: "Amount (USDC)", angle: -90, position: "insideLeft" }}
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
        <Line
          type="monotone"
          dataKey="rent"
          stroke="#10B981"
          strokeWidth={2}
          name="Rent Collected"
          dot={{ fill: "#10B981", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#EF4444"
          strokeWidth={2}
          name="Expenses"
          dot={{ fill: "#EF4444", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="distributable"
          stroke="#059669"
          strokeWidth={2}
          name="Distributable"
          dot={{ fill: "#059669", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

