const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const {loginAPI,createAccountAPI,validItemsAPI,getItemsAPI,saveItemAPI} = require("./api");
const {setCorsHeaders,middlewareError,decodeToken} = require("./apiHelper");
const {verifyLogin} = require("./account");
const {validItemTypes,verifyItem} = require("./items");

const apiPort = 8080;

const parseErrorHandler = middlewareError("Parsing error");

app.use("/login",setCorsHeaders);
app.use("/login",bodyParser.json(),parseErrorHandler);
app.use("/login",verifyLogin());
app.post("/login",loginAPI);

app.use("/create",setCorsHeaders);
app.use("/create",bodyParser.json(),parseErrorHandler);
app.post("/create",createAccountAPI);

app.use("/validItems",setCorsHeaders);
app.get("/validItems",validItemsAPI);

app.use("/getItems/:account",setCorsHeaders);
app.get("/getItems/:account",decodeToken,getItemsAPI);

app.use("/saveItem/:account",setCorsHeaders);
app.use("/saveItem/:account",bodyParser.json(),parseErrorHandler);
app.post("/saveItem/:account",decodeToken,saveItemAPI);

app.listen(apiPort, () => console.log(`listening to port ${apiPort}`));
