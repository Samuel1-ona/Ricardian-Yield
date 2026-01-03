import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  elevation?: 1 | 2 | 3 | 4 | 5;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = false, 
  elevation = 1,
  ...props 
}) => {
  const elevationClasses = {
    1: "elevation-1",
    2: "elevation-2",
    3: "elevation-3",
    4: "elevation-4",
    5: "elevation-5",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border-0 p-6 h-full flex flex-col transition-material",
        elevationClasses[elevation],
        hover && "hover:elevation-3 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={cn("mb-6", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => {
  return (
    <h3 className={cn("text-lg font-medium text-foreground leading-tight", className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => {
  return (
    <p className={cn("text-sm text-gray-600 mt-2 leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={cn("flex-1", className)} {...props}>
      {children}
    </div>
  );
};

