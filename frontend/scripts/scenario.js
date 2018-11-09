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

const compareSaved = () =>
{
    if (allScenario.length <= 1) return;
    const compare = [];

    for (const scenario in allScenario)
    {
        if (scenario == "Whatifi-Saved-Scenario-Header") continue;
        const finances = obtainScenarioFinances(allScenario[scenario]["scenario"]);
        if (finances.length > 0)
        {
            const name = allScenario[scenario]["name"];
            const nodes = allScenario[scenario]["scenario"];
            compare.push
            (
                {
                    "identifier":name,
                    "finance":finances,
                    "nodes":nodes
                }
            );
        }
    }

    currentScenario = compare;
    renderGraph(compare);
}

const bestScenario = (options,monthly=true) =>
{
    if (options.length == 1) return options[0];

    options.sort
    (
        (a,b) =>
        {
            const aVal = scenarioDisplayMonthly && monthly ? a.monthly : a.cummulative;
            const bVal = scenarioDisplayMonthly && monthly ? b.monthly : b.cummulative;

            if (aVal == bVal) return 0;

            return aVal < bVal ? 1 : -1;
        }
    )

    let best;
    currentScenario.map
    (
        scenario =>
        {
            if (scenario.identifier == options[0].identifier) {best = scenario}
        }
    );

    return best;
}

let currentBest;
const highlightBestScenario = (options) =>
{
    if (options.length < 2 || !options) return;
    const toHighlight = bestScenario(options).nodes;
    unhighlightAllNodes();
    toHighlight.map
    (
        nodeId =>
        {
            highlightNode(nodeId);
        }
    )
    currentBest = toHighlight;
}
