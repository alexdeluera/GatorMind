"use client";

import dynamic from "next/dynamic";
// If not using Next.js, you can: import Plot from "react-plotly.js";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Dashboard() {
  const labels = [
    "Hair", // 0
    "Eyes", // 1
    "Skin", // 2
    "Clothes", // 3
    "Background", // 4
    "Smile", // 5
  ];

  const source = [0, 1, 2, 0, 3, 3];
  const target = [1, 2, 4, 3, 2, 5];
  const value =  [120, 80, 20, 40, 25, 30];

  return (
    <section style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Analytics, charts, and summaries.</p>

      <div style={{ height: 420 }}>
        <Plot
          data={[
            {
              type: "sankey",
              orientation: "h",
              node: {
                pad: 16,
                thickness: 16,
                line: { color: "#555", width: 1 },
                label: labels,
              },
              link: { source, target, value },
            },
          ]}
          layout={{
            margin: { l: 10, r: 10, t: 10, b: 10 },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            font: { family: "Inter, system-ui, sans-serif" },
          }}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler
          config={{ displayModeBar: false, responsive: true }}
        />
      </div>
    </section>
  );
}
