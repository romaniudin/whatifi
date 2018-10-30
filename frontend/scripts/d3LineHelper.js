let lineCanvas;
let liveData;
const renderGraph = (request,title="") =>
{
    console.log("render request",request);
    const data = [];
    request.map
    (
        option => {if (option.finance.length > 0) data.push(option)}
    );
    console.log("rendering formatted",data);
    if (data==null || data.length == 0) return;

    liveData = data;
    const dataset = formatDataset(data);
    const _data = dataset[0];

    const padding = 50;
    const heightRatio = 0.2;
    const width = 500;
    const height = width*heightRatio;

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

    const canvasRatio = 1.7;
    const canvasWidth = width+padding;
    const canvasHeight = height+2*padding;

    d3.select("#whatifi-line-graph").select("svg").remove();
    lineCanvas = d3.select("#whatifi-line-graph")
        .append("svg")
        .attr("width","100%")
        .attr("height","300px")
        .attr("viewBox",`-${padding} 0 ${canvasWidth} ${canvasHeight}`)
        .append("g")
        .attr("transform",`translate(${padding/2},${padding/2})`);

    lineCanvas.append("text").text(title).attr("y",-10);

    lineCanvas.append("g")
        .attr("id","x-axis")
        .attr("transform",`translate(0,${yScale(0)})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-30)");

    lineCanvas.append("text")
        .attr("id","x-label")
        .attr("x",(width-padding)/2)
        .attr("y",height+padding)
        .attr("text-anchor","middle")
        .text("Date");

    lineCanvas.append("g")
        .attr("id","y-axis")
        .call(d3.axisLeft(yScale));

    lineCanvas.append("text")
        .attr("id","y-label")
        .attr("transform",`rotate(-90)`)
        .attr("y",0-padding)
        .attr("x",0-height/2)
        .attr("text-anchor","middle")
        .text("Income ($)");

    const yTicks = d3.selectAll("#y-axis .tick text");
    yTicks.text
    (
        (d,i) =>
        {
            //return i%2 != yTicks._groups[0].length%2 ? d : "";
            return i%2 == 0 ? d : "";
        }
    );

    const colourScheme = ["green","red","blue","yellow"];
    const allDates = [];
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

            lineCanvas.selectAll("income")
                .data(dataGroup)
                .enter()
                .append("circle")
                .attr("cx",
                    (d) => 
                    {
                        if (allDates.indexOf(d.date) == -1){allDates.push(d.date)}
                        return xScale(d.date);
                    }
                )
                .attr("cy",(d) => yScale(scenarioDisplayMonthly ? d.monthly : d.cummulative))
                .attr("class",d=>`income-${new Date(d.date).toISOString().replace(":","_").replace(":","_").replace(".","_")}`)
                .attr("stroke","grey")
                .attr("stroke-width",1)
                .attr("fill","none")
                .attr("opacity",0)
                .attr("r",3);
        }

    );

    lineCanvas.selectAll(".databoxes")
        .data(allDates)
        .enter()
        .append("rect")
        .attr("class","databoxes")
        .attr("x",(d) => xScale(new Date(d))-2.5)
        .attr("y",-2)
        .attr("fill","black")
        .attr("opacity",0)
        .attr("width",10)
        .attr("height",yScale.range()[0]-2)
        .on("mouseover",
            (d) =>
            {
                const dataPoints = d3.selectAll(`.income-${new Date(d).toISOString().replace(":","_").replace(":","_").replace(".","_")}`);

                const displayedOptions = [];

                dataPoints.attr("opacity",
                    option =>
                    {
                        displayedOptions.push(option);

                        const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
                        const date = new Date(option.date);
                        d3.select("#whatifi-line-graph-information-title h6").text(`${scenarioDisplayMonthly ? "Monthly" : "Cummulative"} Total: ${monthNames[date.getMonth()]} ${date.getFullYear()}`);
                        let data = d3.selectAll("#whatifi-line-graph-information-data")
                            .append("div")
                            .attr("class","row data");
                        data.append("div")
                            .attr("class","col")
                            .text(`${option.option}`);
                        data.append("div")
                            .attr("class","col")
                            .text(`${parseInt(scenarioDisplayMonthly ? option.monthly : option.cummulative)}`);

                        return 1;
                    }
                );

                highlightBestScenario(displayedOptions);
            }
        )
        .on("mouseout",
            (d) =>
            {
                d3.selectAll(`.income-${new Date(d).toISOString().replace(":","_").replace(":","_").replace(".","_")}`).attr("opacity",0);
                d3.selectAll("#whatifi-line-graph-information-data .data").remove();
                d3.select("#whatifi-line-graph-information-title h6").text("Graph Details");
            }
        );

    showLineGraphDisplay();

    showLineGraphDisplay();
    enableLineGraphDetails();
}

const formatDataset = (data) =>
{
    const dataset = [];
    const now = new Date();
    let maxDate,minDate;
    data.map
    (
        (option,group) =>
        {
            const dataGroup = option.finance;
            const localMax = d3.max
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
            );

            const localMin = d3.min
            (
                dataGroup,
                d =>
                {
                    let startDate = new Date(d.start+"-02"); //second day of the month to elim timezone
                    return new Date(startDate.getFullYear(),startDate.getMonth()+1,0);
                }
            );

            maxDate = !maxDate || localMax >= maxDate ? localMax : maxDate;
            minDate = !minDate || localMin <= minDate ? localMin : minDate;
        }
    );

    data.map
    (
        (option,group) =>
        {
            const groupName = option.identifier;
            const dataGroup = option.finance;
            dataset.push([]);
            let total = 0;
            let currentDate = new Date(minDate.getFullYear(),minDate.getMonth()+1,0);//new Date(now.getFullYear(),now.getMonth()+1,0);

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
                dataset[group].push({"option":groupName,"monthly":monthly,"cummulative":total,"date":currentDate});
                currentDate = new Date(minDate.getFullYear(),minDate.getMonth()+1+i,0);
            }
        }
    );

    return dataset;
}

const toggleLineGraphDisplay = () =>
{
    const graph = d3.select(".whatifi-line-graph-detail");
    const visible = graph.style("display") == "block";
    if (visible)
    {
        hideLineGraphDisplay();
    }
    else
    {
        showLineGraphDisplay();
    }
}

const showLineGraphDisplay = () =>
{
    const graph = d3.selectAll(".whatifi-line-graph-detail")
        .style("display","block")
        .style("border-top",`2px solid ${whatifiBlue}`)
        .style("border-bottom",`2px solid ${whatifiBlue}`);

    const button = d3.select("#whatifi-details-button")
        .text("Hide Details")
        .style("color","white");
}

const hideLineGraphDisplay = () =>
{
    const graph = d3.selectAll(".whatifi-line-graph-detail")
        .style("display","none")
        .style("border-top","0px")
        .style("border-bottom","0px");

    const button = d3.select("#whatifi-details-button")
        .text("Expand Details")
        .style("color","white");
}

const enableLineGraphDetails = () =>
{
    const button = d3.select("#whatifi-details-button")
        .attr("onclick","toggleLineGraphDisplay()");
}

const disableLineGraphDetails = () =>
{
    const button = d3.select("#whatifi-details-button")
        .attr("onclick","");
}

