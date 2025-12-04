"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CountdownTimerProps {
  expiresAt: Date | string;
  onExpired?: () => void;
}

export function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);

  useEffect(() => {
    const expireTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const total = expireTime - now;

    setTotalTime(total);
    setTimeLeft(total);

    const interval = setInterval(() => {
      const remaining = expireTime - Date.now();

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        onExpired?.();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const progress =
    totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const isWarning = minutes < 5 && timeLeft > 0;
  const isExpired = timeLeft <= 0;

  return (
    <Card
      className={`${isWarning ? "border-amber-500" : ""} ${
        isExpired ? "border-red-500" : ""
      }`}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isExpired ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock
                  className={`h-5 w-5 ${
                    isWarning ? "text-amber-500" : "text-blue-500"
                  }`}
                />
              )}
              <span className="font-medium">
                {isExpired ? "Mã QR đã hết hạn" : "Thời gian còn lại"}
              </span>
            </div>

            {!isExpired && (
              <div
                className={`text-2xl font-bold tabular-nums ${
                  isWarning ? "text-amber-500" : "text-blue-600"
                }`}
              >
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </div>
            )}
          </div>

          <Progress
            value={isExpired ? 100 : progress}
            className={`h-2 ${isWarning ? "[&>div]:bg-amber-500" : ""} ${
              isExpired ? "[&>div]:bg-red-500" : ""
            }`}
          />

          {isWarning && !isExpired && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Mã QR sắp hết hạn, vui lòng hoàn tất thanh toán
            </p>
          )}

          {isExpired && (
            <p className="text-sm text-red-600">
              Vui lòng tạo lại mã QR để tiếp tục thanh toán
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
