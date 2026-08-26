// The last thing between a bug and a blank screen.
//
// React unmounts the whole tree when a render throws. Without a boundary, one
// bad value anywhere — a null where an array was expected, a date that will
// not parse — takes the entire app down to a white page with nothing on it.
//
// Where that actually matters here: a client halfway through a session, at
// somebody's house, with no idea what happened and no way to get back. So the
// fallback does the two things that help in that moment — it says plainly that
// the app broke and not them, and it offers a way back in. It never blames the
// person and it never pretends the failure did not happen.
//
// It also cannot itself be complicated: a fallback with a bug in it is a blank
// screen with extra steps. Inline styles, no imports beyond React, no data.

import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Goes to the browser console, which is where it can be read from a phone
    // over a cable or from the Vercel logs after the fact. Nothing is sent
    // anywhere — an error report is client data too.
    console.error("Unhandled error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error?.message || this.state.error || "");

    return (
      <div style={{
        minHeight: "100vh", background: "#0d0d0d", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "Inter, system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#d4af37", textTransform: "uppercase", fontWeight: 700 }}>
            Physical Definition
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "14px 0 0" }}>
            Something in the app broke.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#aaa", marginTop: 12 }}>
            This is a fault in the app, not something you did. Anything already
            saved is safe — sets are written as you finish them, not at the end.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              width: "100%", marginTop: 20, padding: "13px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#d4af37,#f0d060)", color: "#000",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>
            Reload the app
          </button>
          <div style={{ fontSize: 11, color: "#555", marginTop: 16, lineHeight: 1.6, wordBreak: "break-word" }}>
            If it keeps happening, send your trainer this line: {message || "unknown error"}
          </div>
        </div>
      </div>
    );
  }
}
