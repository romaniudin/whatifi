const nodeDistance = 150;
const nodeCanvasHeight = 500;
let balancedNodes;
let svg,nodeCanvas;

const nodeShadowColour = "black";
const nodeHighlightedColour = "gainsboro";
const nodeTraversedBorderColour = "gainsboro";
const mainNodeRadius = 40;
const subNodeRadius = 15;

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

let previousLinks = {};
const render = (newCanvas=true,delaySubnode=false) =>
{
    let allNodes = [];
    Object.keys(nodes).map
    (
        nodeId =>
        {
            allNodes.push(nodes[nodeId]);
        }
    );

    balancedNodes = [];
    allNodes = allNodes.sort(compareNodeLevels);
    allNodes.map
    (
        node =>
        {
            balanceNodes(balancedNodes,node)
        }
    );

    const range = d3.extent(allNodes,(node) => node.x);
    const shift = range[1] - range[0];

    const layeredNodes = orderedNodes.map
    (
        nodeId =>
        {
            const node = nodes[nodeId];
            node.x += nodeCanvasHeight/2;
            return node;
        }
    )

    const yRange = d3.extent(allNodes, node => node.x);
    const xRange = d3.extent(allNodes, node => (node.level+0.5)*nodeDistance);
    if (newCanvas)
    {
        createCanvas(xRange,yRange);
    }

    const allLinks = generateLinks(nodes);
    const removedLinks = [];
    const newLinks = Object.keys(generateLinks(nodes));
    const existingLinks = [];

    Object.keys(previousLinks).map
    (
        link =>
        {
            const index = newLinks.indexOf(link);
            if (index == -1)
            {
                removedLinks.push(link);
            }
            else
            {
                existingLinks.push(link);
                newLinks.splice(index,1);
            }
        }
    );

    previousLinks = {};
    existingLinks.concat(newLinks).map(link=>{previousLinks[link] = allLinks[link]});

    const newNodes = nodeCanvas.select("#node-container").selectAll(".node")
        .data(layeredNodes)
        .enter()
        .append("g")
        .attr("class","node")
        .attr("id",(d) => {return `${d.nodeId}-element`});

    createNodeElements(newNodes);
    positionNodeElements();

    createNodeOverlay("node-graph-viewbox");

    updateLinkElements(newLinks,existingLinks,removedLinks);
    setTimeout(generateSubNodeDisplay,delaySubnode ? 150 : 0);
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

    nodeCanvas.append("g").attr("id","link-container");
    nodeCanvas.append("g").attr("id","node-container");
    nodeCanvas.append("g").attr("id","sub-node-container");
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
    const allLinks = {};

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

            if (link["x1"] == link["x2"] && link["y1"] == link["y2"]) continue;

            allLinks[`from_${node.nodeId}_to_${childNode.nodeId}`] = link;
        }
    }

    return allLinks;
}

const renderNodeSelection = (nodeId) =>
{
    const node = nodes[nodeId];
    d3.select(`#node-graph svg #node-graph-viewbox #${nodeId}-element .main-node`)
        .attr("stroke", nodeBorderColour(node));
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
    createNodeSubElements(node);
    createNodeMainElements(node);
    createNodeAddElements(node);
    createNodeExpandElements(node);
}

const positionNodeElements = () =>
{
    positionNodeSubElements();
    positionNodeMainElements();
    positionNodeAddElements();
    positionNodeExpandElements();
}

const createNodeSubElements = (node) =>
{
    const subElements = node.append("g")
        .attr("class","sub-node-element")
        .attr("oncontextmenu",(d) => {return `toggleSubElementsDisplay("${d.nodeId}")`})
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`});

    subElements.append("circle")
        .attr("class","sub-node-shadow")
        .attr("fill","black")
        .attr("opacity",0)
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("stroke","black")
        .attr("cx",d=>{return obtainNodeXCoordinate(d,32)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-28)});

    subElements.append("circle")
        .attr("class","sub-node")
        .attr("fill", "white")
        .attr("opacity",0)
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("stroke",d => nodeImageBorderColour(d))
        .attr("cx",d=>{return obtainNodeXCoordinate(d,30)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-30)});
}

const shouldDisplaySubElement = (nodeId) =>
{
    const node = nodes[nodeId];
    return  Object.keys(node.subNodes).length > 0 &&
            (
                (node.type != "group" && !node.expanded && (node.selected || !node.minimized)) || 
                (node.type == "group" && !node.expanded && !node.minimized)
            );
}
const positionNodeSubElements = () =>
{
    d3.selectAll(".sub-node-shadow")
        .transition()
        .attr("stroke-width",5)
        .attr("opacity",d => shouldDisplaySubElement(d.nodeId) ? 0.25 : 0)
        .attr("r",d => {return shouldDisplaySubElement(d.nodeId) ? subNodeRadius : 0})
        .attr("cx",d=>{return obtainNodeXCoordinate(d,32)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-28)});

    d3.selectAll(".sub-node")
        .transition()
        .attr("stroke-width",4)
        .attr("opacity",d => shouldDisplaySubElement(d.nodeId) ? 1 : 0)
        .attr("r",d => shouldDisplaySubElement(d.nodeId) ? subNodeRadius : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,30)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-30)});
}

const createNodeMainElements = (node) =>
{
    const mainNode = node.append("g")
        .attr("class","main-node-element")
        .attr("oncontextmenu",(d) => {return `toggleSubElementsDisplay("${d.nodeId}")`})
        .attr("onclick",(d) => {return `onClickAction("${d.nodeId}")`});

    mainNode.append("circle")
        .attr("class","main-node-shadow")
        .attr("fill","black")
        .attr("opacity",0)
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("stroke","black")
        .attr("cx",d=>{return obtainNodeXCoordinate(d,2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,2)});

    mainNode.append("circle")
        .attr("class","main-node")
        .attr("fill", d => d.highlighted ? nodeHighlightedColour : nodeBackgroundColour(d))
        .attr("opacity",0)
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("stroke",d => nodeBorderColour(d))
        .attr("cx",d=>{return obtainNodeXCoordinate(d,0)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)});

    mainNode.append("text")
        .attr("class","node-name")
        .attr("text-anchor","middle")
        .attr("opacity",0)
        .attr("x",d=>{return obtainNodeXCoordinate(d,0)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,5)});
}

const positionNodeMainElements = () =>
{
    d3.selectAll(".main-node-shadow")
        .transition()
        .attr("stroke-width",5)
        .attr("opacity",0.25)
        .attr("r",d => d.minimized && !d.selected ? 0 : mainNodeRadius)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,2)});

    d3.selectAll(".main-node")
        .transition()
        .attr("opacity",1)
        .attr("stroke-width",4)
        .attr("r",d => d.minimized && !d.selected ? 0 :mainNodeRadius)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,0)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)});

    d3.selectAll(".node-name")
        .transition()
        .attr("opacity",1)
        .text(d=> d.minimized && !d.selected ? "" : d.nodeName)
        .attr("x",d=>{return obtainNodeXCoordinate(d,0)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,5)});
}

const plusThickness = 2;
const plusHeight = 8;
const createNodeAddElements = (node) =>
{
    const addNode = node.append("g")
        .attr("class","add-child-element")
        .attr("onclick",(d) => {if (d.type=="group") return `nodeOverlayAdd("${d.nodeId}","default")`;else return ""})

    addNode.append("circle")
        .attr("class","add-node-shadow")
        .attr("fill","black")
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("opacity",(d)=>{if (d.type=="group") return 0.25;else return 0;})
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2+1)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,1)});

    addNode.append("circle")
        .attr("class","add-child-plus-circle")
        .attr("fill","steelblue")
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("opacity",1)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)});

    addNode.append("rect")
        .attr("class","add-child-plus-1")
        .attr("fill","white")
        .attr("stroke","white")
        .attr("stroke-width",2)
        .attr("opacity",(d)=>{if (d.type=="group") return 1;else return 0;})
        .attr("x",d=>{return obtainNodeXCoordinate(d,nodeDistance/2-plusThickness/2)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-plusHeight/2)});

    addNode.append("rect")
        .attr("class","add-child-plus-2")
        .attr("fill","white")
        .attr("stroke","white")
        .attr("stroke-width",2)
        .attr("opacity",(d)=>{if (d.type=="group") return 1;else return 0;})
        .attr("x",d=>{return obtainNodeXCoordinate(d,nodeDistance/2-plusHeight/2)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-plusThickness/2)});

    addNode.append("circle")
        .attr("class","add-node")
        .attr("opacity",0)
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)});
}

const positionNodeAddElements = () =>
{
    d3.selectAll(".add-node-shadow")
        .transition()
        .attr("r",d => d.type == "group" ? 8 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2+1)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,1)});

    d3.selectAll(".add-child-plus-circle")
        .transition()
        .attr("r",d => d.type == "group" ? 8 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)});

    d3.selectAll(".add-child-plus-1")
        .transition()
        .attr("width",d => d.type == "group" ? plusThickness : 0)
        .attr("height",d => d.type == "group" ? plusHeight : 0)
        .attr("x",d=>{return obtainNodeXCoordinate(d,nodeDistance/2-plusThickness/2)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-plusHeight/2)});

    d3.selectAll(".add-child-plus-2")
        .transition()
        .attr("width",d => d.type == "group" ? plusHeight : 0)
        .attr("height",d => d.type == "group" ? plusThickness : 0)
        .attr("x",d=>{return obtainNodeXCoordinate(d,nodeDistance/2-plusHeight/2)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-plusThickness/2)});

    d3.selectAll(".add-node")
        .transition()
        .attr("r",d => d.type == "group" ? 8 : 0)
        .attr("fill","white")
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeDistance/2)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,0)});
}

const createNodeExpandElements = (node) =>
{
    const expandGroup = node.append("g")
        .attr("class","expand-group-element")
        .attr("onclick",(d) => {if (d.type=="group") return `collapseChildNodes("${d.nodeId}")`;else return ""});

    expandGroup.append("circle")
        .attr("class","expand-group-element-shadow")
        .attr("fill","black")
        .attr("opacity",0.25)
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,52)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,52)});

    expandGroup.append("circle")
        .attr("class","expand-group-ellipsis")
        .attr("fill",d => nodeImageBackgroundColour(d))
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("stroke",d => nodeImageBorderColour(d))
        .attr("cx",d=>{return obtainNodeXCoordinate(d,50)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,50)});

    expandGroup.append("circle")
        .attr("class","expand-group-ellipsis-0")
        .attr("fill",d => nodeImageBorderColour(d))
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d, d.minimized ? 50 : 56)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d, d.minimized ? 56 : 50)});

    expandGroup.append("circle")
        .attr("class","expand-group-ellipsis-1")
        .attr("fill",d => nodeImageBorderColour(d))
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,50)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,50)});

    expandGroup.append("circle")
        .attr("class","expand-group-ellipsis-2")
        .attr("fill",d => nodeImageBorderColour(d))
        .attr("r",0)
        .attr("stroke-width",0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d, d.minimized ? 50 : 44)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d, d.minimized ? 44 : 50)});
}

const positionNodeExpandElements = (node) =>
{
    d3.selectAll(".expand-group-element-shadow")
        .transition()
        .attr("r",d => d.type == "group" ? 17 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,52)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,52)});

    d3.selectAll(".expand-group-ellipsis")
        .transition()
        .attr("stroke-width",3)
        .attr("r",d => d.type == "group" ? subNodeRadius : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,50)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,50)});

    d3.selectAll(".expand-group-ellipsis-0")
        .transition()
        .attr("r",d => d.type == "group" ? 2 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d, d.minimized ? 50 : 56)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d, d.minimized ? 56 : 50)});

    d3.selectAll(".expand-group-ellipsis-1")
        .transition()
        .attr("r",d => d.type == "group" ? 2 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,50)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,50)});

    d3.selectAll(".expand-group-ellipsis-2")
        .transition()
        .attr("r",d => d.type == "group" ? 2 : 0)
        .attr("cx",d=>{return obtainNodeXCoordinate(d, d.minimized ? 50 : 44)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d, d.minimized ? 44 : 50)});
}

const updateLinkElements = (newLinks,currentLinks,removedLinks) =>
{
    removedLinks.map(link=>d3.selectAll(`#${link}`).remove());
    newLinks.map
    (
        linkId =>
        {
            const link = previousLinks[linkId];
            d3.select(`#link-container`)
                .append("line")
                .attr("id",linkId)
                .attr("stroke","#bfcbd5")
                .attr("stroke-width",4)
                .attr("x1",link.y1)
                .attr("y1",link.x1)
                .attr("x2",link.y2)
                .attr("y2",link.x2)
                .attr("opacity",0);
        }
    );
    currentLinks.map
    (
        linkId =>
        {
            const link = previousLinks[linkId];
            const current = d3.select(`#${linkId}`);

            const details =
            {
                "x1":current.attr("y1"),
                "y1":current.attr("x1"),
                "x2":current.attr("y2"),
                "y2":current.attr("x2"),
            }

            current.attr("x1",link.y1)
                .attr("y1",link.x1)
                .attr("x2",link.y2)
                .attr("y2",link.x2);

            if (details.x1 != link.x1 || details.y1 != link.y1 || details.x2 != link.x2 || details.y2 != link.y2)
            {
                current.attr("opacity",0);
            }
        }
    )

    d3.selectAll("#link-container line").transition().attr("opacity",1);
}

const verifyNodeDetails = (nodeName,nodeValue,nodeFrequency,nodeStart,nodeEnd,isGroup) =>
{
    let valid = true;

    if (!nodeName || nodeName == "")
    {
        valid &= false;
        toast("Please enter node name");
    }

    if (!isGroup)
    {
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
    }

    return valid;
}

const submitNewNode = (parentNodeId,type) =>
{
    const isGroup = type == "group";
    const nodeName = document.getElementById("add-node-name-input").value;
    const nodeValue = isGroup ? null : document.getElementById("add-node-value-input").value;
    const nodeFrequency = isGroup ? null : document.getElementById("add-node-frequency-input").value;
    const nodeStart = isGroup ? null : document.getElementById("add-node-start-input").value;
    const nodeEnd = isGroup ? null : document.getElementById("add-node-end-input").value;

    if (verifyNodeDetails(nodeName,nodeValue,nodeFrequency,nodeStart,nodeEnd,isGroup))
    {
        const nodeDetails =
        {
            "finance":
            {
                "value":nodeValue,
                "start":nodeStart,
                "end":nodeEnd,
                "frequency":nodeFrequency,
            }
        };

        if (type == "sub")
        {
            if (nodes[parentNodeId].subNodes[nodeName])
            {
                return toast("Node name already exists");
            }

            addNewSubNodeTo
            (
                parentNodeId,
                nodeName,
                nodeDetails
            );
        }
        else
        {
            addNewNodeTo
            (
                parentNodeId,
                nodeName,
                isGroup ? "group" : "income",
                isGroup ? {} : nodeDetails
            );
        }
        removeNodeOverlay();
    }
}

let currentNodeExpanded;
let currentSubNodesExpanded;
const toggleSubElementsDisplay = (nodeId) =>
{
    const node = nodes[nodeId];
    node.expanded = Object.keys(node.subNodes).length == 0 ? false : !node.expanded;
    if (Object.keys(node.subNodes).length == 0) return;

    subElementAction(nodeId);

    Object.keys(nodes).map
    (
        _nodeId =>
        {
            const _node = nodes[_nodeId];
            if (_nodeId != nodeId && _node.expanded)
            {
                _node.expanded = false;
                subElementAction(_nodeId);
            }
        }
    );

    generateSubNodeDisplay(true);
}

const generateSubNodeDisplay = (expanded=false) =>
{
    const expected = {};
    currentNodeExpanded = null;
    Object.keys(nodes).map
    (
        _nodeId =>
        {
            const _node = nodes[_nodeId];
            if (_node.expanded)
            {
                currentNodeExpanded = _nodeId;
                Object.keys(_node.subNodes).map
                (
                    subNode =>
                    {
                        expected[`parent_${_nodeId}_sub_${subNode}`] =
                        {
                            "nodeId":_nodeId,
                            "subNodeId":subNode,
                            "elementId":`parent_${_nodeId}_sub_${subNode}`,
                        };
                    }
                );
            }
        }
    )

    const create = [], update = [], remove = [];
    Object.keys(expected).map
    (
        subNode =>
        {
            if (!currentSubNodesExpanded || currentSubNodesExpanded[subNode] == null)
            {
                create[subNode] = expected[subNode];
            }
            else
            {
                update[subNode] = expected[subNode];
            }
        }
    )
    if (currentSubNodesExpanded)
    {
        Object.keys(currentSubNodesExpanded).map
        (
            subNode =>
            {
                if (expected[subNode] == null)
                {
                    remove[subNode] = currentSubNodesExpanded[subNode];
                }
            }
        )
    }
    updateSubElementDisplay(create,update,remove,expanded);
}

const updateSubElementDisplay = (create,update,remove,expanded=false) =>
{
    currentSubNodesExpanded = Object.assign({},create,update);
    Object.keys(remove).map
    (
        subNode =>
        {
            d3.selectAll(`#${subNode}`).remove();
        }
    );
    generateSubNodes(currentSubNodesExpanded,expanded);
}

const generateSubNodes = (subNodes,expanded) =>
{
    // Initialize elements
    d3.select("#sub-node-container").selectAll(".sub-node-shadow")
        .data(Object.keys(subNodes).map(id => data = Object.assign({},subNodes[id])))
        .enter()
        .append("circle")
        .attr("id",d=>d.elementId)
        .attr("class","sub-node-shadow")
        .attr("r",mainNodeRadius)
        .attr("opacity",0)
        .attr("fill","black")
        .attr("stroke","black")
        .attr("stroke-width",5)
        .attr("onclick",(d) => {return `removeSubNodeFrom("${d.nodeId}","${d.subNodeId}")`})
        .attr("oncontextmenu",(d) => {return `subNodeOverlayDetails("${d.nodeId}","${d.subNodeId}")`});

    d3.select("#sub-node-container").selectAll(".sub-node-element")
        .data(Object.keys(subNodes).map(id => data = Object.assign({},subNodes[id])))
        .enter()
        .append("circle")
        .attr("id",d=>d.elementId)
        .attr("class","sub-node-element")
        .attr("r",mainNodeRadius)
        .attr("opacity",0)
        .attr("fill","white")
        .attr("stroke",d=>nodeImageBorderColour(nodes[d.nodeId]))
        .attr("stroke-width",4)
        .attr("onclick",(d) => {return `removeSubNodeFrom("${d.nodeId}","${d.subNodeId}")`})
        .attr("oncontextmenu",(d) => {return `subNodeOverlayDetails("${d.nodeId}","${d.subNodeId}")`});

    d3.select("#sub-node-container").selectAll(".sub-node-text")
        .data(Object.keys(subNodes).map(id => data = Object.assign({},subNodes[id])))
        .enter()
        .append("text")
        .attr("id",d=>d.elementId)
        .attr("class","sub-node-text")
        .attr("text-anchor","middle")
        .text(d=>d.subNodeId)
        .attr("opacity",0)
        .attr("onclick",(d) => {return `removeSubNodeFrom("${d.nodeId}","${d.subNodeId}")`})
        .attr("oncontextmenu",(d) => {return `subNodeOverlayDetails("${d.nodeId}","${d.subNodeId}")`});

    // Initialize location
    d3.selectAll("#sub-node-container .sub-node-element")
        .attr("cx",(d,i)=>obtainNodeXCoordinate(nodes[d.nodeId],80+(expanded ? 0 : i*100)))
        .attr("cy",(d,i)=>obtainNodeYCoordinate(nodes[d.nodeId],-60))

    d3.selectAll("#sub-node-container .sub-node-shadow")
        .attr("cx",(d,i)=>obtainNodeXCoordinate(nodes[d.nodeId],82+(expanded ? 0 : i*100)))
        .attr("cy",(d,i)=>obtainNodeYCoordinate(nodes[d.nodeId],-58))

    d3.selectAll("#sub-node-container .sub-node-text")
        .attr("x",(d,i)=>obtainNodeXCoordinate(nodes[d.nodeId],80+(expanded ? 0 : i*100)))
        .attr("y",(d,i)=>obtainNodeYCoordinate(nodes[d.nodeId],-55))

    // Initialize shadow
    d3.selectAll("#sub-node-container .sub-node-element")
        .transition()
        .attr("opacity",1)
        .attr("cx",(d,i)=>obtainNodeXCoordinate(nodes[d.nodeId],80+i*100))
        .attr("cy",(d,i)=>obtainNodeYCoordinate(nodes[d.nodeId],-60))

    d3.selectAll("#sub-node-container .sub-node-shadow")
        .transition()
        .attr("opacity",0.25)
        .attr("cx",(d,i)=>obtainNodeXCoordinate(nodes[d.nodeId],82+i*100))
        .attr("cy",(d,i)=>obtainNodeYCoordinate(nodes[d.nodeId],-58))

    d3.selectAll("#sub-node-container .sub-node-text")
        .transition()
        .attr("opacity",1)
        .attr("x",(d,i)=>obtainNodeXCoordinate(nodes[d.nodeId],80+i*100))
        .attr("y",(d,i)=>obtainNodeYCoordinate(nodes[d.nodeId],-55))
}

const subElementAction = (nodeId) =>
{
    const node = nodes[nodeId];
    const expanded = node.expanded;
    const offset = expanded ? 2 : 1;

    const subElements = d3.selectAll(`#${nodeId}-element`);
    subElements.selectAll(".sub-node-shadow")
        .transition()
        .attr("opacity",expanded ? 0 : 0.25)
        .attr("r",expanded ? mainNodeRadius : subNodeRadius)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,32*offset)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-28*offset)});

    subElements.selectAll(".sub-node")
        .transition()
        .attr("opacity",expanded ? 0 : 1)
        .attr("r",expanded == 2 ? mainNodeRadius : subNodeRadius)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,30*offset)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-30*offset)});

    return expanded;
}

