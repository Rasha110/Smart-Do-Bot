// app/components/ui/card.tsx
"use client";

import React, { HTMLAttributes, ReactNode } from "react";

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={`bg-white rounded-lg shadow-md ${className}`}>{children}</div>;
};

export const CardHeader = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={`px-4 py-2 border-b ${className}`}>{children}</div>;
};


export const CardTitle = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
};

export const CardDescription = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
};

export const CardContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};
