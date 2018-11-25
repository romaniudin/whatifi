const whatifiOrange = "#f8b46a";
const whatifiBlue = "#d8e8ff";
const whatifiGrey = "darkslategrey";
const whatifiGray = "darkslategrey";

const borderScheme =
{
    "me":whatifiOrange,
    "group":whatifiOrange,
    "default":whatifiBlue,
}

const imageBorderScheme =
{
    "me":whatifiBlue,
    "group":whatifiOrange,
    "default":whatifiBlue,
}

const backgroundScheme =
{
    "default":"#f5f5f5",
}

const imageBackgroundScheme =
{
    "default":"white",
}

const nodeBorderColour = (node) =>
{
    return (node.selected ? "slategrey"  : borderScheme[node.type]) || borderScheme["default"];
}

const nodeImageBorderColour = (node) =>
{
    return imageBorderScheme[node.type] || imageBorderScheme["default"];
}

const nodeBackgroundColour = (node) =>
{
    return backgroundScheme[node.type] || backgroundScheme["default"];
}

const nodeImageBackgroundColour = (node) =>
{
    return imageBackgroundScheme[node.type] || imageBackgroundScheme["default"];
}
