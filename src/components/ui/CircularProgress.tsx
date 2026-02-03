"use client";

import { useEffect, useState } from "react";

interface CircularProgressProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
    label?: string;
    gradientId?: string;
    className?: string;
}

export default function CircularProgress({
    percentage,
    size = 120,
    strokeWidth = 8,
    showLabel = true,
    label,
    gradientId = "gradient-progress",
    className = "",
}: CircularProgressProps) {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (animatedPercentage / 100) * circumference;
    const center = size / 2;

    useEffect(() => {
        // Animate the percentage on mount
        const timer = setTimeout(() => {
            setAnimatedPercentage(Math.min(100, Math.max(0, percentage)));
        }, 100);

        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg
                width={size}
                height={size}
                className="circular-progress"
            >
                {/* Gradient definition */}
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="50%" stopColor="#764ba2" />
                        <stop offset="100%" stopColor="#11998e" />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    className="opacity-30"
                />

                {/* Progress arc */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: "stroke-dashoffset 1s ease-out",
                    }}
                />
            </svg>

            {/* Center label */}
            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold gradient-text">
                        {Math.round(animatedPercentage)}%
                    </span>
                    {label && (
                        <span className="text-xs text-muted mt-0.5">{label}</span>
                    )}
                </div>
            )}
        </div>
    );
}
