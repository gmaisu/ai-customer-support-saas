"use client";

/**
 * Last-resort error boundary. Triggered when the root layout itself throws
 * (e.g., theme provider error, malformed metadata). Re-implements <html>
 * + <body> because Next.js bypasses the root layout when this fires.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[global-error.tsx]", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          padding: "4rem 1rem",
          background: "#f8fafc",
          color: "#0f172a",
          textAlign: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Helpforge crashed</h1>
          <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
            The app couldn&apos;t recover. Please reload the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: "#7c3aed",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
