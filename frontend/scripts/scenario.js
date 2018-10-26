const allScenario = {};
let currentScenario;

const addScenario = () =>
{
    if (currentTraverse && currentTraverse.length > 0)
    {
        if (Object.keys(allScenario).length >= 5) {return toast("Max scenarios saved")}

        const scenarioId = currentTraverse.join(":");
        if (allScenario[scenarioId] == null)
        {
            toast("Scenario added");
            const scenario =
            {
                "name":`Scenario ${Object.keys(allScenario).length+1}`,
                "arg":scenarioId,
                "scenario":currentTraverse,
                "action":"loadScenario"
            };
            allScenario[scenarioId] = scenario;

            createScenarioButtons("scenario-bar-saves-buttons",[scenario],"scenario-save",Object.keys(allScenario).length-1);
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
    allScenario[scenario]["scenario"].map
    (
        (nodeId) =>
        {
            selectNode(nodeId);
        }
    );
    startReverseTraverse(allScenario[scenario]["scenario"][0]);
}

const obtainScenarioFinances = (scenario) =>
{
    const finances = [];
    scenario.map
    (
        (nodeId) =>
        {
            const finance = nodes[nodeId]["finance"];
            if (finance) finances.push(finance);
        }
    )
    return finances;
}

const compareScenario = () =>
{
    if (allScenario.length <= 1) return;
    const compare = [];

    for (const scenario in allScenario)
    {
        if (scenario == "Whatifi-Saved-Scenario-Header") continue;
        const finances = obtainScenarioFinances(allScenario[scenario]["scenario"]);
        if (finances.length > 0) compare.push(finances);
    }

    currentScenario = compare;
    renderGraph(compare);
}
