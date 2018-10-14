const buttonPadding = 23;
const buttonWidth = 100;
const buttonHeight = 25;

const scenarioNameLimit = 15;

const allScenario = {};

let scenarioCanvas;

const addScenario = () =>
{
    if (currentTraverse && currentTraverse.length > 0)
    {
        const scenarioId = currentTraverse.join(":");
        if (allScenario[scenarioId] == null)
        {
            toast("Scenario added");
            allScenario[scenarioId] = 
            {
                "name":`Scenario ${Object.keys(allScenario).length}`,
                "arg":scenarioId,
                "scenario":currentTraverse,
                "action":"loadScenario"
            };

            renderScenarioButtons();
        }
        else
        {
            toast("Scenario already exists");
        }
    }
    else
    {
        toast("No current scenario");
    }
}

const loadScenario = (scenario) =>
{
    console.log("sce",scenario);
    allScenario[scenario]["scenario"].map
    (
        (nodeId) =>
        {
            selectNode(nodeId);
        }
    );
    startReverseTraverse(allScenario[scenario]["scenario"][0]);
}

const renderScenarioButtons = () =>
{
    scenarioCanvas.selectAll("#scenario-viewbox g").remove();

    const scenarios = [];
    for (const scenario in allScenario)
    {
        scenarios.push(allScenario[scenario]);
    }

    const scenarioButtons = scenarioCanvas.selectAll("scenario")
        .data(scenarios)
        .enter()
        .append("g")
        .attr("id",d=>{return `scenario-${d.name.toLowerCase().replace(" ","_")}`})
        .attr("onclick",d=>`${d.action}("${d.arg}")`);

    createScenarioButtons(scenarioButtons);
}

const renderScenario = () =>
{
    scenarioCanvas = d3.select("#scenario-bar")
        .append("svg")
        .attr("width","100%")
        .attr("height","70px")
        .append("g")
        .attr("id","scenario-viewbox")
        .attr("viewBox","0 0 200 200");

    allScenario["SaveScenario"] = {"name":"Save Scenario","action":"addScenario","arg":""};

    renderScenarioButtons();
}

const createScenarioButtons = (scenarios) =>
{
    scenarios.append("rect")
        .attr("fill","none")
        .attr("stroke","black")
        .attr("stroke-width",6)
        .attr("opacity",0.25)
        .attr("width",`${buttonWidth}px`)
        .attr("height",`${buttonHeight}px`)
        .attr("rx",10)
        .attr("ry",10)
        .attr("x",(d,i) => i*(buttonPadding+buttonWidth)+buttonPadding)
        .attr("y",buttonPadding);

    scenarios.append("rect")
        .attr("fill","white")
        .attr("stroke","steelblue")
        .attr("stroke-width",3)
        .attr("width",`${buttonWidth}px`)
        .attr("height",`${buttonHeight}px`)
        .attr("rx",10)
        .attr("ry",10)
        .attr("x",(d,i) => i*(buttonPadding+buttonWidth)+buttonPadding)
        .attr("y",buttonPadding);

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
        .attr("x",(d,i) => i*(buttonPadding+buttonWidth)+buttonPadding+buttonWidth/2)
        .attr("y",buttonPadding+buttonHeight/2+4.5);
}
