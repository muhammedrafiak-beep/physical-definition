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
        minHeight: "100vh", background: "#F3F6FA", color: "#0E2035",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "'Public Sans', ui-sans-serif, system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ fontSize: 11, letterSpacing: ".09em", color: "#5C6D84", textTransform: "uppercase", fontWeight: 600 }}>
            Physical Definition
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 27, fontWeight: 400, lineHeight: 1.15, margin: "12px 0 0" }}>
            Something in the app broke.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#5C6D84", marginTop: 12 }}>
            This is a fault in the app, not something you did. Anything already
            saved is safe — sets are written as you finish them, not at the end.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              width: "100%", marginTop: 22, minHeight: 52, borderRadius: 12, border: "none",
              background: "linear-gradient(180deg,#16304F,#0E2035)", color: "#FCFCFD",
              fontWeight: 600, fontSize: 15, cursor: "pointer",
            }}>
            Reload the app
          </button>
          <div style={{ fontSize: 11.5, color: "#93A2B7", marginTop: 16, lineHeight: 1.6, wordBreak: "break-word" }}>
            If it keeps happening, send your trainer this line: {message || "unknown error"}
          </div>
        </div>
      </div>
    );
  }
}
