import React, { useState, useEffect } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { transition } from 'd3-transition';
import XYAxis from './xy-axis';
import Bar from './bar';
import { Grid } from '@mui/material';
import useStore from "../../store";

function Barchart({ data, parentRef, style }) {
  const store = useStore()
  const [width, setWidth] = useState(parentRef.current.offsetWidth - 100);
  //const [height, setHeight] = useState(parentRef.current.offsetHeight);
  const margin = {
    top: 10,
    right: 10,
    bottom: 40,
    left: 60,
  };
  const ticks = 10;
  const t = transition().duration(500);

  const height = (parentRef.current.offsetHeight - margin.top - margin.bottom - 100) * 0.4;

  useEffect(() => {
    setWidth(parentRef.current.offsetWidth - 100);
    //setHeight(Math.min(parentRef.current.offsetHeight, 400));
    const handleResize = () => {
      setWidth(parentRef.current.offsetWidth - 100);
      //setHeight(parentRef.current.offsetHeight);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [parentRef.current.offsetWidth]);

  const xScale = scaleBand()
    .domain(data.map((d) => d.id))
    .range([0, width])
    .padding(0.26);

  const yScale = scaleLinear()
    .domain([0, Math.max(...data.map((d) => d.value * 100))])
    .range([height, 0])
    .nice();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg
        // preserveAspectRatio={"xMinYMin meet"}
        // viewBox={"0 0 5000 1000"}
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {data && <XYAxis {...{
            xScale, yScale, height, ticks, t,
          }}
          />}
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
            max={Math.max(...data.map((d) => d.value * 100))}
          />
          <text
            x={width / 2}
            y={height + margin.bottom - 5}
            style={{
              textAnchor: 'middle',
              fontSize: '18px',
            }}
          >
            Disabled Rules
          </text>
          <text
            x={-height / 2}
            y={-margin.left - 3}
            dy='1em'
            style={{
              textAnchor: 'middle',
              transform: 'rotate(-90deg)',
              fontSize: '18px',
            }}
          >
            {store.labelBarchart} (Best Case)
          </text>
        </g>
      </svg>
    </div>
  );
}

export default Barchart;
