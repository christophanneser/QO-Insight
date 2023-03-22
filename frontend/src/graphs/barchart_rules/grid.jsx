import React from 'react';
import { axisLeft } from 'd3-axis';
import { select } from 'd3-selection';

const gridlines = ({ yScale, width, ticks }) => axisLeft(yScale)
  .ticks(ticks)
  .tickSize(-width)
  .tickFormat('');

class GridBarchart extends React.Component {
  constructor() {
    super();
    this.ref = React.createRef();
  }

  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  renderAxis() {
    const node = this.ref.current;
    select(node).call(gridlines(this.props));
  }

  render() {
    return (
      <g
        ref={this.ref}
        className="grid-group"
      />
    );
  }
}

export default GridBarchart;
