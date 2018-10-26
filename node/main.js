const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const {loginAPI,createAccountAPI,validItemsAPI,getItemsAPI,saveItemAPI,updateItemAPI,deleteItemAPI} = require("./api");
const {setCorsHeaders,middlewareError,decodeToken} = require("./apiHelper");
const {verifyLogin} = require("./account");
const {validItemTypes,verifyItem} = require("./items");

const apiPort = 8080;

const parseErrorHandler = middlewareError("Parsing error");

app.use("/login",setCorsHeaders);
app.get("/login",verifyLogin(),loginAPI);

app.use("/create",setCorsHeaders);
app.use("/create",bodyParser.json(),parseErrorHandler);
app.post("/create",createAccountAPI);

app.use("/validItems",setCorsHeaders);
app.get("/validItems",validItemsAPI);

app.use("/items/:account",setCorsHeaders);
app.get("/items/:account",decodeToken,getItemsAPI);

app.use("/item/:account",setCorsHeaders);
app.use("/item/:account",bodyParser.json(),parseErrorHandler);
app.post("/item/:account",decodeToken,saveItemAPI);
app.put("/item/:account",decodeToken,updateItemAPI);
app.delete("/item/:account",decodeToken,deleteItemAPI);

app.listen(apiPort, () => console.log(`listening to port ${apiPort}`));
