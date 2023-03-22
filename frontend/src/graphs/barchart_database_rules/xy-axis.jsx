import React from 'react';
import Axis from '../barchart_database_rules/axis';

function XYAxis({
  xScale, yScale, height, ticks, t,
}) {
  const xSettings = {
    scale: xScale,
    orient: 'bottom',
    transform: `translate(0, ${height}) `,
    t,
    label: 'X Axis Label', // add label property for x axis
    rotate: -45 // add rotate prop to rotate the x-axis label
  };
  const ySettings = {
    scale: yScale,
    orient: 'left',
    transform: 'translate(0, 0)',
    ticks,
    t,
    label: 'Y Axis Label', // add label property for y axis
  };

  return (
    <g className="axis-group">
      <Axis {...xSettings} />
      <Axis {...ySettings} />
    </g>
  );
}

export default XYAxis;
