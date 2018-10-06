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
    const nodeGraph = d3.forceSimulation()
        .force("link",d3.forceLink().id(d => d.nodeId));

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
        .attr("onclick",(d) => {return `startReverseTraverse("${d.nodeId}")`})
        .attr("oncontextmenu",(d) => {return `toggleSelectNode("${d.nodeId}")`})
        .attr("transform",(d)=>{return `translate (${(d.level+0.5)*nodeDistance},${d.x})`});

    createNodeShadowElements(nodePlacements);

    createLinkElements(linkPlacements);
    createNodeElements(nodePlacements);
}

let lastValidZoom = 1;
const createCanvas = (xRange,yRange) =>
{
    console.log(xRange,yRange);
    console.log(d3.select("#node-graph"));
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

    const imgNode = d3.select(`#node-graph svg #node-graph-viewbox #${nodeId}-element .img-node`);
    imgNode.attr("stroke", node.selected ? nodeSelectedBorderColour : nodeBorderColour);
}

const renderNodeHighlight = (nodeId) =>
{
    const node = nodes[nodeId];
    const element = d3.select(`#node-graph svg #node-graph-viewbox #${nodeId}-element .main-node`);
    element.attr("fill", node.highlighted ? nodeHighlightedColour : "white");
}

const renderLinkTraverse = (fromNodeId,toNodeId) =>
{
    const outer = d3.selectAll(`#node-graph svg #node-graph-viewbox g line#from_${fromNodeId}_to_${toNodeId}_outer`).attr("stroke",linkTraversedColour);

    const inner = d3.selectAll(`#node-graph svg #node-graph-viewbox g line#from_${fromNodeId}_to_${toNodeId}_inner`)
    .attr("stroke","steelblue")
    .attr("opacity",0.8);
}

const removeAllLinkTraverse = () =>
{
    d3.selectAll(".link-outer")
        .attr("stroke",linkUnhighlightedColour);
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
        .attr("stroke-width",4);

    node.append("circle")
        .attr("class","img-node")
        .attr("r",15)
        .attr("fill","grey")
        .attr("stroke",nodeBorderColour)
        .attr("stroke-width",4)
        .attr("cx","30")
        .attr("cy","-30");

    node.append("text")
        .text(d=>d.nodeName)
        .attr("text-anchor","middle")
        .attr("y",5)
        .attr("background","white");

    node.insert("rect","text").attr("fill","white").attr("width",500);
}

const createNodeShadowElements = (node) =>
{
    node.append("circle")
        .attr("class","main-node-shadow")
        .attr("r",40)
        .attr("fill","white")
        .attr("opacity",0.25)
        .attr("stroke",nodeShadowColour)
        .attr("stroke-width",8);
}

const createLinkElements = (link) =>
{
    link.append("line")
        .attr("id",d => `from_${d.from}_to_${d.to}_outer`)
        .attr("class","link-outer")
        .attr("opacity",0.25)
        .attr("stroke","none")
        .attr("stroke-width",10)
        .attr("x1",(d) => {return d.y1;})
        .attr("y1",(d) => {return d.x1;})
        .attr("x2",(d) => {return d.y2;})
        .attr("y2",(d) => {return d.x2;});

    link.append("line")
        .attr("id",d => `from_${d.from}_to_${d.to}_inner`)
        .attr("class","link-inner")
        .attr("stroke","steelblue")
        .attr("stroke-width",4)
        .attr("x1",(d) => {return d.y1;})
        .attr("y1",(d) => {return d.x1;})
        .attr("x2",(d) => {return d.y2;})
        .attr("y2",(d) => {return d.x2;});
}
