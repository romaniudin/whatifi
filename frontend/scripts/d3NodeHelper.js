const nodeDistance = 150;
const nodeCanvasHeight = 500;
let balancedNodes;
let svg,nodeCanvas;

const nodeBorderColour = "steelblue";
const nodeShadowColour = "black";
const nodeHighlightedColour = "gainsboro";
const nodeTraversedBorderColour = "gainsboro";
const nodeSelectedBorderColour = "black";

const linkUnhighlightedColour = "none";
const linkHighlightedColour = "gainsboro";
const linkTraversedColour = "black";

const render = () =>
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

    createCanvas(xRange,yRange);

    const linkPlacements = nodeCanvas.selectAll("link")
        .data(allLinks)
        .enter()
        .append("g");

    const nodePlacements = nodeCanvas.selectAll("node")
        .data(allNodes)
        .enter()
        .append("g")
        .attr("id",(d) => {return `${d.nodeId}-element`})
        .attr("oncontextmenu",(d) => {return `toggleSelectNode("${d.nodeId}")`})
        .attr("transform",(d)=>{return `translate (${(d.level+0.5)*nodeDistance},${d.x})`});

    createNodeShadowElements(nodePlacements);

    createLinkElements(linkPlacements);
    createNodeElements(nodePlacements);
    createNodeAddOverlay("node-graph-viewbox");
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
                    const transformEvent = d3.event.transform;
/*
                    const bound = d3.select("#node-graph").node().getBoundingClientRect();
                    const xDiff = bound.width > (xLength + 2*nodeDistance)*transformEvent.k ? 0 : (xLength + 2*nodeDistance) - bound.width;
                    const yDiff = bound.height > (yLength + 2*nodeDistance)*transformEvent.k ? 0 : (yLength + 2*nodeDistance) - bound.height;


                    const validZoom = (xDiff > 0 && yDiff > 0);

                    if (!validZoom)
                    {
                        transformEvent.k = lastValidZoom;
                        return;
                    }
                    else
                    {
                        lastValidZoom = transformEvent.k;
                    }

                    if (transformEvent.x > xDiff) transformEvent.x = xDiff;
                    if (transformEvent.x < -xDiff) transformEvent.x = -xDiff;
                    if (transformEvent.y > yDiff) transformEvent.y = yDiff;
                    if (transformEvent.y <- yDiff) transformEvent.y = -yDiff;
*/
                    nodeCanvas.attr("transform",transformEvent);
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

const balanceNodes = (allNodes,node) =>
{
    while(!(allNodes.length > node.level))
    {
        allNodes.push([]);
    }

    allNodes[node.level].push(node);

    const levelLength = allNodes[node.level].length;
    let start = levelLength % 2 == 1 ? parseInt(levelLength/2)*nodeDistance : (levelLength/2-1)*nodeDistance+nodeDistance/2;

    allNodes[node.level].map
    (
        (node) =>
        {
            node.x = start;
            start -= nodeDistance;
        }
    );
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

const createNodeElements = (node) =>
{
    node.append("circle")
        .attr("class","main-node")
        .attr("r",40)
        .attr("fill","white")
        .attr("stroke",nodeBorderColour)
        .attr("stroke-width",4)
        .attr("onclick",(d) => {return `startReverseTraverse("${d.nodeId}")`});

    node.append("circle")
        .attr("class","img-node")
        .attr("r",15)
        .attr("fill","grey")
        .attr("stroke",nodeBorderColour)
        .attr("stroke-width",4)
        .attr("cx","30")
        .attr("cy","-30");
        //.on("click",(d) => {nodeOverlayAdd(d)});

    node.append("circle")
        .attr("r",8)
        .attr("fill",nodeBorderColour)
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
        .attr("opacity",(d)=>{if (d.type=="group") return 0.25;else return 0;})
        .attr("onclick",(d) => {if (d.type=="group") return `nodeOverlayAdd("${d.nodeId}")`;else return ""});
/*
    const dummyText = node.append("text")
        .text(d=>d.nodeName)
        .attr("id","dummy-text")
        .attr("text-anchor","middle")
        .attr("y",5);

    console.log(d3.selectAll("#dummy-text"));

    dummyText.remove();
*/
    node.append("text")
        .text(d=>d.nodeName)
        .attr("text-anchor","middle")
        .attr("y",5);
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

const removeNodeAddOverlay = () =>
{
    d3.select("#node-add-overlay div").remove();
}

const createNodeAddOverlay = (containerId) =>
{
    removeNodeAddOverlay();

    d3.select("#node-graph")
        .append("div") 
        .attr("id","node-add-overlay")
        .attr("class", "tooltip")               
        .style("position", "absolute")               
        .style("background", "lightgrey")               
        .style("opacity", 0)
        .style("padding", "0 10px 0 10px")
        .style("border","2px solid darkgrey")
        .style("border-radius","5px")
        .style("left","10px")
        .style("top","10px")
        .append("div");
}

const submitNewNode = (parentNodeId) =>
{
    const nodeName = document.getElementById("add-node-name-input").value;
    const nodeValue = document.getElementById("add-node-value-input").value;
    const nodePeriod = document.getElementById("add-node-period-input").value;
    const nodeStart = document.getElementById("add-node-start-input").value;
    const nodeEnd = document.getElementById("add-node-end-input").value;

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
    if (!nodePeriod || nodePeriod == "" || nodePeriod < 0)
    {
        valid &= false;
        toast("Please enter period, must be > 0");
    }
    if (!nodeStart || nodeStart == "" || nodeStart < 0)
    {
        valid &= false;
        toast("Please enter start date, must be > 0");
    }
    if (!nodeEnd || nodeEnd == "" || nodeEnd < 0 || nodeStart > nodeEnd)
    {
        valid &= false;
        toast("Please enter end date, must be (>0) and (>=start date)");
    }

    if (valid)
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
                    "period":nodePeriod,
                }
            }
        );
    }
}

const nodeOverlayAdd = (nodeId) =>
{
    removeNodeAddOverlay();

    const node = nodes[nodeId];
    d3.select("#node-add-overlay div").remove();
    const div = d3.select("#node-add-overlay")
        .style("opacity",0.95)
        .append("div");

    div.append("h5").text(`Group: ${node.nodeName}`);

    div.append("div")
        .text("Node name:")
        .append("input")
        .attr("id","add-node-name-input")
        .attr("type","text");

    div.append("div")
        .text("Value:")
        .append("input")
        .attr("id","add-node-value-input")
        .attr("type","number");

    div.append("div")
        .text("Period (Month):")
        .append("input")
        .attr("id","add-node-period-input")
        .attr("type","number");

    div.append("div")
        .text("Start Date:")
        .append("input")
        .attr("id","add-node-start-input")
        .attr("type","number");
        //.attr("type","date");

    div.append("div")
        .text("End Date:")
        .append("input")
        .attr("id","add-node-end-input")
        .attr("type","number");
        //.attr("type","date");

    const buttons = div.append("div");

    buttons.append("div")
        .attr("id","add-node-submit-input")
        .attr("align","middle")
        .style("margin","5px")
        .style("background","white")
        .style("border","2px darkgrey solid")
        .style("border-radius","5px")
        .text("Add Node")
        .on
        (
            "click",
            () =>
            {
                submitNewNode(nodeId);
            }
        );

    buttons.append("div")
        .attr("id","add-node-cancel-input")
        .attr("align","middle")
        .style("margin","5px")
        .style("background","white")
        .style("border","2px darkgrey solid")
        .style("border-radius","5px")
        .on
        (
            "click",
            () =>
            {
                removeNodeAddOverlay();
            }
        )
        .text("Cancel");
}
