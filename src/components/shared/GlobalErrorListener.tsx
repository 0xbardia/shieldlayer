"use client";

import { useEffect } from "react";

export function GlobalErrorListener() {
  useEffect(() => {
    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error("[GlobalError]", event.error);
      // In production, send to monitoring service
      if (process.env.NODE_ENV === "production") {
        // Example: sendErrorToMonitoring(event.error);
      }
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[UnhandledRejection]", event.reason);
      // In production, send to monitoring service
      if (process.env.NODE_ENV === "production") {
        // Example: sendErrorToMonitoring(event.reason);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
