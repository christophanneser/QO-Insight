import React, { useState, useEffect } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { transition } from 'd3-transition';
import XYAxis from './xy-axis';
import Grid from './grid';
import Bar from './bar';
import useStore from '../../store';
function Barchart({ data, parentRef }) {
  const store = useStore();
  const [width, setWidth] = useState(parentRef.current.offsetWidth - 100);

  const margin = {
    top: 20,
    right: 20,
    bottom: 60,
    left: 60,
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
    .domain(data.map((d) => d.benchmark_name))
    .range([0, width])
    .padding(0.26);

  const yScale = scaleLinear()
    .domain([0, Math.max(...data.map((d) => d.benchmarkScore * 100))])
    .range([height, 0])
    .nice();

  useEffect(() => {
  }, [width, height, data]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <XYAxis {...{
            xScale, yScale, height, ticks, t,
          }}
          />
          <Grid {...{
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
          />
          <text
            x={width / 2}
            y={height + margin.bottom - 20}
            style={{
              textAnchor: 'middle',
              fontSize: '18px',
            }}
          >
            Workload
          </text>
          <text
            x={-height / 2}
            y={-margin.left + 10}
            dy='1em'
            style={{
              textAnchor: 'middle',
              transform: 'rotate(-90deg)',
              fontSize: '18px',
            }}
          >
            {store.labelBarchart}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default Barchart;
