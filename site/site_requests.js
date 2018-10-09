let apiServer = "http://ec2-34-219-58-79.us-west-2.compute.amazonaws.com:8080";
//curl "http://ec2-34-219-58-79.us-west-2.compute.amazonaws.com:8080/login" --user 'markbreen123:Mark1!' --request GET

/*
    Functions used for creating a new user account
*/

const createAccountRequest = (username,password,email) => new Promise((resolve,reject) => {

    const createAccount = new XMLHttpRequest();

    createAccount.onreadystatechange = () => {

        if (createAccount.readyState == 4)
        {
          console.log(JSON.parse(createAccount.response));
          if (createAccount.status == 200)
          {
              document.getElementById("result").innerHTML = "Successfully created account: "+username;
          }
          else
          {
              document.getElementById("result").innerHTML = "Failed to create account: "+username;
          }
        }
    }
    createAccount.onerror = () => {
        reject("Server error");
    }
    createAccount.ontimeout = () => {
        reject("Connection timeout");
    }
    var data = JSON.stringify({
      "username": username,
      "password": password,
      "email": email
    });
    console.log(data);
    createAccount.open("POST", apiServer+"/create");
    createAccount.setRequestHeader("content-type", "application/json");
    createAccount.send(data);
});

const submitPressed = () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;

    console.log(username, password, email);

    createAccountRequest(username, password, email);
}

/*
    Functions used for logging into a user account
*/

const loginRequest = () => new Promise((resolve,reject) => {

    const username = document.getElementById("login-user").value;
    const password = document.getElementById("login-password").value;

    console.log(username);
    console.log(password);

    const loginRequest = new XMLHttpRequest();

    loginRequest.onreadystatechange = () => {

        if (loginRequest.readyState == 4)
        {
            console.log(JSON.parse(loginRequest.response))
            if (loginRequest.status == 200)
            {
                const ret = JSON.parse(loginRequest.response);
                //console.log(ret["token"]);
                document.getElementById("login-status").innerHTML = "Login Successful.";
                localStorage.setItem("token", ret["token"]);
                localStorage.setItem("username", username);
                console.log(localStorage.getItem("token"));
                window.location = "login_result.html";
                resolve(loginRequest.response);
                //resolve(JSON.parse(loginRequest.response));
                //resolve(loginRequest);
            }
            else if (loginRequest.status >= 400 && loginRequest.status < 500)
            {
                reject("Invalid Credentials");
            }
            else if (loginRequest.status >= 500)
            {
                reject("Server Error");
            }
            else
            {
                reject("Unknown Error");
            }
        }
    }
    loginRequest.onerror = () => {
        reject("Server unavailable");
    }
    loginRequest.ontimeout = () => {
        reject("Request timeout");
    }
    //loginRequest.withCredentials = true;
    loginRequest.open("get",apiServer+"/login",true);
    //loginRequest.setRequestHeader("Content-Type", "application/json");
    //loginRequest.setRequestHeader("Cache-Control", "no-cache");
    // loginRequest.setRequestHeader("Access-Control-Allow-Origin", "http://localhost:8080");
    //loginRequest.setRequestHeader("Access-Control-Allow-Methods", "POST");
    loginRequest.setRequestHeader("Authorization","Basic "+btoa(username+":"+password));

    loginRequest.send();
    //console.log(JSON.parse(loginRequest.response));
    document.getElementById("login-status").innerHTML = "Verifying credentials";
});

const authenticationRequest = () => new Promise((resolve,reject) => {

    const token = window.localStorage.getItem("token");

    if (token == null) return reject();

    const authenticate = new XMLHttpRequest();
    authenticate.onreadystatechange = () => {

        if (authenticate.readyState == 4)
        {
            if (authenticate.status == 200)
            {
                resolve();
            }
            else if (authenticate.status >= 400)
            {
                clearCache();
                reject("Session expired - please login");
            }
        }
    }
    authenticate.onerror = () => {
        reject("Server error");
    }
    authenticate.ontimeout = () => {
        reject("Connection timeout");
    }
    authenticate.open("get",apiServer+"/authenticate",true);
    authenticate.setRequestHeader("Authorization","Bearer "+token);
    authenticate.send();
});

/*
    Functions used to retrieve the token and username from local
    storage after account login
*/

function getToken() {
    let token = localStorage.getItem("token");
    console.log(token);
    return token;
};

function getUserName() {
    let username = localStorage.getItem("username");
    return username;
}

/*
    Fetches data for the username after logging in
*/

function fetchUserData() {
    let token = getToken();

    var xhr = new XMLHttpRequest();
    //xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === this.DONE) {
        console.log(this.responseText);
      }
    });

    xhr.open("GET", "http://ec2-34-219-58-79.us-west-2.compute.amazonaws.com:8080/items/markbreen123?type=user");
    xhr.setRequestHeader("Authorization","Bearer "+token);
    xhr.send();
}

/*
    Used for uploading user data (need to modify so you can supply data)
*/

function uploadUserData() {
    let token = getToken();
    let username = getUserName();

    let data = {"type": "user", "details": {"identifier": "markb123",
                         "firstName": "Mark",
                         "lastName": "Breen"}};

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === this.DONE) {
        console.log(this.responseText);
      }
    });

    xhr.open("POST", apiServer+"/item/" + username);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(JSON.stringify(data));
    console.log(JSON.stringify(data));
}
