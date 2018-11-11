const nodeDistance = 150;
const nodeCanvasHeight = 500;
let balancedNodes;
let svg,nodeCanvas;

const nodeShadowColour = "black";
const nodeHighlightedColour = "gainsboro";
const nodeTraversedBorderColour = "gainsboro";
const nodeSelectedBorderColour = "black";

const linkUnhighlightedColour = "none";
const linkHighlightedColour = "gainsboro";
const linkTraversedColour = "black";

const tooltipMinLength = 0;
const tooltipTransitionDelay = 200;

const layerPriority = {"default":0,"group":1,"selected":2}
const obtainNodeLayer = (node) =>
{
    if (node.type == "group")
    {
        return layerPriority["group"];
    }
    else
    {
        return layerPriority[node.selected ? "selected" : "default"];
    }
}

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

    const nodeLayers = [[],[],[]];
    allNodes.map
    (
        (node) =>
        {
            node.x += nodeCanvasHeight/2;
            nodeLayers[obtainNodeLayer(node)].push(node);
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

    const nodeLayersPlacements = nodeLayers.map
    (
        layers =>
        {
            return nodeCanvas.selectAll("node")
            .data(layers)
            .enter()
            .append("g")
            .attr("id",(d) => {return `${d.nodeId}-element`});
        }
    );

    createLinkElements(linkPlacements);

    nodeLayersPlacements.map
    (
        nodePlacements =>
        {
            createNodeElements(nodePlacements);
        }
    );

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
            .attr("height","100%");

        svg.append("rect")
            .attr("opacity",0.3)
            .attr("width","100%")
            .attr("fill",whatifiOrange);
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

    return a.level > b.level ? 1 : -1;
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
        const parentNode = balancedNodes[node["parentNodes"][0]];

        for (const i in node["childrenNodes"])
        {
            const childNode = balancedNodes[node["childrenNodes"][i]];
            const link = {};

            link["from"] = node.nodeId;
            link["to"] = childNode.nodeId;
            link["x1"] = obtainNodeYCoordinate(node);
            link["y1"] = obtainNodeXCoordinate(node);
            link["x2"] = obtainNodeYCoordinate(childNode);
            link["y2"] = obtainNodeXCoordinate(childNode);

            allLinks.push(link);
        }
    }

    return allLinks;
}

const renderNodeSelection = (nodeId) =>
{
    const node = nodes[nodeId];
    d3.select(`#node-graph svg #node-graph-viewbox #${nodeId}-element .img-node`)
        .attr("stroke", node.selected ? nodeSelectedBorderColour : nodeImageBorderColour(node));
}

const renderNodeHighlight = (nodeId) =>
{
    const node = nodes[nodeId];
    d3.select(`#node-graph svg #node-graph-viewbox #${nodeId}-element .main-node`)
        .attr("fill", node.highlighted ? nodeHighlightedColour : nodeBackgroundColour(node))
}

const renderLinkTraverse = (fromNodeId,toNodeId) =>
{
    const inner = d3.selectAll(`#node-graph svg #node-graph-viewbox g line#from_${fromNodeId}_to_${toNodeId}_inner`)
        .attr("stroke","steelblue")
        .attr("opacity",1);
}

const removeAllLinkTraverse = () =>
{
    d3.selectAll(".link-inner")
        .attr("stroke","#bfcbd5");
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
    nodeMenuCloseAll();
    return generateNodeMenu(nodeId);
}

const onContextMenu = (nodeId) =>
{
    nodeMenuCloseAll();
    const node = nodes[nodeId];
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

const obtainNodeXCoordinate = (node,offset=0) =>
{
    let level = node.level;
    minimizedNodes.map
    (
        minimized =>
        {
            if (node.level > minimized)
            {
                level -= 1;
            }
        }
    )

    return (level+0.5)*nodeDistance+offset;
}

const obtainNodeYCoordinate = (node,offset=0) =>
{
    if (node.minimized && node.type != "group")
    {
        const parentNode = nodes[node.parentNodes[0]];
        const placement = parentNode.x+offset;
        return placement;
    }
    else
    {
        return node.x+offset;
    }
}

const createNodeElements = (node) =>
{
    createNodeMainElements(node);
    createNodeAddElements(node);
    createNodeExpandElements(node);
}

const createNodeMainElements = (node) =>
{
    const mainNode = node.append("g")
        .attr("class","main-node-element")
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`});

    mainNode.append("circle")
        .attr("class","main-node-shadow")
        .attr("r",40)
        .attr("fill","black")
        .attr("opacity",0.25)
        .attr("stroke","black")
        .attr("stroke-width",5)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,2)});

    mainNode.append("circle")
        .attr("class","img-node-shadow")
        .attr("r",15)
        .attr("fill","black")
        .attr("opacity",0.25)
        .attr("stroke","black")
        .attr("stroke-width",5)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,32)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-28)});

    mainNode.append("circle")
        .attr("class","main-node")
        .attr("r",40)
        .attr("fill", d => d.highlighted ? nodeHighlightedColour : nodeBackgroundColour(d))
        .attr("stroke",d => nodeBorderColour(d))
        .attr("stroke-width",4)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,0)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)})
        .attr("oncontextmenu",(d) => {return `toggleSelectNode("${d.nodeId}")`});

    mainNode.append("circle")
        .attr("class","img-node")
        .attr("r",15)
        .attr("fill", "white")
        .attr("stroke",d => d.selected ? nodeSelectedBorderColour : nodeImageBorderColour(d))
        .attr("stroke-width",4)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,30)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-30)})
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`})
        .attr("oncontextmenu",(d) => {return `toggleSelectNode("${d.nodeId}")`});

    mainNode.append("text")
        .text(d=>d.nodeName)
        .attr("class","node-name")
        .attr("text-anchor","middle")
        .attr("x",d=>{return obtainNodeXCoordinate(d,0)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,5)})
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`})
        .attr("oncontextmenu",(d) => {return `toggleSelectNode("${d.nodeId}")`});
}

const createNodeAddElements = (node) =>
{
    const plusThickness = 2;
    const plusHeight = 8;

    const addNode = node.append("g")
        .attr("class","add-child-element")
        .attr("onclick",(d) => {if (d.type=="group") return `nodeOverlayAdd("${d.nodeId}")`;else return ""});

    addNode.append("circle")
        .attr("class","add-node-shadow")
        .attr("r",8)
        .attr("fill","black")
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2+1)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,1)})
        .attr("opacity",(d)=>{if (d.type=="group") return 0.25;else return 0;});

    addNode.append("circle")
        .attr("r",d => d.type == "group" ? 8 : 0)
        .attr("fill","steelblue")
        .attr("cx",`${nodeDistance/2}`)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)})
        .attr("opacity",1);

    addNode.append("rect")
        .attr("fill","white")
        .attr("stroke","white")
        .attr("stroke-width",2)
        .attr("width",d => d.type == "group" ? plusThickness : 0)
        .attr("height",d => d.type == "group" ? plusHeight : 0)
        .attr("x",d=>{return obtainNodeXCoordinate(d,nodeDistance/2-plusThickness/2)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-plusHeight/2)})
        .attr("opacity",(d)=>{if (d.type=="group") return 1;else return 0;});

    addNode.append("rect")
        .attr("fill","white")
        .attr("stroke","white")
        .attr("stroke-width",2)
        .attr("width",d => d.type == "group" ? plusHeight : 0)
        .attr("height",d => d.type == "group" ? plusThickness : 0)
        .attr("x",d=>{return obtainNodeXCoordinate(d,nodeDistance/2-plusHeight/2)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-plusThickness/2)})
        .attr("opacity",(d)=>{if (d.type=="group") return 1;else return 0;});

    addNode.append("circle")
        .attr("class","add-node")
        .attr("r",d => d.type == "group" ? 8 : 0)
        .attr("fill","white")
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)})
        .attr("opacity",0);
}

const createNodeExpandElements = (node) =>
{
    const expandGroup = node.append("g")
        .attr("class","expand-group-element")
        .attr("onclick",(d) => {return `collapseChildNodes("${d.nodeId}")`});

    expandGroup.append("circle")
        .attr("r",d => d.type == "group" ? 17 : 0)
        .attr("fill","black")
        .attr("opacity",0.25)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,52)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,52)});

    expandGroup.append("circle")
        .attr("r",d => d.type == "group" ? 15 : 0)
        .attr("fill",d => nodeImageBackgroundColour(d))
        .attr("stroke",d => nodeImageBorderColour(d))
        .attr("stroke-width",4)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,50)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,50)});

    expandGroup.append("circle")
        .attr("fill",d => nodeImageBorderColour(d))
        .attr("r",d => d.type == "group" ? 2 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d, d.minimized ? 50 : 56)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d, d.minimized ? 56 : 50)});

    expandGroup.append("circle")
        .attr("fill",d => nodeImageBorderColour(d))
        .attr("r",d => d.type == "group" ? 2 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,50)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,50)});

    expandGroup.append("circle")
        .attr("fill",d => nodeImageBorderColour(d))
        .attr("r",d => d.type == "group" ? 2 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d, d.minimized ? 50 : 44)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d, d.minimized ? 44 : 50)});
}

const createLinkElements = (link) =>
{
    link.append("line")
        .attr("id",d => `from_${d.from}_to_${d.to}_inner`)
        .attr("class","link-inner")
        .attr("stroke","#bfcbd5")
        .attr("stroke-width",4)
        .attr("opacity",1)
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

