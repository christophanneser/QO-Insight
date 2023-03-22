import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import * as d3 from 'd3';
import useStore from '../../store';
import colors from '../colors.json'


function getColor(disabled_rules, relative_change) {
    if (disabled_rules.length === 0) {
        return '#ff9a00';
    }
    if (relative_change > 0) {
        return colors.greens[Math.min(Math.round(relative_change * 100), 98)]
    } else {
        return colors.reds[Math.min(Math.round(-relative_change * 100), 98)]
    }
}

function Bar({
    data, xScale, yScale, height, t, noRulesMeasure,
}) {
    const ref = useRef(null);
    const store = useStore();

    const barTransition = () => {
        const node = ref.current;
        let q1 = '';
        let q2 = '';
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
            .attr('fill', d => getColor(d.disabled_rules, ((noRulesMeasure - d.value) / noRulesMeasure)))
            .attr('id', (d) => `bar-${d.id}`) // Add a unique ID to each bar element
            .attr('x', (d) => xScale(d.name))
            .attr('y', height)
            .attr('rx', 3) // rounded corners, but adds them also to the bottom...
            .attr('width', xScale.bandwidth())
            .attr('height', 0)

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

        bar
            .on('click', function (d, i) {
                tooltip.html('').style('visibility', 'hidden');
                if (d3.select(this).attr('fill') === 'yellow') {
                    d3.select(this)
                        .attr('fill', d => getColor(d.disabled_rules, ((noRulesMeasure - d.value) / noRulesMeasure)))
                    if (q1 === i.id) {
                        store.setSelectedQueryForTree1('');
                        q1 = '';
                    } else {
                        store.setSelectedQueryForTree2('');
                        q2 = '';
                    }
                } else if (!q1) {
                    d3.select(this)
                        .attr('fill', 'yellow');
                    store.setSelectedQueryForTree1(i.id);
                    q1 = i.id;
                } else if (!q2) {
                    d3.select(this)
                        .attr('fill', 'yellow');
                    store.setSelectedQueryForTree2(i.id);
                    q2 = i.id;
                }
            });

        tooltip
            .on('click', function (d) {
                tooltip.html('').style('visibility', 'hidden');
            })

        bar
            .on('mouseover', (d, i) => {
                tooltip.html(`Median run time: ${i.value}ms ${i.disabled_rules.length ? `<br/><br/>Hint-Set (disabled rules): ${i.disabled_rules.map((r) => `<br/> - ${r}`)}` : ''}`).style('visibility', 'visible');
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
            .attr('fill', (d) => (d.disabled_rules.length ? 'black' : 'blue'))
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
