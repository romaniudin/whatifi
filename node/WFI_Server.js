const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;


app.get("/user/:id", function(request,response){
	console.log("users",request.params);
	response.header("Access-Control-Allow-Origin","*");
	MongoClient.connect("mongodb://127.0.0.1:27017",function(err,mongo){
		if (err == null)
		{
			var query = mongo.db("whatifi").collection("users").findOne({"username":request.params.id}, function(err,doc) {

				if (err == null)
				{
					response.send(doc);
				}
				else
				{
					response.send("query error");
				}
			});
		}
		else
		{
			response.send("database error");
		}
	});
});

app.get("/income/:id", function(request,response){
	console.log("income",request.params);
	response.header("Access-Control-Allow-Origin","*");
	MongoClient.connect("mongodb://127.0.0.1:27017",function(err,mongo){
		if (err == null)
		{
			var query = mongo.db("whatifi").collection("income").findOne({"income_id":parseInt(request.params.id)}, function(err,doc) {

				if (err == null)
				{
					response.send(doc);
				}
				else
				{
					response.send("query error");
				}
			});
		}
		else
		{
			response.send("database error");
		}
	});
});

app.listen(8080, () => console.log("listening to port 8080"));
