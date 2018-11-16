const removeNodeOverlay = () =>
{
    d3.selectAll("#node-overlay div").remove();
    d3.select("#node-overlay")
        .style("display","none");
}

const createNodeOverlay = (containerId) =>
{
}

const generateOverlayInput = (overlay,label,id,type,value=null) =>
{
    const input = overlay.append("div")
        .text(`${label}`)
        .append("input")
        .attr("id",`${id}`)
        .attr("type",type)
        .attr("value",`${value || ""}`);

    if (type == "month")
    {
        input.style("margin","10").style("width","90%");
    }

    return input;
}

const frequencyDropdown =
[
    {"value":"Monthly","numerical-value":1},
    {"value":"Semi-Monthly","numerical-value":0.5},
    {"value":"Annually","numerical-value":12},
    {"value":"One-time","numerical-value":0},
];

const generateOverlayDropdown = (overlay,label,id,options) =>
{
    const container = overlay.append("div");
    container.append("div")
        .text(`${label}`);

    const listInput = container.append("input").attr("list",id).attr("id",`${id}-list`);
    const dropdown = container.append("datalist")
        .attr("id",id);

    options.map
    (
        (option) =>
        {
            const selection = dropdown.append("option")
                .attr("value",option["value"])
                .attr("dropdown-value",option["numerical-value"]);
        }
    );

    return listInput;
}

const generateOverlayButton = (overlay,label,id,background="white",border="2px darkgrey solid") =>
{
    return overlay.append("div")
        .attr("id",id)
        .attr("align","middle")
        .text(label)
        .style("margin","5px")
        .style("background",background)
        .style("border",border)
        .style("border-radius","5px");
}

const nodeOverlayDetails = (nodeId) =>
{
    removeNodeOverlay();

    const node = nodes[nodeId];
    d3.select("#node-overlay")
        .transition().duration(tooltipTransitionDelay)
        .style("padding", "0 10px 0 10px")
        .style("opacity",0.95)
        .style("display","block");

    const div = d3.select("#node-overlay").append("div");

    div.append("h5").text(`Modify: ${node.nodeName}`);

    generateOverlayInput(div,"Node Name","details-node-name-input","text",node.nodeName);

    const nodeType = node.type;
    const value = node.finance ? node.finance.value || null : null;
    const frequency = node.finance ? node.finance.frequency || null : null;
    const start = node.finance ? node.finance.start || 0 : 0;
    const end = node.finance ? node.finance.end || 0 : 0;

    if (nodeType == "group")
    {
        div.append("div")
            .text("Inherited Details")
            .attr("align","middle")
            .style("margin","5px 0 10px 0")
            .style("border-bottom","1px solid darkgrey")
            .style("border-top","1px solid darkgrey")
            .style("color","slategrey");
    }
    else
    {
        generateOverlayInput(div,"Value","details-node-value-input","number",value);
        generateOverlayInput(div,"Frequency (Months)","details-node-frequency-input","number",frequency);
    }

    generateOverlayInput(div,"Start Date","details-node-start-input","month",start);
    generateOverlayInput(div,"End Date","details-node-end-input","month",end);

    const buttons = div.append("div")
        .style("border-top","1px solid darkgrey")
        .style("padding","5px 0 5px 0");

    generateOverlayButton(buttons,"Update Details","details-node-submit-input")
        .on
        (
            "click",
            () =>
            {
                const nodeName = document.getElementById("details-node-name-input").value;
                const nodeValue = document.getElementById("details-node-value-input").value;
                const nodeFrequency = document.getElementById("details-node-frequency-input").value;
                const nodeStart = document.getElementById("details-node-start-input").value;
                const nodeEnd = document.getElementById("details-node-end-input").value;
                console.log(nodeStart.value,nodeEnd);

                if (verifyNodeDetails(nodeName,nodeValue,nodeFrequency,nodeStart,nodeEnd))
                {
                    const details =
                    {
                        "nodeName":nodeName,
                        "finance":
                        {
                            "value":nodeValue,
                            "frequency":nodeFrequency,
                            "start":nodeStart,
                            "end":nodeEnd,
                        }
                    };
                    updateNodeDetails(nodeId,details);
                    removeNodeOverlay();
                }
            }
        );

    generateOverlayButton(buttons,"Close","details-node-cancel-input")
        .on
        (
            "click",
            () =>
            {
                removeNodeOverlay();
            }
        );
}

const nodeOverlayAdd = (nodeId,isGroup=false) =>
{
    removeNodeOverlay();

    const node = nodes[nodeId];
    d3.select("#node-overlay")
        .transition().duration(tooltipTransitionDelay)
        .style("padding", "0 10px 0 10px")
        .style("opacity",0.95)
        .style("display","block");

    const div = d3.select("#node-overlay").append("div");

    div.append("h5").text(`Add to: ${node.nodeName}`);

    generateOverlayInput(div,"Node Name","add-node-name-input","text",null);
    if (!isGroup)
    {
        generateOverlayInput(div,"Value","add-node-value-input","number",null);
        generateOverlayInput(div,"Frequency (Months)","add-node-frequency-input","number",null);
    }
    generateOverlayInput(div,"Start Date","add-node-start-input","month",null);
    generateOverlayInput(div,"End Date","add-node-end-input","month",null);

    const buttons = div.append("div")
        .style("border-top","1px solid darkgrey")
        .style("padding","5px 0 5px 0");

    generateOverlayButton(buttons,"Add Node","details-node-submit-input")
        .on
        (
            "click",
            () =>
            {
                submitNewNode(nodeId,isGroup);
            }
        );

    generateOverlayButton(buttons,"Cancel","details-node-cancel-input")
        .on
        (
            "click",
            () =>
            {
                removeNodeOverlay();
            }
        );
}

const nodeOverlayPersonalDetails = (nodeId) =>
{
    removeNodeOverlay();

    const node = nodes[nodeId];
    d3.select("#node-overlay")
        .transition().duration(tooltipTransitionDelay)
        .style("padding", "0 10px 0 10px")
        .style("opacity",0.95)
        .style("display","block");

    const div = d3.select("#node-overlay").append("div");

    div.append("h5").text(`My Details`);

    generateOverlayInput(div,"Name","details-node-name-input","text",node.nodeName);
    generateOverlayInput(div,"Current Location","details-node-location-input","text",node.location);
    generateOverlayInput(div,"Date of Birth","details-node-birth-input","date",node.birth);

    const buttons = div.append("div")
        .style("border-top","1px solid darkgrey")
        .style("padding","5px 0 5px 0");

    generateOverlayButton(buttons,"Update Details","details-node-submit-input")
        .on
        (
            "click",
            () =>
            {
                const nodeName = document.getElementById("details-node-name-input");
                const nodeLocation = document.getElementById("details-node-location-input");
                const nodeBirth = document.getElementById("details-node-birth-input");

                const details =
                {
                    "nodeName":nodeName ? nodeName.value || "" : "" ,
                    "location":nodeLocation ? nodeLocation.value || "" : "" ,
                    "birth":nodeBirth ? nodeBirth.value || null : null ,
                };
                updateNodeDetails(nodeId,details);
                removeNodeOverlay();
            }
        );

    generateOverlayButton(buttons,"Close","details-node-cancel-input")
        .on
        (
            "click",
            () =>
            {
                removeNodeOverlay();
            }
        );
}
