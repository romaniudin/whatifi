"use strict";
let currentTraverse;

const animationDelay = 150;
const nodes = {};
const nodeTypes =
[
    "me",
    "person",
    "expense",
    "income",
    "location",
    "group",
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

const addChild = (nodeId,parentNodeId,inherit=false,setInherit=false) =>
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
    node["level"] = parentNode["level"]+1;
/*
    const levelNodes = [];
    for (const nodeId in nodes)
    {
        const currentNode = nodes[nodeId];
        if (currentNode.level == node.level)
        {
            levelNodes.push(currentNode);
        }
    }

    levelNodes.sort
    (
        (a,b) =>
        {
            if (a.level == b.level)
            {
                return 0;
            }

            return a.level > b.level ? 1 : -1;
        }
    )

    levelNodes.shift(node);
    balanceLevel(levelNodes);*/

    if (setInherit)
    {
        parentNode["toInherit"] = nodeId;
    }
    if (inherit && parentNode.toInherit)
    {
        const inheritNode = nodes[parentNode.toInherit];
        const inheritIndex = parentNode["childrenNodes"].indexOf(parentNode["toInherit"]);

        const oldParentIndex = inheritNode.parentNodes.indexOf(parentNodeId);
        if (oldParentIndex != -1)
        {
            inheritNode.parentNodes.splice(oldParentIndex,1);
        }

        node.childrenNodes.push(parentNode.toInherit);
        inheritNode.parentNodes.push(nodeId);

        if (inheritIndex != -1)
        {
            parentNode["childrenNodes"].splice(inheritIndex,1);
        }

        if (inheritNode.level == node.level)
        {
            traverse
            (
                inheritNode.nodeId,
                null,null,
                (traverseNode) =>
                {
                    traverseNode["level"] += 1;
                }
            );
        }
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
        "toInherit":null,
        "type":nodeType,
    };

    for (let key in nodeDetails)
    {
        if (node[key] != null) {continue}
        node[key] = nodeDetails[key];
    }

    nodes[nodeId] = node;

    return nodeId;
}

const updateNodeDetails = (nodeId,nodeDetails) =>
{
    const node = nodes[nodeId];
    for (const detail in nodeDetails)
    {
        node[detail] = nodeDetails[detail];
    }

    d3.select(`#${nodeId}-element .node-name`).text(node.nodeName);
}

const addNewNodeTo = (parentId,nodeName,type,nodeDetails) =>
{
    const node = addNode(nodeName,type,nodeDetails);
    addChild(node,parentId,true);
    render(false);
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
    render(false);
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
    currentTraverse = [];
    unhighlightAllNodes(); 
    removeAllLinkTraverse(); 
    reverseTraverse(nodeId,currentTraverse);
}

const nodeOptions = (nodeId) =>
{
    const node = nodes[nodeId];
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

const compareChildNodes = (nodeId) =>
{
    const finances = [];
    const node = nodes[nodeId];

    console.log(node);
    if (node.childrenNodes.length == 1 && nodes[node.childrenNodes[0]].type == "group")
    {
        flashNode(nodeId);
        return toast("Please add at least one node");
    }

    node.childrenNodes.map
    (
        (childNodeId) =>
        {
            flashNode(childNodeId);
        }
    );

    node.childrenNodes.map
    (
        (childNodeId) =>
        {
            finances.push(findFinancialValues([childNodeId]));
        }
    );

    renderGraph(finances);
}

const reverseTraverse = (nodeId,traversedNodes) =>
{
    const node = nodes[nodeId];
    highlightNode(nodeId);
    selectNode(nodeId);
    traversedNodes.push(nodeId);
    if
    (
        node.type == "group" && 
        (
            (node.childrenNodes.length == 1 && nodes[node.childrenNodes[0]].type == "group") || 
            node.childrenNodes.length == 0
        )
    )
    {
        traversedNodes = [];
        toast("Please add node to the group (+ button to the right)");
        flashNode(nodeId);
    }
    else if (node["parentNodes"].length == 0)
    {
        const finance = findFinancialValues(traversedNodes);
        if (finance.length > 0)
        {
            currentScenario = [finance];
            renderGraph([finance]);
        }
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

const startForwardTraverse = (nodeId) =>
{
    const node = nodes[nodeId];
    if ( node.type != "me" ) return;

    const forwardTraverseNodes = [[nodeId]];
    forwardTraverse(nodeId,forwardTraverseNodes);
    const allOptions = joinForwardTraverse(forwardTraverseNodes);
    const allFinances = [];
    allOptions.map
    (
        option =>
        {
            allFinances.push(findFinancialValues(option));
        }
    );
    renderGraph(allFinances);
}

const forwardTraverse = (nodeId,traversedNodes,currentLevel=0) =>
{
    const node = nodes[nodeId];
    if (traversedNodes.length <= currentLevel+1) {traversedNodes.push([])}

    node.childrenNodes.map
    (
        (childNode) =>
        {
            if (traversedNodes[currentLevel+1].indexOf(childNode) == -1)
            {
                traversedNodes[currentLevel+1].push(childNode);
            }
        }
    )

    traversedNodes[currentLevel+1].map
    (
        nodeId => forwardTraverse(nodeId,traversedNodes,currentLevel+1)
    );
}

const joinForwardTraverse = (forwardTraverse) =>
{
    let currentLevel = [forwardTraverse[0]];
    for (let i = 1; i < forwardTraverse.length-1; i++)
    {
        currentLevel = joinNextLevel(currentLevel,forwardTraverse[i]);
    }
    return currentLevel;
}

const joinNextLevel = (traverse,nextLevel) =>
{
    const allJoins = [];
    for (const j in nextLevel)
    {
        for (const i in traverse)
        {
            const option = traverse[i].slice();
            option.push(nextLevel[j]);
            allJoins.push(option);
        }
    }
    return allJoins.length > 0 ? allJoins : traverse;
}