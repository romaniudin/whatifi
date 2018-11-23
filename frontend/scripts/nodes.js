"use strict";
let currentTraverse;

const animationDelay = 150;
const nodes = {};
const orderedNodes = [];
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
    node["minimized"] = parentNode["minimized"];

    if (orderedNodes.indexOf(nodeId) == -1) orderedNodes.push(nodeId);
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
    let nodeId = "node-"+nodeName.toLowerCase().split(" ").join("_");
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
        "subNodes":{},
        "selected":false,
        "highlighted":false,
        "expanded":false,
        "toInherit":null,
        "type":nodeType,
    };

    for (let key in nodeDetails)
    {
        if (node[key] != null) {continue}
        node[key] = nodeDetails[key];
    }

    nodes[nodeId] = node;
    if (orderedNodes.indexOf(nodeId) == -1) orderedNodes.push(nodeId);

    return nodeId;
}

const addNewGroupTo = (nodeId,parentNodeId) =>
{
    const node = nodes[nodeId];
    const parentNode = nodes[parentNodeId];

    node.toInherit = parentNode.toInherit;
    parentNode.toInherit = node.nodeId;
    let nodeLevel = (parentNode.level+1);

    if (parentNode.childrenNodes.length > 0)
    {
        nodeLevel += (parentNode.childrenNodes.length > 0);
        parentNode.childrenNodes.map
        (
            childrenNodeId =>
            {
                const childNode = nodes[childrenNodeId];
                childNode.childrenNodes.push(node.nodeId);

                const index = childNode.childrenNodes.indexOf(node.toInherit);
                if (node.toInherit && index != -1)
                {
                    childNode.childrenNodes.splice(index,1);
                    node.parentNodes.push(childrenNodeId);
                }
            }
        );
    }
    else
    {
        parentNode.childrenNodes.push(nodeId);
    }

    shiftNodes(nodeLevel-1,1);
    node.level = nodeLevel;

    if (node.toInherit)
    {
        node.childrenNodes = [node.toInherit];
        const inheritedNode = nodes[node.toInherit];
        inheritedNode.parentNodes = [nodeId];
    }
}

const addNewSubNodeTo = (nodeId,nodeName,nodeDetails) =>
{
    const node = nodes[nodeId];
    let nodeNumber = 1;
    let subNodeId = "sub-node-"+nodeName.toLowerCase().split(" ").join("_");
    while (nodes[subNodeId] != null)
    {
        nodeNumber += 1;
        subNodeId = "node-"+nodeName.toLowerCase()+"-"+nodeNumber.toString();
    }

    nodeDetails["subNodeId"] = subNodeId;
    nodeDetails["subNodeName"] = nodeName;
    node["subNodes"][subNodeId] = nodeDetails;
    if (node.expanded)
    {
        node.expanded = false;
        generateSubNodeDisplay();
        node.expanded = true;
        generateSubNodeDisplay();
    }
    else
    {
        render(false);
    }
}

const removeSubNodeFrom = (nodeId,nodeName) =>
{
    const node = nodes[nodeId];
    delete(node["subNodes"][nodeName]);
    generateSubNodeDisplay();
}
const addNewNodeTo = (parentId,nodeName,type,nodeDetails) =>
{
    const node = addNode(nodeName,type,nodeDetails);
    const isGroup = type == "group";
    const parentNode = nodes[parentId];

    if (isGroup && parentNode.type != "me")
    {
        addNewGroupTo(node,parentId);
    }
    else
    {
        addChild(node,parentId,!isGroup,isGroup);
    }

    render(false);
    return node;
}

const shiftNodes = (level,shift) =>
{
    orderedNodes.map
    (
        nodeId =>
        {
            const childNode = nodes[nodeId];
            childNode.level += childNode.level > level ? shift : 0;
        }
    )
}

const removeChildren = (nodeId) =>
{
    const node = nodes[nodeId];
    const toRemove = node.childrenNodes.concat([]);
    toRemove.map
    (
        childNodeId =>
        {
            const childNode = nodes[childNodeId];
            if (childNode.type != "group") removeNode(childNodeId);
        }
    );
}

const removeNode = (nodeId) =>
{
    const node = nodes[nodeId];

    if (node.type == "group")
    {
        removeChildren(nodeId);

        Object.keys(nodes).map
        (
            _nodeId =>
            {
                const _node = nodes[_nodeId];
                if (_node.toInherit == nodeId)
                {
                    _node.toInherit = node.toInherit;
                }
            }
        )
    }

    let onlyChild = true;
    node.parentNodes.map
    (
        parentNodeId =>
        {
            const parentNode = nodes[parentNodeId];
            const nodeIndex = parentNode.childrenNodes.indexOf(nodeId);
            parentNode.childrenNodes.splice(nodeIndex,1);

            if (parentNode.childrenNodes.length == 0)
            {
                if (node.childrenNodes.length > 0)
                {
                    parentNode.childrenNodes = node.childrenNodes.concat([]);
                }
                else if (parentNode.toInherit)
                {
                    parentNode.childrenNodes.push(parentNode.toInherit);
                }
                else
                {
                    parentNode.childrenNodes = [];
                }
            }
            else
            {
                onlyChild = false;
            }
        }
    )
    if (onlyChild) shiftNodes(node.level,-1);

    node.childrenNodes.map
    (
        childNodeId =>
        {
            const childNode = nodes[childNodeId];
            const index = childNode.parentNodes.indexOf(nodeId);

            if (index != -1) childNode.parentNodes.splice(index,1);

            if (childNode.parentNodes.length == 0)
            {
                childNode.parentNodes = node.parentNodes;
            }
        }
    );

    delete(nodes[nodeId]);
    const index = orderedNodes.indexOf(nodeId);
    orderedNodes.splice(index,1);

    d3.selectAll(`#${nodeId}-element`).remove();

    render(false);
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

const updateSubNodeDetails = (nodeId,subNodeId,subNodeDetails) =>
{
    const node = nodes[nodeId];
    const subNode = node.subNodes[subNodeId];
    for (const detail in subNodeDetails)
    {
        subNode[detail] = subNodeDetails[detail];
    }

    d3.select(`text#parent_${nodeId}_sub_${subNodeId}`).text(subNode.subNodeName);
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
    if (node.selected && node.minimized)
    {
        collapseChildNodes(node.parentNodes[0]);
    }
    node.selected ? unselectNode(nodeId) : selectNode(nodeId);
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

const toggleNodeHighlight = (nodeId) =>
{
    const node = nodes[nodeId];
    if (node.highlighted)
    {
        unhighlightNode(nodeId);
    }
    else
    {
        highlightNode(nodeId);
    }
}

const highlightNode = (nodeId) =>
{
    const node = nodes[nodeId];
    node.highlighted = true;
    renderNodeHighlight(nodeId);
}

const unhighlightNode = (nodeId) =>
{
    const node = nodes[nodeId];
    node.highlighted = false;
    renderNodeHighlight(nodeId);
}

const unhighlightAllNodes = () =>
{
    Object.keys(nodes).map
    (
        (nodeId) =>
        {
            unhighlightNode(nodeId);
        }
    );
}

const flashNode = (nodeId,flash=0) =>
{
    if (flash == 0) unhighlightNode(nodeId);

    if (flash < 6)
    {
        toggleNodeHighlight(nodeId);
        setTimeout(() => {flashNode(nodeId,flash+1);},250);
    }
    else
    {
        unhighlightNode(nodeId);
    }
} 

const startReverseTraverse = (nodeId,showGraph=true,fastTraverse=false) =>
{
    currentTraverse = [];
    unhighlightAllNodes(); 
    removeAllLinkTraverse(); 
    reverseTraverse(nodeId,currentTraverse,showGraph,fastTraverse);
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
            if (node.subNodes && Object.keys(node.subNodes).length > 0)
            {
                Object.keys(node.subNodes).map
                (
                    subNodeId =>
                    {
                        const subNode = node.subNodes[subNodeId];
                        if (subNode.finance) allFinances.push(subNode.finance);
                    }
                )
            }
        }
    );
    return allFinances;
}

const compareChildNodes = (nodeId) =>
{
    unhighlightAllNodes();
    const finances = [];
    const node = nodes[nodeId];

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
            const childNode = nodes[childNodeId];
            finances.push
            (
                {
                    "identifier":childNodeId,
                    "option":childNode.nodeName,
                    "finance":findFinancialValues([childNodeId]),
                    "nodes":[childNodeId]
                }
            );
        }
    );

    currentScenario = finances;
    renderGraph(finances);
}

const minimizedNodes = [];
const collapseChildNodes = (nodeId) =>
{
    const node = nodes[nodeId];

    let childSelected = false;
    let isOnlyChildAGroup = true;
    let childIdSelected;
    node.childrenNodes.map
    (
        (childNodeId) =>
        {
            childSelected |= nodes[childNodeId].selected;
            isOnlyChildAGroup &= nodes[childNodeId].type == "group";
            if (nodes[childNodeId].selected) childIdSelected = childNodeId;
        }
    );

    if (node.childrenNodes.length == 0 || (node.childrenNodes.length == 1 && isOnlyChildAGroup))
    {
        toast("Please add a child node before minimizing");
        flashNode(nodeId);
        return;
    }

    if (!childSelected)
    {
        if (node.childrenNodes.length == 1)
        {
            selectNode(node.childrenNodes[0]);
        }
        else
        {
            toast("Please select one of these nodes before minimizing (right click)");
            node["childrenNodes"].map( (nodeId) => {flashNode(nodeId)} );
            return;
        }
    }

    const temp = currentNodeExpanded;
    if (temp)
    {
        nodes[temp].expanded = false;
        generateSubNodeDisplay();
    }

    node["minimized"] = !node["minimized"];
    const level = node.level;
    if (node["minimized"])
    {
        minimizedNodes.push(level);
    }
    else
    {
        const index = minimizedNodes.indexOf(level)
        if (index != -1)
        {
            minimizedNodes.splice(index,1);
        }
    }

    node.childrenNodes.map
    (
        (childNodeId) =>
        {
            const childNode = nodes[childNodeId];
            childNode["minimized"] = node["minimized"];
        }
    );

    if (temp && temp == childIdSelected)
    {
        nodes[temp].expanded = true;
    }
    render(false,true);
}

const reverseTraverse = (nodeId,traversedNodes,showGraph=true,fastTraverse=false) =>
{
    const node = nodes[nodeId];
    const traverseDelay = fastTraverse ? 0 : animationDelay;
    toggleNodeHighlight(nodeId);
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
        if (finance.length > 0 && showGraph)
        {
            currentScenario = [{"identifier":"current-option","option":"Current Option","finance":finance,"nodes":traversedNodes}];
            renderGraph(currentScenario);
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
                        setTimeout(()=>reverseTraverse(parentNode["nodeId"],traversedNodes,showGraph,fastTraverse),traverseDelay);
                    },
                    traverseDelay
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
        setTimeout(() => {reverseTraverse(nextId,traversedNodes,showGraph,fastTraverse)},traverseDelay);
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
    let count = 0;
    allOptions.map
    (
        (option,i) =>
        {
            count += 1;
            allFinances.push({"option":`Option ${count}`,"identifier":`option-${i}`,"finance":findFinancialValues(option),"nodes":option});
        }
    );
    currentScenario = allFinances;
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
