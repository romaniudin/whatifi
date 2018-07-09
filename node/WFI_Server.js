const express = require("express");
const app = express();

app.get("/:fname/:lname", function(){
	response.header("Access-Control-Allow-Origin","*");
	response.send("hello"+request.params.fname+request.params.lname)
});

app.listen(8080, () => console.log("listening to port 8080"));
