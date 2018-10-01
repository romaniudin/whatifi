"use strict";

const nodes = {};
const nodeTypes =
[
    "me",
    "person",
    "expense",
    "income",
    "location"
];

const isParent = (nodeId,possibleParentId) =>
{
    const node = nodes[nodeId];

    for (let obj in node["childrenNodes"])
    {
        const child = node["childrenNodes"][obj];
        if (child == possibleParentId)
        {
            return true
        }
        else
        {
            if (isParent(child,possibleParentId))
            {
                return true
            };
        }
    }

    return false;
}

const addChild = (nodeId,parentNodeId) =>
{
    if (isParent(nodeId,parentNodeId))
    {
        return;
    }

    if (nodes[parentNodeId] == null)
    {
        console.log(nodeId,parentNodeId);
        return toast("Parent node does not exist");
    }

    const node = nodes[nodeId];
    const currentParent = node["parentNode"];

    if (currentParent != null)
    {
        const index = nodes[currentParent]["childrenNodes"].indexOf(nodeId);
        nodes[currentParent]["childrenNodes"].splice(index);
    }

    nodes[parentNodeId]["childrenNodes"].push(nodeId);
    nodes[nodeId]["parentNode"] = parentNodeId;
    nodes[nodeId]["nodeLevel"] = nodes[parentNodeId]["nodeLevel"]+1;
}

const addNode = (nodeName,nodeType,nodeDetails) =>
{
    if (!nodeTypes.includes(nodeType))
    {
        toast("Invalid node type");
        return;
    }

    let nodeNumber = 1;
    let nodeId = "node-"+nodeName.toLowerCase();
    while (nodes[nodeId] != null)
    {
        nodeNumber += 1;
        nodeId = "node-"+nodeName.toLowerCase()+"-"+nodeNumber.toString();
    }

    nodes[nodeId] =
    {
        "nodeId":nodeId,
        "nodeName":nodeName,
        "parentNode":null,
        "childrenNodes":[],
        "nodeLevel": 0 
    };

    return nodeId;
}

const tree = (nodeId) =>
{
    const root = {};
    root[nodeId] = traverse(nodeId);

    return root;
}

const traverse = (nodeId) =>
{
    const tree = {};
    const node = nodes[nodeId];

    for (let obj in node["childrenNodes"])
    {
        const child = node["childrenNodes"][obj];
        tree[child] = traverse(child);
    }

    return tree;
}

const generateNode = (nodeId) =>
{
    let html = "<div id=\"node-root-"+nodeId+"\" class=\"node-root\" ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\" draggable=\"true\" ondragstart=\"drag(event)\"><table><tbody><tr>";

    const node = nodes[nodeId];

    html += "<td><div id=\"node-name-"+nodeId+"\" class=\"node-name\">";
    html += node["nodeName"];
    html += "</td></div>";

    html += "<td><div id=\"node-children-"+nodeId+"\" class=\"node-children\">";

    for (let i in node["childrenNodes"])
    {
        html += generateNode(nodes[node["childrenNodes"][i]]["nodeId"]);
    }

    html += "</td><div>";

    html += "</tr></tbody></table></div>";
    return html;
}
