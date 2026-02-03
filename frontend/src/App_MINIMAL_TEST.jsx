import { useState } from "react";

const App = () => {
  console.log("🟢 MINIMAL APP LOADED");
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(to bottom right, #1e293b, #0f172a)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
        ✅ APP IS WORKING
      </h1>
      <p style={{ fontSize: "24px", marginBottom: "20px" }}>Count: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: "20px 40px",
          fontSize: "18px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
        }}
      >
        Click Me
      </button>
    </div>
  );
};

export default App;
