const {MongoClient} = require("mongodb");
const crypto = require("crypto");

const setCorsHeaders = (req,res,next) =>
{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers", ["Authorization","content-type"]);
    next();
}

const async_collection = async (collection) =>
{
    try
    {
        const connection = await MongoClient.connect("mongodb://127.0.0.1:27017",{useNewUrlParser:true});
        return connection.db("whatifi").collection(collection);
    }
    catch (e)
    {
        console.log(e);
        throw "Server error";
    }
}

const tokenSecret = "ttjh9dsaf12$Sxgfd2Dobfasdf&hg";
const encrypt = (toEncrypt) =>
{
    const cipher = crypto.createCipher("aes-256-cbc",tokenSecret);
    let encrypted = cipher.update(toEncrypt,"utf8","hex");
    encrypted += cipher.final("hex");

    return encrypted;
}

const decrypt = (toDecrypt) =>
{
    const decipher = crypto.createDecipher("aes-256-cbc",tokenSecret);
    let decrypted = decipher.update(toDecrypt,"hex","utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

const decodeToken = (req,res,next) => {

    const bearerHeader = req.headers["authorization"];
    try
    {
        const bearerToken = bearerHeader.split(" ")[1];
        req.token = decrypt(bearerToken);
        next();
    }
    catch (err)
    {
        console.log("[Token Verification Error]",err["name"]);
        res.json
        (
            {
                "success":false,
                "status":403,
                "message":"Invalid token"
            }
        )
    }
}

const middlewareError = (expectedError="Unknown error") =>
{
    return (error,req,res,next) =>
    {
        if (error)
        {
            res.json
            (
                {
                    "success":false,
                    "status":400,
                    "message":expectedError
                }
            )
        }
        else
        {
            next();
        }
    }
}

module.exports = {setCorsHeaders,async_collection,middlewareError,encrypt,decrypt,decodeToken}
