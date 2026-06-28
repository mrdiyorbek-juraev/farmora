"use client";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

// Renders only when the root layout itself throws, so it must provide its
// own <html>/<body> and cannot rely on the app's global CSS or providers.
// Keep it dependency-free and inline-styled.
const GlobalError = ({ error, reset }: GlobalErrorProps) => (
  <html lang="en">
    <body
      style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        background: "#0a0a0a",
        color: "#fafafa",
      }}
    >
      <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            cursor: "pointer",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            background: "#fafafa",
            color: "#0a0a0a",
          }}
          type="button"
        >
          Try again
        </button>
        {error.digest ? (
          <p style={{ fontSize: 12, opacity: 0.4, marginTop: 16 }}>
            Error ID: {error.digest}
          </p>
        ) : null}
      </div>
    </body>
  </html>
);

export default GlobalError;
