import React, { useState, useEffect } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { transition } from 'd3-transition';
import XYAxis from './xy-axis';
import GridBarchart from './grid';
import Bar from './bar';

function Barchart({ data, parentRef }) {
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [width, setWidth] = useState(parentRef.current.offsetWidth - 100);
  const margin = {
    top: 10,
    right: 10,
    bottom: 50,
    left: 50,
  };
  const ticks = 10;
  const t = transition().duration(500);

  const height = (parentRef.current.offsetHeight - margin.top - margin.bottom - 100) * 0.4;

  useEffect(() => {
    setWidth(parentRef.current.offsetWidth - 100);
    const handleResize = () => setWidth(parentRef.current.offsetWidth - 100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [parentRef.current.offsetWidth]);

  const xScale = scaleBand()
    .domain(data.map((d) => d.name))
    .range([0, width])
    .padding(0.26);

  const yScale = scaleLinear()
    .domain([0, Math.max(...data.map((d) => d.value))])
    .range([height, 0])
    .nice();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <text
            x={-height / 2}
            y={-margin.left - 5}
            dy="1em"
            style={{
              textAnchor: "middle",
              transform: "rotate(-90deg)",
              fontSize: "18px",
            }}
          >
            Median Run Time [ms]
          </text>
        </g>

        <g transform={`translate(${margin.left}, ${height + margin.top})`}>
          <text
            x={width / 2}
            y={margin.bottom - 8}
            style={{
              textAnchor: "middle",
              fontSize: "18px",
            }}
          >
            Query Plans
          </text>
        </g>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <XYAxis {...{
            xScale, yScale, height, ticks, t,
          }}
          />
          <GridBarchart {...{
            xScale, yScale, width, ticks, t,
          }}
          />
          <Bar
            {...{
              xScale,
              yScale,
              data,
              height,
              t,
            }}
            q1={q1}
            q2={q2}
            setQ1={setQ1}
            setQ2={setQ2}
            max={Math.max(...data.map((d) => d.value))}
            noRulesMeasure={data.filter(d => d.disabled_rules.length === 0)[0].value}
          />
        </g>
      </svg>
    </div>
  );
}

export default Barchart;
