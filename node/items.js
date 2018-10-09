const {async_collection} = require("./apiHelper");

const checkRequired = (item,type,required) =>
{
    const missing = [];

    for (let i in required)
    {
        if (item[required[i]] == null)
        {
            missing.push(required[i]);
        }
    }

    if (missing.length > 0)
    {
        throw {
            "success":false,
            "status":400,
            "message":"Missing "+type+" details",
            "info":missing
        };
    }

    return true;
}

const verifyScenario = (item) =>
{
    checkRequired(item,"scenario",["identifier","nodes"]);
}

const verifyIncome = (item) =>
{
    checkRequired(item,"income",["identifier","value","start","end","period"]);
}

const verifyExpense = (item) =>
{
    checkRequired(item,"expense",["identifier","value","start","end","period"]);
}

const verifyUser = (item) =>
{
    checkRequired(item,"user",["identifier","firstName","lastName"]);
}

const itemVerification =
{
    "scenario":verifyScenario,
    "income":verifyIncome,
    "expense":verifyExpense,
    "user":verifyUser
}
const validItemTypes = Object.keys(itemVerification);

const getItems = async (account,query) =>
{
    const type = query["type"];

    if (type && type != "all" && itemVerification[type] == null)
    {
        throw "Invalid item type: "+type;
    }

    let collections = {};
    let allCollections = [];
    if (type == null || type == "all")
    {
        allCollections = Object.keys(itemVerification);
    }
    else
    {
        allCollections.push(type);
    }

    for(let i in allCollections)
    {
        const collection = await async_collection(allCollections[i]);
        const items = collection.find({"account":account}).toArray();
        collections[allCollections[i]] = items;
    }

    let allItems = {};
    for (let i in collections)
    {
        try
        {
            const items = await collections[i];
            allItems[i] = items;
        }
        catch (error)
        {
            console.log(error);
        }
    }

    return allItems;
}

const saveItem = async (item,account,update) =>
{
    try
    {
        const type = await verifyItem(item);
        const collection = await async_collection(type);

        const toSave = item["details"];
        toSave["account"] = account;
        if(update)
        {
            const attempt = await collection.updateOne
            (
                {
                    "account":toSave["account"],
                    "identifier":toSave["identifier"]
                },
                {"$set":toSave},
                {upsert:false}
            );
            if (attempt.result.n == 0) throw "Item does not exist";
        }
        else
        {
            await collection.insertOne
            (
                toSave
            );
        }

        return {
            "success":true,
            "status":200,
            "message":update ? "Item updated" : "Item saved"
        }
    }
    catch (error)
    {
        if (item == null)
        {
            throw {
                "success":false,
                "status":400,
                "message": "Received empty/null item"
            }
        }
        else
        {
            throw {
                "success":false,
                "status":400,
                "message": update ? "Item does not exist for account" : "Item already exists for account"
            }
        }
    }
}

const verifyItem = async (item) =>
{
    const type = item["type"];
    const verify = itemVerification[type];
    if (verify == null)
    {
        throw {
            "success":false,
            "status":400,
            "message":"Invalid item type: "+type
        }
    }

    try
    {
        verify(item["details"]);
        return type;
    }
    catch (error)
    {
        throw error;
    }
}

module.exports = {validItemTypes,getItems,saveItem}