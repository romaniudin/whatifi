const {BasicStrategy} = require("passport-http");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const passwordValidator = require("password-validator");

const {async_collection} = require("./apiHelper");

const async_verify = async (username,password) =>
{
    try
    {
        const collection = await async_collection("credentials");
        if (collection == null)
        {
            throw {"success":false,"code":500,"message":"Server Error"};
        }

        const user = await collection.findOne({"username":username});
        if (user == null)
        {
            throw {"success":false,"code":401,"message":"Incorrect credentials"};
        }

        const valid = await bcrypt.compare(password,user["hash"]);

        if (valid)
        {
            return {
                "success":true,
                "code":200,
                "username":username,
                "message": user["resetRequired"] ? "Password reset required" : "Success"
            };
        }
        else
        {
            throw {"success":false,"code":401,"message":"Incorrect credentials"};
        }
    }
    catch (e)
    {
        return e;
    }
}

passport.use( new BasicStrategy( async (username,password,done) =>
{
    const verify = await async_verify(username,password);

    return done
    (
        null,
        verify
    );
}));

const verifyLogin = () => { return passport.authenticate("basic",{session:false}) }

const passwordSchema = new passwordValidator();
passwordSchema
.is().min(8)
.is().max(100)
.has().uppercase()
.has().lowercase()
.has().digits()
.has().symbols()

const passwordErrors =
{
    "min":"at least 8 characters",
    "max":"at most 100 characters",
    "uppercase":"at least 1 uppercase",
    "lowercase":"at least 1 lowercase",
    "digits":"at least 1 digit",
    "symbols":"at least 1 symbol"
}

const validatePassword = (password) =>
{
    const errors = passwordSchema.validate(password,{list:true});
    return errors.map(entry => {return passwordErrors[entry] ? passwordErrors[entry] : "Unknown error"});
}

const createAccount = async (account) =>
{
    try
    {
        const connection = await async_collection("credentials");
        await connection.insertOne(account);

        return {
            "success":true,
            "status":200,
            "message":"Account created"        
        }
    }
    catch (error)
    {
        let errorStatus = 500;
        let message = "Server error"

        if (error["code"] == 11000)
        {
            errorStatus = 400;
            message = error["errmsg"].includes("username")  ? "Username" : "Email"  + " already in use";
        }

        throw {
            "success":false,
            "status":errorStatus,
            "message":message
        }
    }
}

module.exports = {verifyLogin,validatePassword,createAccount}
