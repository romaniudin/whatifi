"use strict";

const animationDelay = 150;
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
        return toast("Parent node does not exist");
    }

    const node = nodes[nodeId];
    const parentNode = nodes[parentNodeId];

    parentNode["childrenNodes"].push(nodeId);
    node["parentNodes"].push(parentNodeId);

    const diff = parentNode["level"]+1 - node["level"];
    if (diff > 0)
    {
        traverse(nodeId,null,null,
            (node) =>
            {
                node["level"] += diff;
            }
        );
    }
}

const addNode = (nodeName,nodeType,nodeDetails) =>
{
    if (!nodeTypes.includes(nodeType))
    {
        toast("Invalid node type");
        return;
    }

    let nodeNumber = 1;
    let nodeId = "node-"+nodeName.toLowerCase().replace(" ","_");
    while (nodes[nodeId] != null)
    {
        nodeNumber += 1;
        nodeId = "node-"+nodeName.toLowerCase()+"-"+nodeNumber.toString();
    }

    const node =
    {
        "nodeId":nodeId,
        "nodeName":nodeName,
        "level":0,
        "parentNodes":[],
        "childrenNodes":[],
        "selected":false,
        "highlighted":false,
    };

    for (let key in nodeDetails)
    {
        if (node[key] != null) {continue}
        node[key] = nodeDetails[key];
    }

    nodes[nodeId] = node;

    return nodeId;
}

const tree = (nodeId) =>
{
    const root = {};
    root["name"] = nodeId;
    root["children"] = traverse(nodeId);

    return root;
}

const traverseUniqueChildren = (childNodeId,uniqueChildren) =>
{
    if (uniqueChildren.indexOf(childNodeId) == -1)
    {
        uniqueChildren.push(childNodeId);
        return true;
    }
    else
    {
        return false
    }
}

const traverse = (nodeId,traverseChildrenCallback=null,traverseChildrenCallbackArg=null,performCallback=null) =>
{
    const cb = traverseChildrenCallback;
    const cbArg = traverseChildrenCallbackArg;
    const node = nodes[nodeId];
    const root =
    {
        "name":node["nodeName"],
        "nodeId":node["nodeId"],
        "parentNodes":node["parentNodes"],
        "selected":node["selected"],
        "highlighted":node["highlighted"],
    };

    if (performCallback) performCallback(node);

    if (cb && !cb(nodeId,cbArg))
    {
        return root;
    }

    const tree = [];
    for (let obj in node["childrenNodes"])
    {
        const child = node["childrenNodes"][obj];
        tree.push(traverse(child,cb,cbArg,performCallback));
    }
    if (tree.length > 0)root["children"] = tree;

    return root;
}

let selectedNodes = [];
const toggleSelectNode = (nodeId) =>
{
    const node = nodes[nodeId];
    return node.selected ? unselectNode(nodeId) : selectNode(nodeId);
}

const selectNode = (nodeId) =>
{
    const node = nodes[nodeId];
    node.selected = true;

    if (selectedNodes.indexOf(nodeId) == -1)
    {
        selectedNodes.push(nodeId);
    }

    updateNodeSelected(nodeId,node.selected);
}

const unselectNode = (nodeId) =>
{
    const node = nodes[nodeId];
    node.selected = false;

    let i = selectedNodes.indexOf(nodeId);
    if (i > -1) {selectedNodes.splice(i,1);};

    updateNodeSelected(nodeId,node.selected);
}
const unselectAllNodes = () =>
{
    selectedNodes.map
    (
        (nodeId) =>
        {
            nodes[nodeId]["selected"] = false;
        }
    );
    selectedNodes = [];
    render();
}

let highlightedNodes = [];
const highlightNode = (nodeId) =>
{
    const node = nodes[nodeId];
    node.highlighted = !node.highlighted;

    if (node.highlighted)
    {
        highlightedNodes.push(nodeId);
    }
    else
    {
        let i = highlightedNodes.indexOf(nodeId);
        if (i > -1) {highlightedNodes.splice(i,1);};
    }

    renderNodeHighlight(nodeId);
}

const unhighlightAllNodes = () =>
{
    highlightedNodes.map
    (
        (nodeId) =>
        {
            nodes[nodeId]["highlighted"] = false;
            renderNodeHighlight(nodeId);
        }
    );
    highlightedNodes = [];
}

const flashNode = (nodeId,flash=0) =>
{
    if (flash < 6)
    {
        highlightNode(nodeId);
        setTimeout(() => {flashNode(nodeId,flash+1);},250);
    }
} 

const startReverseTraverse = (nodeId) =>
{
    const traversedNodes = [];
    unhighlightAllNodes(); 
    removeAllLinkTraverse(); 
    reverseTraverse(nodeId,traversedNodes);
}

const findFinancialValues = (allNodes) =>
{
    const allFinances = []
    allNodes.map
    (
        (nodeId) => 
        {
            const node = nodes[nodeId];
            if (node.finance) allFinances.push(node.finance);
        }
    );
    return allFinances;
}

const reverseTraverse = (nodeId,traversedNodes) =>
{
    const node = nodes[nodeId];
    highlightNode(nodeId);
    selectNode(nodeId);
    traversedNodes.push(nodeId);
    if (node["parentNodes"].length == 0)
    {
        const finance = findFinancialValues(traversedNodes);
        if (finance.length > 0) renderGraph(finance);
    }
    else if (node["parentNodes"].length > 1)
    {
        for (let i in node["parentNodes"])
        {
            const parentNodeId = node["parentNodes"][i]
            const parentNode = nodes[parentNodeId];

            if (parentNode["selected"])
            {
                return setTimeout
                (
                    () => 
                    {
                        renderLinkTraverse(parentNodeId,nodeId);
                        setTimeout(()=>reverseTraverse(parentNode["nodeId"],traversedNodes),animationDelay);
                    },
                    animationDelay
                );
            }
        }

        traversedNodes = [];
        toast("Please select one of these nodes (right click)");
        node["parentNodes"].map( (nodeId) => {flashNode(nodeId)} );
    }
    else
    {
        const nextId = node["parentNodes"][0];
        renderLinkTraverse(nextId,nodeId);
        setTimeout(() => {reverseTraverse(nextId,traversedNodes)},100);
    }
}

const generateNode = (nodeId) =>
{
    let html = "<div id=\"node-root-"+nodeId+"\" class=\"node-root\" ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\" draggable=\"true\" ondragstart=\"drag(event)\"><table><tbody><tr>";

    const node = nodes[nodeId];

    html += "<td><div id=\"node-name-"+nodeId+"\" class=\"node-name\" style=\"border:1px solid black\">";
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
