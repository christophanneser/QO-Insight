import React from 'react';
import Axis from '../barchart_query/axis';

function XYAxis({
  xScale, yScale, height, ticks, t, queryPaths
}) {
  const xSettings = {
    scale: xScale,
    orient: 'bottom',
    transform: `translate(0, ${height})`,
    t,
    queryPaths,
  };
  const ySettings = {
    scale: yScale,
    orient: 'left',
    transform: 'translate(0, 0)',
    ticks,
    t,
  };
  return (
    <g className="axis-group">
      <Axis {...xSettings} />
      <Axis {...ySettings} />
    </g>
  );
}

export default XYAxis;
