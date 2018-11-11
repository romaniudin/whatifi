const buttonPadding = 23;
const buttonWidth = 100;
const buttonHeight = 25;

const scenarioNameLimit = 15;

let scenarioCanvas;
let scenarioDisplayMonthly = false;

const toggleScenarioDisplay = () =>
{
    scenarioDisplayMonthly = !scenarioDisplayMonthly;
    renderScenarioToggle();
}

const renderScenarioToggle = () =>
{
    d3.select("#scenario-scenario-toggle").text(obtainToggleText());
    renderGraph(currentScenario,"",true);
}

const obtainToggleText = () =>
{
    return `${scenarioDisplayMonthly ? "Monthly" : "Cummulative"}`;
}

const renderScenario = () =>
{
    renderScenarioActions();
    renderScenarioSaved();
}

const renderScenarioActions = () =>
{
    const actions = [];
    //actions.push({"name":"Save Scenario","action":"addScenario","arg":""});
    //actions.push({"name":"Compare Saves","action":"compareSaved","arg":""});
    actions.push({"name":obtainToggleText(),"identifier":"scenario-toggle","action":"toggleScenarioDisplay","arg":"","container":"#whatifi-line-graph-information-title-header"});

    for (const i in actions)
    {
        const action = actions[i];
        const container = d3.select(action.container);
        container.append("div")
            .attr("id",`scenario-${action.identifier.toLowerCase().split(" ").join("_")}`)
            .attr("width","100%")
            .attr("onclick",`${action.action}()`)
            .attr("align","middle")
            .style("border","1px lightgrey solid")
            .style("border-radius","5px")
            .style("opacity",0.8)
            .style("background",whatifiOrange)
            .style("color","white")
            .text(action.name)
    }
/*
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
*/
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
