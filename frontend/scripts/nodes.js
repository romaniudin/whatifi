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

const addChild = (nodeId,parentNodeId,isVariant=false) =>
{
    if (isParent(nodeId,parentNodeId))
    {
        return;
    }

    if (nodes[parentNodeId] == null)
    {
        return toast("Parent node does not exist");
    }

    if (orderedNodes.indexOf(nodeId) == -1) orderedNodes.push(nodeId);

    const node = nodes[nodeId];
    const parentNode = nodes[parentNodeId];
    inheritNodes(node,parentNode,isVariant);
}

const inheritNodes = (childNode,parentNode,isVariant=false) =>
{
    if (!childNode.toInherit) childNode.toInherit = parentNode.toInherit;
    if (childNode.parentNodes.indexOf(parentNode.nodeId) == -1) childNode.parentNodes.push(parentNode.nodeId);
    childNode.level = parentNode.level+1;

    let childNodeLevel = parentNode.level+1;
    if (childNode.type == "group")
    {
        console.log("adding group");
        addNewGroupTo(childNode.nodeId,parentNode.nodeId);
    }
    else if (childNode.type != "group")
    {
        childNode.minimized = parentNode.minimized;

        let onlyChildIsGroup = true;
        parentNode.childrenNodes.map
        (
            childId =>
            {
                onlyChildIsGroup &= (nodes[childId].type == "group");
            }
        )

        if (parentNode.type != "group") childNode["subType"] = "subNode";

        if ((parentNode.childrenNodes.length > 0 || parentNode.type == "group") && !onlyChildIsGroup)
        {
            const toInherit = parentNode.childrenNodes;
            parentNode.childrenNodes.push(childNode.nodeId);
            if (childNode.parentNodes.indexOf(parentNode.nodeId) == -1) childNode.parentNodes.push(parentNode.nodeId);

            if (parentNode.type == "group")
            {
                childNode.childrenNodes = [parentNode.toInherit];
            }
            else
            {
                childNode.childrenNodes = [childNode.toInherit];
/*
                const allChildren = [];
                toInherit.map
                (
                    inheritId =>
                    {
                        const inheritNode = nodes[inheritId];
                        inheritNode.childrenNodes.map
                        (
                            inheritChildId =>
                            {
                                if (allChildren.indexOf(inheritChildId) == -1) allChildren.push(inheritChildId);
                            }
                        )
                    }
                )
                childNode.childrenNodes = allChildren;
*/
            }
        }
        else
        {
            const toInherit = parentNode.childrenNodes.concat([]);
            parentNode.childrenNodes = [childNode.nodeId];
            childNode.childrenNodes = toInherit;
            console.log(`${childNode.nodeId} inheriting:`,toInherit);

            toInherit.map
            (
                inheritId =>
                {
                    const inheritNode = nodes[inheritId];
                    const oldParent = inheritNode.parentNodes.indexOf(parentNode.nodeId);
                    if (inheritNode.parentNodes.indexOf(childNode.nodeId) == -1) inheritNode.parentNodes.push(childNode.nodeId);
                }
            )
        }
    }

    childNode.level = childNodeLevel;

    let groupInLevel = false;
    Object.keys(nodes).map
    (
        nodeId =>
        {
            const node = nodes[nodeId];
            if (node.level == childNodeLevel && node.type == "group") groupInLevel = true;
        }
    )
    if (groupInLevel)
    {
        shiftNodes(childNode.level-1,1,childNode.nodeId);
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
    let allChildren = parentNode.childrenNodes;

    if (parentNode.childrenNodes.length > 0)
    {
        let containsGroup = false;
        while (allChildren.length > 0 && !containsGroup)
        {
            let nextChildren = [];
            allChildren.map
            (
                childNodeId =>
                {
                    const childNode = nodes[childNodeId];
                    if (childNode.level > nodeLevel) nodeLevel = childNode.level;
                    if (childNode.childrenNodes.length > 0) nextChildren = nextChildren.concat(childNode.childrenNodes);
                    containsGroup |= (childNode.type == "group");
                }
            );
        }
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

const addNewNodeTo = (parentId,nodeName,type,nodeDetails,isVariant=false) =>
{
    const parentNode = nodes[parentId];
    const nodeId = addNode(nodeName,type == "inherit" ? "income" : type,nodeDetails);
    const isGroup = type == "group";
    addChild(nodeId,parentId,isVariant);

    render(false);
    return nodeId;
}

const shiftNodes = (level,shift,skipNodeId=null) =>
{
    orderedNodes.map
    (
        nodeId =>
        {
			if (nodeId == skipNodeId) return;
            const childNode = nodes[nodeId];
            childNode.level += childNode.level > level ? shift : 0;
        }
    )
}

const shiftNodeTree = (nodesToShift=[],shift=1,skipShift=null) =>
{
    while (nodesToShift.length > 0)
    {
        let containsGroup = false;
        nodesToShift.map
        (
            toShift =>
            {
                const nodeToShift = nodes[toShift];
                containsGroup |= nodeToShift.type == "group";
            }
        );
        if (containsGroup) break;

        let nextNodes = [];
        nodesToShift.map
        (
            toShift =>
            {
                const nodeToShift = nodes[toShift];
                nextNodes.concat(nodeToShift.childrenNodes);
                nodeToShift.level += shift;
            }
        );
        nodesToShift = nextNodes;
    }
}

const removeTree = (rootNodeId) =>
{
    const toRemove = obtainPaths
    (
        [[rootNodeId]],
        nodeId =>
        {
            return nodes[nodeId].type != "group"
        }
    );

    const uniqueNodes = [];
    toRemove.map
    (
        path =>
        {
            path.map(
                nodeId =>
                {
                    if (uniqueNodes.indexOf(nodeId) == -1) uniqueNodes.push(nodeId);
                }
            );
        }
    );

    uniqueNodes.map
    (
        nodeId =>
        {
            removeNode(nodeId);
        }
    )
}

const removeChildren = (allNodes) =>
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
    console.log(nodeId);

    if (node.type == "group")
    {
        node.parentNodes.map
        (
            parentNodeId =>
            {
                const parentNode = nodes[parentNodeId];
                const nodeIndex = parentNode.childrenNodes.indexOf(nodeId);
                parentNode.childrenNodes.splice(nodeIndex,1);
                if (node.toInherit) parentNode.childrenNodes.push(node.toInherit);
            }
        )

        node.childrenNodes.map
        (
            childNodeId =>
            {
                const childNode = nodes[childNodeId];
                const nodeIndex = childNode.parentNodes.indexOf(nodeId);
                childNode.parentNodes.splice(nodeIndex,1);
            }
        )
    }
    else
    {
        const parentNodeId = node.parentNodes[0];
        const parentNode = nodes[parentNodeId];
        const nodeIndex = parentNode.childrenNodes.indexOf(nodeId);
        parentNode.childrenNodes.splice(nodeIndex,1);
        if (parentNode.childrenNodes.length == 0)
        {
            parentNode.childrenNodes.push(parentNode.toInherit);// = parentNode.childrenNodes.concat(node.childrenNodes);
        }

        node.childrenNodes.map
        (
            childNodeId =>
            {
                const childNode = nodes[childNodeId];
                const nodeIndex = childNode.parentNodes.indexOf(nodeId);
                childNode.parentNodes.splice(nodeIndex,1);
                if (childNode.parentNodes.length == 0 && childNode.parentNodes.indexOf(parentNodeId) == -1)
                {
                    childNode.parentNodes.push(parentNodeId);
                    if (parentNode.childrenNodes.indexOf(childNodeId) == -1) parentNode.childrenNodes.push(childNodeId);
                    console.log(childNodeId,parentNodeId,childNode.parentNodes);
                }
            }
        )
    }

    let levelEmpty = true;
    Object.keys(nodes).map
    (
        _nodeId =>
        {
            const _node = nodes[_nodeId];
            if (_nodeId != nodeId && _node.level == node.level) levelEmpty = false;
        }
    )

    console.log("is level empty",node.level);
    if (levelEmpty)
    {
        console.log("level empty");
        shiftNodes(node.level-1,-1);
    }

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
    let options = obtainPaths([[nodeId]]);
    const allFinances = [];
    let count = 0;
    options.map
    (
        (option,i) =>
        {
            count += 1;
            allFinances.push({"option":`Option ${count}`,"identifier":`option-${i}`,"finance":findFinancialValues(option),"nodes":option});
        }
    );
    currentScenario = allFinances;
    console.log(allFinances);
    renderGraph(allFinances);
}

const obtainPaths = (startingNodes,isValid=null) =>
{
    let options = startingNodes;
    let traverse;
    do
    {
        traverse = forwardTraverse(options,isValid);
        options = traverse.result; 
    }
    while (traverse.continue)

    return options;
}

const forwardTraverse = (currentOptions,isValid=(nodeId)=>{return true}) =>
{
    const nextOptions = [];
    let shouldContinue = true;
    currentOptions.map
    (
        option =>
        {
            const latestNodeId = option[option.length-1];
            const node = nodes[latestNodeId];

            node.childrenNodes.map
            (
                childNodeId =>
                {
                    if (shouldContinue && isValid(childNodeId))
                    {
                        nextOptions.push(option.concat([childNodeId]));
                    }
                    else
                    {
                        shouldContinue = false;
                    }
                }
            )
        }
    )

    if (shouldContinue && nextOptions.length > 0)
    {
        return {"continue":shouldContinue,"result":nextOptions}
    }
    else
    {
        return {"continue":false,"result":currentOptions}
    }
}
