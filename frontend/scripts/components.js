"use strict";
const e = React.createElement;

class Node extends React.Component
{
    render()
    {
        return e
        (
            "div",
            {
                id:this.props.nodeId,
                value:
                JSON.stringify({
                    "parent":this.props.parentNode,
                    "children":this.props.childrenNode
                })
            },
            this.props.nodeName
        );
    }
}

const createNode = (nodeName,nodeId,parentNode=null,childrenNode=[]) =>
{
    ReactDOM.render
    (
        e
        (
            Node,
            {
                nodeId:nodeId,
                nodeName:nodeName,
                parentNode:parentNode,
                childrenNode:childrenNode
            },
            null
        ),
        document.getElementById("test")
    )
}

