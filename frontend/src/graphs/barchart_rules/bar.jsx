import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import * as d3 from 'd3';
import useStore from '../../store';
import colors from "../colors.json";


function Bar({
    data, xScale, yScale, height, t, max,
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
            .attr('id', (d) => `bar-${d.name}`) // Add a unique ID to each bar element
            .attr('x', (d) => xScale("Q-" + d.name))
            .attr('y', height)
            .attr('rx', 3) // rounded corners, but adds them also to the bottom...
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => colors.greens[Math.trunc(d.value * 100)])

        bar
            .exit()
            .transition(t)
            .attr('y', height)
            .attr('height', 0)
            .remove();

        bar
            .transition(t)
            .attr('x', (d) => xScale(d.name))
            .attr('y', (d) => yScale(d.value))
            .attr('height', (d) => height - yScale(d.value));

        bar
            .on('click', function (d, i) {
                tooltip.html('').style('visibility', 'hidden');
                store.setQuery(i.name)
                store.setSelectedQueryForTree1(i.default_config_id);
                store.setSelectedQueryForTree2(i.config_id);
            });

        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'd3-tooltip')
            .style('position', 'absolute')
            .style('z-index', '10')
            .style('visibility', 'hidden')
            .style('padding', '15px')
            .style('background', 'rgba(0,0,0,0.9)')
            .style('border-radius', '5px')
            .style('color', '#fff')
            .text('a simple tooltip');

        tooltip
            .on('click', function (d) {
                tooltip.html('').style('visibility', 'hidden');
            })

        // The tooltip
        // <br/>Measurement median: ${i.value}ms<br/>Measurement IO: ${i.measurement_io}<br/>Measurement rows: ${i.measurement_rows}<br/>Measurement tmp spills: ${i.measurement_tmp_spills}
        bar
            .on('mouseover', (d, i) => {
                tooltip.html(`Benchmark: ${i.benchmark_name}<br/>Query: ${i.query_path}`).style('visibility', 'visible');
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
            .attr('x', (d) => xScale(d.name))
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
