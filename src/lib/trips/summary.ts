import { countDays } from "@/lib/trips/dates";
import type { TripSummary } from "@/lib/trips/types";

export type TripStats = {
  /** 아직 끝나지 않은 여행(진행 중 포함) */
  upcomingCount: number;
  /** 종료일이 지난 여행 */
  pastCount: number;
  placeCount: number;
};

export function summarizeTrips(trips: TripSummary[], today: string): TripStats {
  return {
    upcomingCount: trips.filter((t) => t.endDate >= today).length,
    pastCount: trips.filter((t) => t.endDate < today).length,
    placeCount: trips.reduce((n, t) => n + t.placeCount, 0),
  };
}

/** 아직 끝나지 않은 여행 중 가장 먼저 시작하는 것. 진행 중인 여행이 있으면 그게 된다. */
export function findNextTrip(
  trips: TripSummary[],
  today: string,
): TripSummary | null {
  return (
    trips
      .filter((t) => t.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null
  );
}

/**
 * 다가오는 여행 카드의 상태.
 * before: 시작일 당일까지. daysLeft 는 시작일까지 남은 날(D-N, 당일은 0 = D-DAY).
 * during: 둘째 날부터 여행 중. dayNumber 는 오늘이 몇 일차인지(2 이상).
 */
export type TripCountdown =
  { kind: "before"; daysLeft: number } | { kind: "during"; dayNumber: number };

export function tripCountdown(trip: TripSummary, today: string): TripCountdown {
  if (today <= trip.startDate) {
    return { kind: "before", daysLeft: countDays(today, trip.startDate) - 1 };
  }
  return { kind: "during", dayNumber: countDays(trip.startDate, today) };
}

/** "3박 4일", 하루면 "당일치기". */
export function formatNights(trip: TripSummary): string {
  const days = countDays(trip.startDate, trip.endDate);
  return days === 1 ? "당일치기" : `${days - 1}박 ${days}일`;
}
