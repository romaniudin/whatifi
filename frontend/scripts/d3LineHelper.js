let lineCanvas;
let liveData;
const renderGraph = (data) =>
{
    if (data==null || data.length == 0) return;

    liveData = data;
    const dataset = formatDataset(data);
    const _data = dataset[0];

    const padding = 50;
    const width = 500;
    const height = 300;

    const minY = d3.min(_data,d=> scenarioDisplayMonthly ? d.monthly : d.cummulative);
    const xScale = d3.scaleLinear().domain(d3.extent(_data,d=>d.date)).range([0,width-padding]);
    const yScale = d3.scaleLinear().domain([minY > 0 ? 0 : minY,d3.max(_data,d=> scenarioDisplayMonthly ? d.monthly : d.cummulative)]).range([height,0]).nice();
    const lineGraph = d3.line()
        .x((d)=>{return xScale(d.date);})
        .y((d)=>{return yScale(scenarioDisplayMonthly ? d.monthly : d.cummulative);});

    if (lineCanvas) {d3.select("#line-graph").select("svg").remove();}

    lineCanvas = d3.select("#line-graph")
        .append("svg")
        .attr("viewBox",`-${padding/2} -${padding/2} ${width} ${height+3*padding}`)
        .attr("width","100%")
        .attr("height",`${height*2}px`)
        .append("g")
        .attr("transform",`translate(${padding/2},${padding/2})`);

    lineCanvas.append("g")
        .attr("class","x-axis")
        .attr("transform",`translate(0,${yScale(0)})`)
        .call(d3.axisBottom(xScale));

    lineCanvas.append("text")
        .attr("class","x-label")
        .attr("x",(width-padding)/2)
        .attr("y",height+padding)
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

    const colourScheme = ["green","red","blue","yellow"];
    dataset.map
    (
        (dataGroup,i) =>
        {
            const colour = colourScheme[i%4];
            lineCanvas.append("path")
                .datum(dataGroup)
                .attr("class","line")
                .attr("fill","none")
                .attr("stroke",colour)
                .attr("opacity",0.8)
                .attr("d",lineGraph);

            lineCanvas.selectAll("income-shadow")
                .data(dataGroup)
                .enter()
                .append("circle")
                .attr("cx",(d) => xScale(d.date))
                .attr("cy",(d) => yScale(scenarioDisplayMonthly ? d.monthly : d.cummulative))
                .attr("fill","none")
                .attr("stroke","black")
                .attr("stroke-witdh",2)
                .attr("opacity",0.4)
                .attr("r",2);

            lineCanvas.selectAll("income")
                .data(dataGroup)
                .enter()
                .append("circle")
                .attr("cx",(d) => xScale(d.date))
                .attr("cy",(d) => yScale(scenarioDisplayMonthly ? d.monthly : d.cummulative))
                .attr("fill",colour)
                .attr("stroke","grey")
                .attr("r",2);

        }
    );
}

const formatDataset = (data) =>
{
    const dataset = [];
    data.map
    (
        (dataGroup,group) =>
        {
            dataset.push([]);
            let total = 0;
            for (let i = 0; i < d3.max(dataGroup,d=>d.end); i++)
            {
                let monthly = 0;
                dataGroup.map
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
                            total += (d.value/d.period);
                        }
                    }
                );
                dataset[group].push({"monthly":monthly,"cummulative":total,"date":i});
            }
        }
    );

    return dataset;
}
