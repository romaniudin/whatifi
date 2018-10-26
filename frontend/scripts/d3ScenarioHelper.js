const buttonPadding = 23;
const buttonWidth = 100;
const buttonHeight = 25;

const scenarioNameLimit = 15;

let scenarioCanvas;
let scenarioDisplayMonthly = true;

const toggleScenarioDisplay = () =>
{
    scenarioDisplayMonthly = !scenarioDisplayMonthly;
    d3.select("#scenario-show_monthly text").text(scenarioDisplayMonthly ? "Show Monthly" : "Show Total");
    renderGraph(currentScenario);
}

const renderScenario = () =>
{
    renderScenarioActions();
    renderScenarioSaved();
}

const renderScenarioActions = () =>
{
    const actions = [];
    actions.push({"name":"Save Scenario","action":"addScenario","arg":""});
    actions.push({"name":"Compare","action":"compareScenario","arg":""});
    actions.push({"name":"Show Monthly","action":"toggleScenarioDisplay","arg":""});

    d3.select("#scenario-bar-actions").remove();

    const actionBar = d3.select("#scenario-bar")
        .append("svg")
        .attr("width","100%")
        .attr("height",`${buttonHeight+buttonPadding}px`)
        .attr("id","scenario-bar-actions");

    actionBar.append("rect")
        .attr("fill","gainsboro")
        .attr("stroke","grey")
        .attr("stroke-width",4)
        .attr("opacity",0.25)
        .attr("height","100%")
        .attr("width",`${buttonWidth+2*buttonPadding}`);

    createScenarioButtons("scenario-bar-actions",[{"name":"Actions","action":null,"arg":""}],"scenario-action");
    
    actionBar.append("svg")
        .attr("id","scenario-bar-actions-buttons")
        .attr("x",`${buttonWidth+2*buttonPadding}`)
        .attr("height",buttonHeight+2*buttonPadding);

    createScenarioButtons("scenario-bar-actions-buttons",actions,"scenario-action");
}

const renderScenarioSaved = () =>
{
    d3.select("#scenario-bar-saves").remove();

    const savedScenarioBar = d3.select("#scenario-bar")
        .append("svg")
        .attr("width","100%")
        .attr("height",`${buttonHeight+buttonPadding}px`)
        .attr("id","scenario-bar-saves");

    savedScenarioBar.append("rect")
        .attr("fill","gainsboro")
        .attr("stroke","grey")
        .attr("stroke-width",4)
        .attr("opacity",0.25)
        .attr("height","100%")
        .attr("width",`${buttonWidth+2*buttonPadding}`);

    createScenarioButtons("scenario-bar-saves",[{"name":"Saved Scenarios","action":null,"arg":""}],"scenario-action");
    
    savedScenarioBar.append("svg")
        .attr("id","scenario-bar-saves-buttons")
        .attr("x",`${buttonWidth+2*buttonPadding}`)
        .attr("height",buttonHeight+2*buttonPadding);

    const scenarios = [];
    for (const scenario in allScenario)
    {
        scenarios.push(allScenario[scenario]);
    }
    createScenarioButtons("scenario-bar-saves-buttons",scenarios,"scenario-save");
}

const createScrollButton = () =>
{
    d3.select("#scenario-bar")
        .append("svg")
        .attr("height",`${buttonHeight+buttonPadding}px`)
        .attr("width","20px")
        .append("g")
        .append("rect")
        .attr("height","10px")
        .attr("width","10px")
        .attr("fill","black");

}

const createScenarioButtons = (holder,data,buttonType,offset=0) =>
{
    const buttonOffset = offset*(buttonWidth+buttonPadding);

    const scenarios = d3.select(`#${holder}`)
        .selectAll(buttonType)
        .data(data)
        .enter()
        .append("g")
        .attr("id",d=>{return `scenario-${d.name.toLowerCase().replace(" ","_")}`})
        .attr
        (
            "onclick",
            (d) =>
            {
                if (d.action != null)
                {
                    return `${d.action}("${d.arg}")`;
                }
                else
                {
                    return "";
                }
            }
        );

    scenarios.append("rect")
        .attr("fill",d => {if (d.action == null) {return "none"}else {return "black"}})
        .attr("stroke",d => {if (d.action == null) {return "none"}else {return "black"}})
        .attr("stroke-width",3)
        .attr("opacity",0.25)
        .attr("width",`${buttonWidth}px`)
        .attr("height",`${buttonHeight}px`)
        .attr("rx",5)
        .attr("ry",5)
        .attr("x",(d,i) => i*(buttonPadding+buttonWidth)+buttonPadding+2+buttonOffset)
        .attr("y",buttonPadding/2+2);

    scenarios.append("rect")
        .attr("fill",d => {if (d.action == null) {return "none"}else {return "white"}})
        .attr("stroke",d => {if (d.action == null) {return "none"}else {return "steelblue"}})
        .attr("stroke-width",3)
        .attr("width",`${buttonWidth}px`)
        .attr("height",`${buttonHeight}px`)
        .attr("rx",5)
        .attr("ry",5)
        .attr("x",(d,i) => i*(buttonPadding+buttonWidth)+buttonPadding+buttonOffset)
        .attr("y",buttonPadding/2);

    scenarios.append("text")
        .text
        (
            d =>
            {
                let buttonText = d.name;
                if (buttonText.length > scenarioNameLimit)
                {
                    buttonText = buttonText.slice(0,9) + "...";
                }
                return buttonText;
            }
        )
        .attr("text-anchor","middle")
        .attr("x",(d,i) => i*(buttonPadding+buttonWidth)+buttonPadding+buttonWidth/2+buttonOffset)
        .attr("y",buttonPadding/2+buttonHeight/2+4.5);
}
