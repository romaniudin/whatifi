const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const emailValidator = require("email-validator");

const {encrypt} = require("./apiHelper");
const {createAccount,validatePassword} = require("./account");
const {validItemTypes,getItems,saveItem} = require("./items");

const saltRounds = 10;
const tokenSalt = "fdsgf$#QFDSA324gfa23113&hhSDg312";
const isEmpty = str => {return str == "" || str == null};

const verifyToken = (token) =>
{
    try
    {
        jwt.verify(token,tokenSalt);
        return true;
    }
    catch (error)
    {
        console.log(error);
        throw "Invalid token";
    }
}

const loginAPI = async (req,res) =>
{
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
        console.log("[Login]",req.user["username"]);
    }
    catch (e)
    {
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
    const username = req.body["username"];
    const password = req.body["password"];
    const email = req.body["email"];

    try
    {
        verifyToken(req.headers["authorization"].split(" ")[1]);

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
        const hash = await bcrypt.hash(password,saltRounds);
        const create = await createAccount({"username":username,"hash":hash,"email":email});
        res.json(create);
        console.log("[Create Account] Username:",req.body["username"],", Email:",req.body["email"]);
    }
    catch (e)
    {
        res.json(e);
    }
}

const validItemsAPI = (req,res) =>
{
    res.json(validItemTypes);
}

const getItemsAPI = async (req,res) =>
{
    try
    {
        const result = await getItems(req.query);
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
        console.log(error);
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

const saveItemAPI = async (req,res) =>
{
    try
    {
        const save = await saveItem(req.body,req.params.account);
        res.json(save);
    }
    catch (error)
    {
        console.log(error);
        res.json(error);
    }
}

module.exports = {loginAPI,createAccountAPI,validItemsAPI,getItemsAPI,saveItemAPI}
