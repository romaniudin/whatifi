const {async_collection} = require("./apiHelper");

const checkRequired = (item,type,required) =>
{
    const missing = [];

    const allKeys = Object.keys(item);
    for (let i in required)
    {
        if (allKeys.indexOf(required[i]) == -1)
        {
            missing.push(required[i]);
        }
    }

    if (missing.length > 0)
    {
        throw {
            "success":false,
            "internal":true,
            "status":400,
            "message":"Missing "+type+" details",
            "info":missing
        };
    }

    return true;
}

const verifyScenario = (item) =>
{
    checkRequired(item,"scenario",["identifier","items"]);
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

const deleteItem = async (account,query) =>
{
    const type = query["type"];
    const identifier = query["identifier"];
    console.log(`[Delete Items] ${account}: ${JSON.stringify(query)}`);

    if (!type || itemVerification[type] == null)
    {
        console.log(`[Delete error] Invalid type: ${type}`);
        return {
            "success":false,
            "internal":true,
            "status":400,
            "message":"Invalid item type: "+type
        };
    }

    if (!identifier || identifier == "")
    {
        console.log(`[Delete error] No identifier ${identifier}`);
        return {
            "success":false,
            "internal":true,
            "status":400,
            "message":"No identifier"
        };
    }


    try
    {
        const collection = await async_collection(type);
        await collection.remove({"account":account,"identifier":identifier});
        console.log(`[Delete] Successful - account:${account} type:${type} identifier:${identifier}`);
        return {
            "success":true,
            "internal":true,
            "status":200,
            "message":"Delete success",
            "info":{"type":type,"identifier":identifier}
        };
    }
    catch (e)
    {
        console.log(`[Delete error] ${e}`);
        return {
            "success":false,
            "internal":true,
            "status":400,
            "message":"Delete error"
        };
    }
}

const getItems = async (account,query) =>
{
    const type = query["type"];
    console.log(`[Get Items] ${account}: ${JSON.stringify(query)}`);

    if (type && type != "all" && itemVerification[type] == null)
    {
        throw "Invalid item type: "+type;
    }

    let collections = {};
    if (type == null || type == "all")
    {
        const allCollections = Object.keys(itemVerification);
        for(let i in allCollections)
        {
            const collection = await async_collection(allCollections[i]);
            const items = await collection.find({"account":account}).toArray();
            collections[allCollections[i]] = items;
        }
    }
    else
    {
        const collectionQuery = query;
        delete collectionQuery["type"];
        collectionQuery["account"] = account;

        const collection = await async_collection(type);
        const items = await collection.find(collectionQuery).toArray();
        collections[type] = items;
    }

    return collections;
}

const saveItem = async (item,account,update) =>
{
    let type,identifier;
    try
    {
        type = await verifyItem(item);
        const collection = await async_collection(type);

        const toSave = item["details"];
        toSave["account"] = account;
        identifier = toSave["identifier"];
        if(update)
        {
            const attempt = await collection.updateOne
            (
                {
                    "account":account,
                    "identifier":identifier
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
            "internal":true,
            "status":200,
            "message":update ? "Item updated" : "Item saved",
            "info":{"type":type,"identifier":identifier}
        }
    }
    catch (error)
    {
        console.log(error);
        if (error.internal)
        {
            throw error;
        }

        if (item == null)
        {
            throw {
                "success":false,
                "internal":true,
                "status":400,
                "message": "Received empty/null item"
            }
        }
        else
        {
            throw {
                "success":false,
                "internal":true,
                "status":400,
                "message": update ? "Item does not exist for account" : "Item already exists for account",
                "info":{"type":type,"identifier":identifier}
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
            "internal":true,
            "status":400,
            "message":"Invalid item type: "+type
        }
    }

    if (!item.details)
    {
        throw {
            "success":false,
            "internal":true,
            "status":400,
            "message":"Item details missing"
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

module.exports = {validItemTypes,getItems,saveItem,deleteItem}
