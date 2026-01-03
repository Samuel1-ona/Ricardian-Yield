"use client";

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
    <Card hover>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">{title}</h3>
              {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
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
        <p className="text-3xl font-bold text-foreground">
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
};

