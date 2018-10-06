let lineCanvas;

const renderGraph = (data) =>
{
    if (data==null) return;
    const _data = [];
    for (let i = 0; i < d3.max(data,d=>d.end); i++)
    {
        let monthly = 0;
        data.map
        (
            (d) =>
            {
                if 
                (
                    d &&
                    (d.start == null || d.start <= i) && 
                    (d.end == null || d.end >= i)
                )
                {
                    monthly += (d.value/d.period);
                }
            }
        );
        _data.push({"value":monthly,"date":i});
    }

    const padding = 50;
    const width = 800;
    const height = 500;

    const minY = d3.min(_data,d=>d.value);
    const xScale = d3.scaleLinear().domain(d3.extent(_data,d=>d.date)).range([0,width-padding]);
    const yScale = d3.scaleLinear().domain([minY > 0 ? 0 : minY,d3.max(_data,d=>d.value)]).range([height,0]).nice();
    const lineGraph = d3.line()
        .x((d)=>{return xScale(d.date);})
        .y((d)=>{return yScale(d.value);});

    if (lineCanvas) {d3.select("#line-graph").select("svg").remove();}

    lineCanvas = d3.select("#line-graph")
        .append("svg")
        .attr("viewBox",`-${padding/2} -${padding/2} ${width} ${height+2*padding}`)
        .attr("width","100%")
        .attr("height",`${height}px`)
        .append("g")
        .attr("transform",`translate(${padding/2},${padding/2})`);

    lineCanvas.append("g")
        .attr("class","x-axis")
        .attr("transform",`translate(0,${yScale(0)})`)
        .call(d3.axisBottom(xScale));

    lineCanvas.append("text")
        .attr("class","x-label")
        .attr("transform",`translate(${width/2},${height+padding})`)
        .attr("text-anchor","middle")
        .text("Date")

    lineCanvas.append("g")
        .attr("class","y axis")
        .call(d3.axisLeft(yScale));

    lineCanvas.append("text")
        .attr("class","y-label")
        .attr("transform",`rotate(-90)`)
        .attr("y",0-padding)
        .attr("x",0-height/2)
        .attr("text-anchor","middle")
        .text("Income ($)")

    lineCanvas.append("path")
        .datum(_data)
        .attr("class","line")
        .attr("stroke","black")
        .attr("fill","transparent")
        .attr("d",lineGraph);

    lineCanvas.selectAll(".income")
        .data(_data)
        .enter()
        .append("circle")
        .attr("cx",(d) => xScale(d.date))
        .attr("cy",(d) => yScale(d.value))
        .attr("fill","white")
        .attr("stroke","black")
        .attr("r",2);
}
