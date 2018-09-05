const bcrypt = require("bcrypt");
const passport = require("passport");
const basicStrategy = require("passport-http").BasicStrategy;
const mongo = require("mongodb").MongoClient;
const jwt = require("jsonwebtoken");

const saltRounds = 10;

const setCorsHeaders = (req,res,next) =>
{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers", ["Authorization","content-type"]);
    next();
}

const async_verify = async (username,password) => {

    try
    {
        const connection = await mongo.connect("mongodb://127.0.0.1:27017",{useNewUrlParser:true});
        const res = await connection.db("whatifi").collection("users").findOne({"username":username});
        const compare = await bcrypt.compare(password,res["hash"]);

        return compare;
    }
    catch (e) {return false}
}

passport.use(new basicStrategy( async (username,password,done) => {

    const v = await async_verify(username,password);
    done(null,v ? username : v);
}));

const verifyLogin = () => { return passport.authenticate("basic",{session:false})};

const loginRequest = async (req,res) =>
{
    try
    {
        const token = await jwt.sign({"username":req.user},"testtokensalt!@#@!##213",{expiresIn:"10m"});
        res.json({"token":token});
    }
    catch (e)
    {
        res.sendStatus(401);
    }
}

const createAccount = (account) => new Promise((resolve,reject) => {

    mongo.connect("mongodb://127.0.0.1:27017",{useNewUrlParser:true}, (err,connection) => {

        if (err) {return reject(err["errmsg"]);}

        connection.db("whatifi").collection("users").insertOne(account, (err,res) => {

            if (err) {return reject(err["errmsg"]);}
            resolve();
        });
    }); 
});

const createAccountRequest = async (req,res) =>
{
    console.log("create account",req.body);
    const username = req.body["username"];
    const password = req.body["password"];
    const email = req.body["email"];

    if (username == "" || password == "" || email == ""){return res.sendStatus(401);}

    try
    {
        const hash = await bcrypt.hash(password,saltRounds);
        await createAccount({"username":username,"hash":hash,"email":email});
        res.sendStatus(200);
    }
    catch (e)
    {
        console.log(e);
        res.sendStatus(401);
    }
}

module.exports = {setCorsHeaders,verifyLogin,loginRequest,createAccountRequest}
