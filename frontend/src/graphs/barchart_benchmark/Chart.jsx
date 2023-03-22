import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const Chart = ({ data }) => {
    const chartRef = useRef()

    useEffect(() => {
        const margin = { top: 20, right: 20, bottom: 30, left: 40 }
        const width = 960 - margin.left - margin.right
        const height = 500 - margin.top - margin.bottom

        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.1)

        const y = d3.scaleLinear()
            .range([height, 0])

        const xAxis = d3.axisBottom(x)

        const yAxis = d3.axisLeft(y)

        x.domain(data.map(d => d.query_id))
        y.domain([0, d3.max(data, d => d.measurement_mean_min || d.measurement_mean_zero)])

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis)

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis)

        const barGroups = svg.selectAll('.bar-group')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('transform', d => `translate(${x(d.query_id)}, 0)`)

        barGroups.append('rect')
            .attr('class', 'bar-min')
            .attr('y', d => y(d.measurement_mean_min || 0))
            .attr('height', d => height - y(d.measurement_mean_min || 0))
            .attr('width', x.bandwidth() / 2)

        barGroups.append('rect')
            .attr('class', 'bar-zero')
            .attr('y', d => y(d.measurement_mean_zero || 0))
            .attr('height', d => height - y(d.measurement_mean_zero || 0))
            .attr('width', x.bandwidth() / 2)
            .attr('transform', `translate(${x.bandwidth() / 2}, 0)`)

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom)
            .attr('text-anchor', 'middle')
            .text('Query ID')

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .attr('text-anchor', 'middle')
            .text('Measurement Mean')
    }, [data])

    return (
        <div ref={chartRef} />
    )
}

export default Chart