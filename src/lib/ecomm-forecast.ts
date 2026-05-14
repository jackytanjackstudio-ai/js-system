export interface ChannelForecast {
  channelKey:       string;
  channelName:      string;
  platform:         string;
  target2026:       number;
  ytdActual:        number;
  ytdTarget:        number;
  ytdGrowth:        number;
  fullYearForecast: number;
  forecastVsTarget: number;
  status:           "on-track" | "caution" | "behind";
  monthlyActuals:   number[];
  monthlyForecast:  number[];
  monthly2025:      number[];
}

interface Channel {
  channelKey: string;
  channelName: string;
  platform:   string;
  target2026: number;
}

export function buildForecast(
  channel: Channel,
  actuals2026: number[],
  actuals2025: number[],
): ChannelForecast {
  const currentMonth = new Date().getMonth(); // 0-indexed
  const monthsDone = actuals2026.filter((v, i) => i <= currentMonth && v > 0).length;

  const ytdActual  = actuals2026.slice(0, monthsDone).reduce((s, v) => s + v, 0);
  const ytd2025    = actuals2025.slice(0, monthsDone).reduce((s, v) => s + v, 0);
  const remain2025 = actuals2025.slice(monthsDone).reduce((s, v) => s + v, 0);
  const ytdGrowth  = ytd2025 > 0 ? (ytdActual - ytd2025) / ytd2025 : 0.5;

  let remainGrowthRate: number;
  if (channel.channelKey === "tiktok_js") {
    remainGrowthRate = 0.30;
  } else if (ytdGrowth < -0.20) {
    remainGrowthRate = Math.max(ytdGrowth, -0.30);
  } else if (ytdGrowth > 0.30) {
    remainGrowthRate = ytdGrowth * 0.75;
  } else {
    remainGrowthRate = ytdGrowth;
  }

  const monthlyForecast = [...actuals2026];
  let forecastRemaining: number;

  if (channel.channelKey === "tiktok_js") {
    const monthGrowthRates = [0,0,0,0, 0.40,0.40, 0.30,0.30,0.30, 0.25,0.25,0.25];
    for (let i = monthsDone; i < 12; i++) {
      monthlyForecast[i] = Math.round(actuals2025[i] * (1 + monthGrowthRates[i]));
    }
    forecastRemaining = monthlyForecast.slice(monthsDone).reduce((s, v) => s + v, 0);
  } else {
    forecastRemaining = remain2025 * (1 + remainGrowthRate);
    for (let i = monthsDone; i < 12; i++) {
      monthlyForecast[i] = Math.round(actuals2025[i] * (1 + remainGrowthRate));
    }
  }

  const fullYearForecast = ytdActual + forecastRemaining;
  const forecastVsTarget = channel.target2026 > 0
    ? (fullYearForecast / channel.target2026) * 100 : 0;
  const ytdTarget = channel.target2026 * (monthsDone / 12);

  const status: "on-track" | "caution" | "behind" =
    forecastVsTarget >= 95 ? "on-track" :
    forecastVsTarget >= 70 ? "caution"  : "behind";

  return {
    channelKey:       channel.channelKey,
    channelName:      channel.channelName,
    platform:         channel.platform,
    target2026:       channel.target2026,
    ytdActual,
    ytdTarget,
    ytdGrowth:        ytdGrowth * 100,
    fullYearForecast: Math.round(fullYearForecast),
    forecastVsTarget: Math.round(forecastVsTarget * 10) / 10,
    status,
    monthlyActuals:  actuals2026,
    monthlyForecast,
    monthly2025:     actuals2025,
  };
}
