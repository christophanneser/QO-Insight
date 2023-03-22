import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import * as d3 from 'd3';
import useStore from '../../store';
import colors from "../colors.json";

function Bar({
  data, xScale, yScale, height, t, barIdMapping
}) {
  const ref = useRef(null);
  const store = useStore();

  const barTransition = () => {
    const node = ref.current;
    // prepare the field
    const bar = select(node)
      .selectAll('.bar')
      .data(data);

    // add rect to svg
    bar
      .enter()
      .append('rect')
      .merge(bar)
      .attr('class', 'bar')
      .attr('id', (d) => `bar-${d.query_id}`) // Add a unique ID to each bar element
      .attr('x', (d) => xScale(d.query_id))
      .attr('y', height)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', d => colors.greens[Math.floor(d.best_score.config.score*100)]);

    bar
      .exit()
      .transition(t)
      .attr('y', height)
      .attr('height', 0)
      .remove();

    bar
      .transition(t)
      .attr('x', (d) => xScale(d.query_id))
      .attr('y', (d) => yScale(d.best_score.config.score*100))
      .attr('height', (d) => height - yScale(d.best_score.config.score*100));

    bar
      .on('click', function (d, i) {
        tooltip.html('').style('visibility', 'hidden');
        store.setQuery(i.query_id)
        store.setMode('query')
      });

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'hidden')
      .style('padding', '15px')
      .style('background', 'rgba(0,0,0,0.6)')
      .style('border-radius', '5px')
      .style('color', '#fff')
      .text('a simple tooltip');

    bar
      .on('mouseover', (d, i) => {
        tooltip.html(`Query: ${barIdMapping[i.query_id]}<br/>Improvement: ${Math.round(i.best_score.config.score * 100)}% ${i.best_score.config.disabled_rules.length ? `<br/><br/>Hint-Set (disabled rules): ${i.best_score.config.disabled_rules.map((r) => `<br/> - ${r}`)}` : ''}`).style('visibility', 'visible');
      })
      .on('mousemove', (d) => {
        tooltip
          .style('top', `${d.pageY - 10 - tooltip.node().getBoundingClientRect().height}px`)
          .style('left', `${d.pageX - 120}px`);
      })
      .on('mouseout', () => {
        tooltip.html('').style('visibility', 'hidden');
      });
  };



  // write a js script that takes only benc-ch/name from strings like 'asd/qwe/benc-ch/name.sql'



  useEffect(() => {
    const node = ref.current;

    const bar = select(node)
      .selectAll('.bar')
      .data(data);

    // add rect to svg
    bar
      .enter()
      .append('rect')
      .merge(bar)
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.queryId))
      .attr('y', height)
      .attr('width', xScale.bandwidth());

    bar
      .exit()
      .transition(t)
      .attr('y', height)
      .attr('height', 0)
      .remove();

    barTransition();
  }, [data]);

  return (
    <g
      className="bar-group"
      ref={ref}
    />
  );
}
export default Bar;
