import { useEffect, useState } from "react";

interface CountdownTimerProps {
  serverTargetTime: number; // Server-calculated timestamp in milliseconds
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ serverTargetTime }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(serverTargetTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(serverTargetTime));
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on unmount
  }, [serverTargetTime]);

  function calculateTimeLeft(targetTime: number) {
    const now = new Date().getTime();
    const difference = targetTime - now;

    return {
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return (
    <div className="flex justify-center gap-6 mt-6 text-2xl font-semibold text-red-600">
      <div>
        <span>{String(timeLeft.hours).padStart(2, "0")}</span>
        <p className="text-sm text-gray-600">Hours</p>
      </div>
      <span>:</span>
      <div>
        <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
        <p className="text-sm text-gray-600">Minutes</p>
      </div>
      <span>:</span>
      <div>
        <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
        <p className="text-sm text-gray-600">Seconds</p>
      </div>
    </div>
  );
};

export default CountdownTimer;
