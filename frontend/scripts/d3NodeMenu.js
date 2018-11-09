const nodeMenuPadding = 6;
const nodeMenuFontSize = 12;
const nodeMenuActionOffset = nodeMenuPadding + nodeMenuFontSize;

const nodeMenuWidth = 100;
const nodeMenuCloseRadius = 6;
const nodeMenuCloseHeight = 7;
const nodeMenuCloseWidth = 2;
const nodeMenuBorder = 2;

const generateNodeMenu = (nodeId) =>
{
    nodeMenuCloseAll();
    const node = nodes[nodeId];
    const container = d3.select(`#${nodeId}-element`).append("g")
        .attr("class","node-menu-container");
    const generators = nodeMenuGenerator[node.type] || nodeMenuGenerator["default"];

    generateNodeMenuShadowElements(container,generators.length);
    generateNodeMenuElements(container,generators.length);

    for (const i in generators)
    {
        const generator = generators[i];
        generator(container,nodeId,i);
    }
}

const generateNodeMenuElements = (container,elements) =>
{
    container.append("rect")
        .attr("fill","#fefefe")
        .attr("stroke","gainsboro")
        .attr("stroke-width",nodeMenuBorder)
        .attr("rx",2)
        .attr("ry",2)
        .attr("x",d=>{return obtainNodeXCoordinate(d,0)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-(nodeMenuFontSize+nodeMenuPadding))})
        .attr("opacity",0.95)
        .attr("width",nodeMenuWidth)
        .attr("height",nodeMenuPadding*2 + (nodeMenuFontSize + nodeMenuPadding)*elements);

    container.append("circle")
        .attr("r",nodeMenuCloseRadius)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeMenuWidth)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-(nodeMenuFontSize+nodeMenuPadding))})
        .attr("fill","red")
        .attr("stroke","gainsboro")
        .attr("stroke-width",nodeMenuBorder);

    container.append("rect")
        .attr("height",nodeMenuCloseHeight)
        .attr("width",nodeMenuCloseWidth)
        .attr("fill","white")
        .attr("transform",`rotate(45)`)
        .attr
        (
            "transform",
            d =>
            {
                return `translate(${obtainNodeXCoordinate(d,101.75)},${obtainNodeYCoordinate(d,-21)}) rotate(45)`
            }
        );

    container.append("rect")
        .attr("height",nodeMenuCloseHeight)
        .attr("width",nodeMenuCloseWidth)
        .attr("fill","white")
        .attr
        (
            "transform",
            d =>
            {
                return `translate(${obtainNodeXCoordinate(d,96.75)},${obtainNodeYCoordinate(d,-19.5)}) rotate(-45)`
            }
        );

    container.append("circle")
        .attr("r",nodeMenuCloseRadius)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeMenuWidth)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-(nodeMenuFontSize+nodeMenuPadding))})
        .attr("fill","white")
        .attr("stroke","white")
        .attr("stroke-width",nodeMenuBorder)
        .attr("opacity",0.1)
        .attr("onclick","nodeMenuCloseAll()");

}

const generateNodeMenuShadowElements = (container,elements) =>
{
    container.append("rect")
        .attr("fill","black")
        .attr("stroke","black")
        .attr("stroke-width",nodeMenuBorder+1)
        .attr("rx",2)
        .attr("ry",2)
        .attr("x",d=>{return obtainNodeXCoordinate(d,1)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,-(nodeMenuFontSize+nodeMenuPadding)+1)})
        .attr("opacity",0.25)
        .attr("width",nodeMenuWidth)
        .attr("height",nodeMenuPadding*2 + (nodeMenuFontSize + nodeMenuPadding)*elements);

    container.append("circle")
        .attr("r",nodeMenuCloseRadius+0.5)
        .attr("cx",d=>{return obtainNodeXCoordinate(d,nodeMenuWidth+1)})
        .attr("cy",d=>{return obtainNodeYCoordinate(d,-(nodeMenuFontSize+nodeMenuPadding)+1)})
        .attr("opacity",0.25)
        .attr("fill","black")
        .attr("stroke","black")
        .attr("stroke-width",nodeMenuBorder);

}

const generateNodeMenuItem = (container,text,action,offset) =>
{
    container.append("text")
        .text(text)
        .attr("text-anchor","middle")
        .attr("font-size",nodeMenuFontSize)
        .attr("x",d=>{return obtainNodeXCoordinate(d,nodeMenuWidth/2)})
        .attr("y",d=>{return obtainNodeYCoordinate(d,offset*nodeMenuActionOffset)})
        .attr("onclick",action);
}

const generateNodeMenu_toggle = (container,nodeId,offset=0) =>
{
    generateNodeMenuItem(container,"Toggle Selection",`toggleSelectNode(\"${nodeId}\");nodeMenuCloseAll();`,offset);
}

const generateNodeMenu_traverse = (container,nodeId,offset=0) =>
{
    generateNodeMenuItem(container,"Traverse From",`startReverseTraverse(\"${nodeId}\");nodeMenuCloseAll();`,offset);
}

const generateNodeMenu_traverseAll = (container,nodeId,offset=0) =>
{
    generateNodeMenuItem(container,"Show All Options",`startForwardTraverse(\"${nodeId}\");nodeMenuCloseAll();`,offset);
}

const generateNodeMenu_compareChildren = (container,nodeId,offset=0) =>
{
    generateNodeMenuItem(container,"Compare Group",`compareChildNodes(\"${nodeId}\");nodeMenuCloseAll();`,offset);
}

const generateNodeMenu_editDetails = (container,nodeId,offset=0) =>
{
    generateNodeMenuItem(container,"Edit Details",`onContextMenu(\"${nodeId}\");nodeMenuCloseAll();`,offset);
}

const closeAll = () =>
{
    nodeMenuCloseAll();
}

const nodeMenuCloseAll = () =>
{
    d3.selectAll(".node-menu-container").remove();
}

const nodeMenuGenerator =
{
    "me":[generateNodeMenu_traverseAll,generateNodeMenu_editDetails],
    "group":[generateNodeMenu_toggle,generateNodeMenu_traverse,generateNodeMenu_compareChildren,generateNodeMenu_editDetails],
    "default":[generateNodeMenu_toggle,generateNodeMenu_traverse,generateNodeMenu_editDetails],
}
