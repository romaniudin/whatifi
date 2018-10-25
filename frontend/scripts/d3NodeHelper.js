const nodeDistance = 150;
const nodeCanvasHeight = 500;
let balancedNodes;
let svg,nodeCanvas;

//const nodeBorderColour = "steelblue";
const nodeShadowColour = "black";
const nodeHighlightedColour = "gainsboro";
const nodeTraversedBorderColour = "gainsboro";
const nodeSelectedBorderColour = "black";

const linkUnhighlightedColour = "none";
const linkHighlightedColour = "gainsboro";
const linkTraversedColour = "black";

const tooltipMinLength = 0;
const tooltipTransitionDelay = 200;

const render = (newCanvas=true) =>
{
    let allNodes = [];
    for (const nodeId in nodes)
    {
        allNodes.push(nodes[nodeId]);
    }
    allNodes = allNodes.sort(compareNodeLevels);

    balancedNodes = [];
    allNodes.map(node=>balanceNodes(balancedNodes,node));
    const range = d3.extent(allNodes,(node) => node.x);
    const shift = range[1] - range[0];
    allNodes.map
    (
        (node) =>
        {
            node.x += nodeCanvasHeight/2;
        }
    );
    const yRange = d3.extent(allNodes, node => node.x);
    const xRange = d3.extent(allNodes, node => (node.level+0.5)*nodeDistance);

    const allLinks = generateLinks(nodes);

    if (newCanvas)
    {
        createCanvas(xRange,yRange);
    }
    else
    {
        d3.selectAll("#node-graph-viewbox g").remove();
    }

    const linkPlacements = nodeCanvas.selectAll("link")
        .data(allLinks)
        .enter()
        .append("g");

    const nodePlacements = nodeCanvas.selectAll("node")
        .data(allNodes)
        .enter()
        .append("g")
        .attr("id",(d) => {return `${d.nodeId}-element`})
        //.attr("oncontextmenu",(d) => {return `toggleSelectNode("${d.nodeId}")`})
        .attr("transform",(d)=>{return `translate (${(d.level+0.5)*nodeDistance},${d.x})`});

    createNodeShadowElements(nodePlacements);

    createLinkElements(linkPlacements);
    createNodeElements(nodePlacements);
    createNodeOverlay("node-graph-viewbox");
}

let lastValidZoom = 1;
const createCanvas = (xRange,yRange) =>
{
    const xLength = xRange[1] - xRange[0];
    const yLength = yRange[1] - yRange[0];
    if (svg)
    {
        clearCanvas(svg);
    }
    else
    {
        svg = d3.select("#node-graph")
            .append("svg")
            .attr("width","100%")
            .attr("height",`${nodeCanvasHeight}px`);
    }

    nodeCanvas = svg.append("g")
        .attr("id","node-graph-viewbox")
        .attr("viewBox","0 0 100 100");

    svg.call
    (
        d3.zoom()
            .scaleExtent([.1,4])
            .on
            (
                "zoom",
                () =>
                {
                    nodeCanvas.attr("transform",d3.event.transform);
                }
            )
    );
}

const clearCanvas = (canvas) =>
{
    canvas.selectAll("g").remove();
}

const compareNodeLevels = (a,b) =>
{
    if (a.level == b.level) return 0;

    return a.level > b.level ? 1 : 0;
}

const balanceLevel = (allNodes) =>
{
    const levelLength = allNodes.length;
    let start = levelLength % 2 == 1 ? parseInt(levelLength/2)*nodeDistance : (levelLength/2-1)*nodeDistance+nodeDistance/2;

    allNodes.map
    (
        (node) =>
        {
            node.x = start;
            start -= nodeDistance;
            /*console.log(allNodes,node);

            d3.selectAll(`#${node.nodeName}`)
                .each((d,i)=>console.log(d,i));*/
        }
    );
}

const balanceNodes = (allNodes,node) =>
{
    while(!(allNodes.length > node.level))
    {
        allNodes.push([]);
    }

    allNodes[node.level].push(node);

    balanceLevel(allNodes[node.level]);
}

const generateLinks = (balancedNodes) =>
{
    const allLinks = [];

    for (const nodeId in balancedNodes)
    {
        const node = balancedNodes[nodeId];

        for (const i in node["childrenNodes"])
        {
            const childNode = balancedNodes[node["childrenNodes"][i]];
            const link = {};

            link["from"] = node.nodeId;
            link["to"] = childNode.nodeId;
            link["x1"] = node.x;
            link["y1"] = (node.level+0.5)*nodeDistance;
            link["x2"] = childNode.x;
            link["y2"] = (childNode.level+0.5)*nodeDistance;
            allLinks.push(link);
        }
    }

    return allLinks;
}

const renderNodeSelection = (nodeId) =>
{
    const node = nodes[nodeId];
    d3.select(`#node-graph svg #node-graph-viewbox #${nodeId}-element .img-node`)
        .attr("stroke", node.selected ? nodeSelectedBorderColour : nodeBorderColour);
}

const renderNodeHighlight = (nodeId) =>
{
    const node = nodes[nodeId];
    d3.select(`#node-graph svg #node-graph-viewbox #${nodeId}-element .main-node`)
        .attr("fill", node.highlighted ? nodeHighlightedColour : "white");
}

const renderLinkTraverse = (fromNodeId,toNodeId) =>
{
    const inner = d3.selectAll(`#node-graph svg #node-graph-viewbox g line#from_${fromNodeId}_to_${toNodeId}_inner`)
        .attr("stroke","steelblue")
        .attr("opacity",0.8);
}

const removeAllLinkTraverse = () =>
{
    d3.selectAll(".link-inner")
        .attr("opacity",0.25);
}

const updateNodeSelected = (nodeId,selected) =>
{
    const selectLevel = nodes[nodeId].level;
    if (balancedNodes.length > 0)
    {
        balancedNodes[selectLevel].map
        (
            (node) =>
            {
                if (node.nodeId != nodeId)
                {
                    node.selected = false
                    renderNodeSelection(node.nodeId,false);
                }
            }
        )
    }

    renderNodeSelection(nodeId,selected);
}

const onClickAction = (nodeId) =>
{
    console.log("click",nodeId,event);
    return generateNodeMenu(nodeId);
    const node = nodes[nodeId];
    if (node.type == "group")
    {
        compareChildNodes(node.nodeId);
    }
    else if (node.type == "me")
    {
        startForwardTraverse(node.nodeId);
    }
    else
    {
        startReverseTraverse(node.nodeId);
    }
}

const onContextMenu = (nodeId) =>
{
    const node = nodes[nodeId];
    console.log("context",nodeId,node);
    if (node.type == "group")
    {
        nodeOverlayDetails(node.nodeId);
    }
    else if (node.type == "me")
    {
        nodeOverlayPersonalDetails(node.nodeId);
    }
    else
    {
        nodeOverlayDetails(node.nodeId);
    }
}

const createNodeElements = (node) =>
{
    node.append("circle")
        .attr("class","main-node")
        .attr("r",40)
        .attr("fill",d => nodeBackgroundColour(d))
        .attr("stroke",d => nodeBorderColour(d))
        .attr("stroke-width",4)
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`})
        //.attr("oncontext",(d) => {return `startReverseTraverse("${d.nodeId}")`});
        .attr("oncontextmenu",(d) => {return `onContextMenu("${d.nodeId}")`});

    node.append("circle")
        .attr("class","img-node")
        .attr("r",15)
        .attr("fill",d => nodeImageBackgroundColour(d))
        .attr("stroke",d => nodeImageBorderColour(d))
        .attr("stroke-width",4)
        .attr("cx","30")
        .attr("cy","-30")
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`})
        .attr("oncontextmenu",(d) => {return `onContextMenu("${d.nodeId}")`});
        //.on("click",(d) => {nodeOverlayAdd(d)});

    node.append("circle")
        .attr("r",8)
        .attr("fill","steelblue")
        .attr("cx",`${nodeDistance/2}`)
        .attr("opacity",(d)=>{if (d.type=="group") return 1;else return 0;});

    const plusThickness = 2;
    const plusHeight = 8;
    node.append("rect")
        .attr("fill","white")
        .attr("stroke","white")
        .attr("stroke-width",2)
        .attr("width",plusThickness)
        .attr("height",plusHeight)
        .attr("x",`${nodeDistance/2-plusThickness/2}`)
        .attr("y",`-${plusHeight/2}`)
        .attr("opacity",(d)=>{if (d.type=="group") return 1;else return 0;});

    node.append("rect")
        .attr("fill","white")
        .attr("stroke","white")
        .attr("stroke-width",2)
        .attr("width",plusHeight)
        .attr("height",plusThickness)
        .attr("x",`${nodeDistance/2-plusHeight/2}`)
        .attr("y",`-${plusThickness/2}`)
        .attr("opacity",(d)=>{if (d.type=="group") return 1;else return 0;});

    node.append("circle")
        .attr("class","add-node")
        .attr("r",8)
        .attr("fill","white")
        .attr("cx",`${nodeDistance/2}`)
        .attr("opacity",(d)=>{if (d.type=="group") return 0;else return 0;})
        .attr("onclick",(d) => {if (d.type=="group") return `nodeOverlayAdd("${d.nodeId}")`;else return ""});

    node.append("text")
        .text(d=>d.nodeName)
        .attr("class","node-name")
        .attr("text-anchor","middle")
        .attr("y",5)
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`})
        .attr("oncontextmenu",(d) => {return `onContextMenu("${d.nodeId}")`});
}

const createNodeShadowElements = (node) =>
{
    node.append("circle")
        .attr("class","main-node-shadow")
        .attr("r",40)
        .attr("fill","black")
        .attr("opacity",0.25)
        .attr("stroke","black")
        .attr("stroke-width",5)
        .attr("cx","2")
        .attr("cy","2");

    node.append("circle")
        .attr("class","img-node-shadow")
        .attr("r",15)
        .attr("fill","black")
        .attr("opacity",0.25)
        .attr("stroke","black")
        .attr("stroke-width",5)
        .attr("cx","32")
        .attr("cy","-28");

    node.append("circle")
        .attr("class","add-node-shadow")
        .attr("r",8)
        .attr("fill","black")
        .attr("cx",`${nodeDistance/2+1}`)
        .attr("cy",1)
        .attr("opacity",(d)=>{if (d.type=="group") return 0.25;else return 0;});
}

const createLinkElements = (link) =>
{
    link.append("line")
        .attr("id",d => `from_${d.from}_to_${d.to}_inner`)
        .attr("class","link-inner")
        .attr("stroke","steelblue")
        .attr("stroke-width",4)
        .attr("opacity",0.25)
        .attr("x1",(d) => {return d.y1;})
        .attr("y1",(d) => {return d.x1;})
        .attr("x2",(d) => {return d.y2;})
        .attr("y2",(d) => {return d.x2;});
}

const verifyNodeDetails = (nodeName,nodeValue,nodeFrequency,nodeStart,nodeEnd) =>
{
    let valid = true;

    if (!nodeName || nodeName == "")
    {
        valid &= false;
        toast("Please enter node name");
    }
    if (!nodeValue || nodeValue == "")
    {
        valid &= false;
        toast("Please enter value");
    }
    if (!nodeFrequency || nodeFrequency == "" || nodeFrequency <= 0)
    {
        valid &= false;
        toast("Please enter a frequency (>=0)");
    }
    if (!nodeStart || nodeStart == "" || nodeStart < 0)
    {
        valid &= false;
        toast("Please enter a start date");
    }
    if (nodeEnd && (nodeStart > nodeEnd))
    {
        valid &= false;
        toast("Please enter a end date (>=start date)");
    }

    console.log("verified details",valid,nodeName,nodeValue,nodeFrequency,nodeStart,nodeEnd);

    return valid;
}

const submitNewNode = (parentNodeId) =>
{
    const nodeName = document.getElementById("add-node-name-input").value;
    const nodeValue = document.getElementById("add-node-value-input").value;
    const nodeFrequency = document.getElementById("add-node-frequency-input").value;
    const nodeStart = document.getElementById("add-node-start-input").value;
    const nodeEnd = document.getElementById("add-node-end-input").value;

    if (verifyNodeDetails(nodeName,nodeValue,nodeFrequency,nodeStart,nodeEnd))
    {
        addNewNodeTo
        (
            parentNodeId,
            nodeName,
            "income",
            {
                "finance":
                {
                    "value":nodeValue,
                    "start":nodeStart,
                    "end":nodeEnd,
                    "frequency":nodeFrequency,
                }
            }
        );
        removeNodeOverlay();
    }
}

