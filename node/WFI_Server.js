const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;

app.get("/user/:id", (request,response) => {

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

app.get("/income/:id", (request,response) => {

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

const isValidUserUpload = json => {

	return "username" in json && "email" in json && json["username"] != "" && json["email"] != "";
}

const saveUser = (json,response) => {

	if (isValidUserUpload(json))
	{
		MongoClient.connect("mongodb://127.0.0.1:27017",function(err,mongo){
			if (err == null)
			{
				var query = mongo.db("whatifi").collection("users").update({"username":json["username"],"email":json["email"]},json,{upsert:true},function(err,doc) {

					if (err == null)
					{
						response.send(doc);
					}
					else
					{
						response.send("insert error");
					}
				});
			}
			else
			{
				response.send("database error");
			}
		});
	}
	else
	{
		response.send("error - missed 'username' and/or 'email'");
	}
}

app.post("/user", (request,response) => {

	response.header("Access-Control-Allow-Origin","*");
	console.log("recieved user json upload");

	var body = [];

	request.on('data',function(chunk) {
		body.push(chunk);

	}).on('end', function() {
		try {
			var user = JSON.parse(body.toString());
			saveUser(user,response);
		}
		catch (e) {
			response.statusCode = 400;
			response.send("Error: Incorrect JSON object - "+e+"\n");
		}
	});


});	

app.listen(8080, () => console.log("listening to port 8080"));
