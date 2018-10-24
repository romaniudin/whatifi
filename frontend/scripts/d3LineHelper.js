let lineCanvas;
let liveData;
const renderGraph = (request) =>
{
    const data = [];
    request.map
    (
        option => {if (option.length > 0) data.push(option)}
    );
    console.log("rendering",data);
    if (data==null || data.length == 0) return;

    liveData = data;
    const dataset = formatDataset(data);
    const _data = dataset[0];

    const padding = 50;
    const width = 500;
    const height = 300;

    const xScale = d3.scaleLinear().domain(d3.extent(_data,d=>d.date)).range([0,width-padding]);

    const minY = d3.min
    (
        dataset,
        traversePath => 
        {
            return d3.min(traversePath,d=> scenarioDisplayMonthly ? d.monthly : d.cummulative)
        }
    );

    const maxY = d3.max
    (
        dataset,
        traversePath => 
        {
            return d3.max(traversePath,d=> scenarioDisplayMonthly ? d.monthly : d.cummulative)
        }
    );

    const yScale = d3.scaleLinear().domain([minY > 0 ? 0 : minY, maxY < 0 ? 0 : maxY]).range([height,0]).nice();
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
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

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
    const now = new Date();
    data.map
    (
        (dataGroup,group) =>
        {
            dataset.push([]);
            let total = 0;
            let currentDate = new Date(now.getFullYear(),now.getMonth()+1,0);
            let maxDate = d3.max
            (
                dataGroup,
                d =>
                {
                    if (!d.end || d.end == 0 || d.end =="")
                    {
                        return new Date(now.getFullYear()+5,now.getMonth()+1,0);
                    }

                    let endDate = new Date(d.end+"-02"); //second day of the month to elim timezone
                    return new Date(endDate.getFullYear(),endDate.getMonth()+1,0);
                }
            )

            for (let i = 1; currentDate <= maxDate; i++)
            {
                let monthly = 0;
                dataGroup.map
                (
                    (d) =>
                    {
                        let startDate = new Date(d.start+"-02"); //second day of the month to elim timezone
                        startDate = new Date(startDate.getFullYear(),startDate.getMonth()+1,0); 
                        let endDate = new Date(d.end+"-02");
                        endDate = d.end ? new Date(endDate.getFullYear(),endDate.getMonth()+1,0) : null; 

                        if 
                        (
                            (startDate <= currentDate) && 
                            (endDate == null || endDate >= currentDate)
                        )
                        {
                            monthly += (d.value/d.frequency);
                            total += (d.value/d.frequency);
                        }
                    }
                );
                dataset[group].push({"monthly":monthly,"cummulative":total,"date":currentDate});
                currentDate = new Date(now.getFullYear(),now.getMonth()+1+i,0);
            }
        }
    );

    return dataset;
}
