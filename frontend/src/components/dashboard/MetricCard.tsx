
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: bigint | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
}) => {
  return (
    <Card hover elevation={1}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-[#06B6D4]/20 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-[#06B6D4]/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">{icon}</div>
              </div>
            )}
            <div>
              <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 mt-1 font-light">{subtitle}</p>}
            </div>
          </div>
          {trend && (
            <div className={`text-sm font-medium ${trend.isPositive ? "text-primary" : "text-red-500"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-light text-foreground tracking-tight">
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
};

