"use client";

import { useEffect } from "react";

export function TripReadySignal() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("trip-page-ready"));
  }, []);
  return null;
}
