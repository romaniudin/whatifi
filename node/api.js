const bcrypt = require("bcrypt-nodejs");
const jwt = require("jsonwebtoken");
const emailValidator = require("email-validator");

const {encrypt} = require("./apiHelper");
const {createAccount,validatePassword} = require("./account");
const {validItemTypes,getItems,saveItem,deleteItem} = require("./items");

const saltRounds = 10;
const tokenSalt = "fdsgf$#QFDSA324gfa23113&hhSDg312";
const isEmpty = str => {return str == "" || str == null};

const verifyToken = async (token,username) =>
{
    try
    {
        const details = await jwt.verify(token,tokenSalt);
        if (details.username == null || username == null || username != details.username) {throw {"message":"Mismatched token"}}
        return {"success":true};
    }
    catch (error)
    {
        console.log("[Invalid token]",error.message);
        return {"success":false,"message":error.message};
    }
}

const loginAPI = async (req,res) =>
{
    console.log("[Login - Attempt]",req.user)
    if (!req.user["success"])
    {
        return res.json(req.user);
    }

    try
    {
        const token = await jwt.sign({"username":req.user["username"]},tokenSalt,{expiresIn:"24h"});
        res.json
        (
            {
                "success":true,
                "status":200,
                "message":"Successful login",
                "token":encrypt(token),
                "resetRequired":req.user["resetRequired"]
            }
        );
        console.log("[Login - Success]",req.user["username"]);
    }
    catch (e)
    {
        console.log("[Login - Failed]",req.user["username"]);
        res.json
        (
            {
                "success":false,
                "status":500,
                "message":e ? e : "Server error"
            }
        );
    }
}

const createAccountAPI = async (req,res) =>
{
    console.log(`[Create Account - Attempt] Username:${req.body.username}`);
    const username = req.body["username"];
    const password = req.body["password"];
    const email = req.body["email"];

    try
    {
        if (isEmpty(username) || isEmpty(password) || isEmpty(email))
        {
            throw {"message":"Missing username, password, and/or email"};
        }
        if (!emailValidator.validate(email))
        {
            throw {"message":"Invalid email"};
        }
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0)
        {
            throw {
                "message": "Invalid password",
                "info":passwordErrors
            }
        }

    }
    catch (error)
    {
        return res.json
        (
            {
                "success":false,
                "status":400,
                "message":error["message"],
                "info":error["info"] ? error["info"] : null
            }
        );
    }

    try
    {
        const hash = bcrypt.hashSync(password,bcrypt.genSaltSync(saltRounds));
        const create = await createAccount({"username":username,"hash":hash,"email":email});
        res.json(create);
        console.log(`[Create Account - Success] Username: ${req.body["username"]}, Email:${req.body["email"]}`);
    }
    catch (e)
    {
        console.log(`[Create Account - Failed] Username: ${req.body["username"]} ${JSON.stringify(e)}`);
        res.json(e);
    }
}

const validItemsAPI = (req,res) =>
{
    res.json(validItemTypes);
}

const getItemsAPI = async (req,res) =>
{
    const tokenResult = await verifyToken(req.token,req.params.account);
    if (!tokenResult.success)
    {
        return res.json
        (
            {
                "success":false,
                "status":401,
                "message":tokenResult.message,
            }
        );
    }

    try
    {
        const result = await getItems(req.params.account,req.query);
        res.json
        (
            {
                "success":true,
                "status":200,
                "message":result
            }
        );
    }
    catch (error)
    {
        console.log("[Get error]",error);
        res.json
        (
            {
                "success":false,
                "status":400,
                "message":error
            }
        )
    }
}

const deleteItemAPI = async (req,res) =>
{
    const tokenResult = await verifyToken(req.token,req.params.account);
    if (!tokenResult.success)
    {
        return res.json
        (
            {
                "success":false,
                "status":401,
                "message":tokenResult.message,
            }
        );
    }

    try
    {
        await deleteItem(req.params.account,req.query);
        res.json
        (
            {
                "success":true,
                "status":200,
                "message":"Deleted item",
                "info":{"type":req.query["type"],"identifier":req.query["identifier"]}
            }
        );
    }
    catch (err)
    {
        console.log("[Delete error]",e);
        res.json
        (
            {
                "success":false,
                "status":400,
                "message":error
            }
        )
    }
}

const saveItemAPI = (req,res) => {modifyItem(req,res,false);}
const updateItemAPI = (req,res) => {modifyItem(req,res,true);}

const modifyItem = async (req,res,update) =>
{
    const tokenResult = await verifyToken(req.token,req.params.account);
    if (!tokenResult.success)
    {
        return res.json
        (
            {
                "success":false,
                "status":401,
                "message":tokenResult.message,
            }
        );
    }

    try
    {
        const save = await saveItem(req.body,req.params.account,update);
        res.json(save);
    }
    catch (error)
    {
        console.log("[Modify error]",error);
        res.json(error);
    }
}

module.exports = {loginAPI,createAccountAPI,validItemsAPI,getItemsAPI,saveItemAPI,updateItemAPI,deleteItemAPI}
