const allScenario = {};

const addScenario = () =>
{
    if (currentTraverse && currentTraverse.length > 0)
    {
        const scenarioId = currentTraverse.join(":");
        if (allScenario[scenarioId] == null)
        {
            toast("Scenario added");
            const scenario =
            {
                "name":`Scenario ${Object.keys(allScenario).length}`,
                "arg":scenarioId,
                "scenario":currentTraverse,
                "action":"loadScenario"
            };
            allScenario[scenarioId] = scenario;

            createScenarioButtons("scenario-bar-saves",[scenario],"scenario-save",Object.keys(allScenario).length-1);
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

const compareScenario = () =>
{
    if (allScenario.length <= 1) return;
    const compare = [];

    for (const scenario in allScenario)
    {
        if (scenario == "Whatifi-Saved-Scenario-Header") continue;

        const finances = [];
        allScenario[scenario]["scenario"].map
        (
            (nodeId) =>
            {
                const finance = nodes[nodeId]["finance"];
                if (finance) finances.push(finance);
            }
        )
        compare.push
        (
            finances
        );
    }

    renderGraph(compare);
}
