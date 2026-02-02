"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}

export default function AnimatedNumber({
    value,
    duration = 1000,
    prefix = "",
    suffix = "",
    decimals = 0,
    className = "",
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setDisplayValue(value * easeOutQuart);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    const formattedValue = displayValue.toFixed(decimals);

    return (
        <span className={`inline-block animate-number-pop ${className}`}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
}
