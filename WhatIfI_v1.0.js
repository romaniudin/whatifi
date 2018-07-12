class Income {

    constructor() {
        this._value = 0;
        this._dateStart = 0;
        this._dateEnd = -1;
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = newValue;
    }

    set dateStart(newDateStart) {
        this._dateStart = newDateStart;
    }

    set dateEnd(newDateEnd) {
        this._dateEnd = newDateEnd;
    }

    valueForDate(date) {
        if (date >= this._dateStart) {
            if (date <= this._dateEnd || this._dateEnd === -1) {
                return this._value;
            }
        }
        return 0;
    }

    totalValue(start, end) {
        let tv = 0;
        for(let i = start; i <= end; i++) {
            tv += this.valueForDate(i);
        }
        return tv;
    }

}

class Person {
    constructor() {
        this._values = [];
    }

    get values() {
        return this._values;
    }

    totalValue(start, end) {
        let tv = 0;
        this._values.forEach(function(value) {
            tv += value.totalValue(start, end);
        });
        return tv;
    }

}

const main = () => {
    const you = new Person();
    var yourIncome1 = new Income();

    yourIncome1.value = 10;
    yourIncome1.dateStart = 2;

    you.values.push(yourIncome1);

    console.log(`Your income 1: ${you.totalValue(0, 10)}`);

    const taxReturn = new Income();
    taxReturn.value = 100;
    taxReturn.dateEnd = 0;
    you.values.push(taxReturn);

    const partner = new Person();

    const partnerIncome1 = new Income();
    partnerIncome1.value = 20;
    partnerIncome1.dateStart = 1;

    partner.values.push(partnerIncome1);
    console.log(`Partner: ${partner.totalValue(0, 10)}`);
    you.values.push(partner);

    const child1 = new Person();

    const childIncome1 = new Income();
    childIncome1.value = -5;
    childIncome1.dateStart = 0;
    child1.values.push(childIncome1);

    console.log(`Child income 1: ${child1.totalValue(0, 10)}`);

    const child2 = new Person();

    const childIncome2 = new Income();
    childIncome2.value = -10;
    childIncome2.dateStart = 0;
    child2.values.push(childIncome2);

    console.log(`Child income 2: ${child2.totalValue(0, 10)}`);

    you.values.push(childIncome1);
    you.values.push(childIncome2);

    console.log(`You: ${you.totalValue(0, 10)}`);

}

function makeRequest (method, url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

function fetchIncomeData() {
    var userID = document.getElementsByName('txtJob')[0].value
    makeRequest('GET', 'http://ec2-54-70-113-113.us-west-2.compute.amazonaws.com:8080/user/' + userID)
        .then(function (data) {
            let json = JSON.parse(data);
            if (json.hasOwnProperty("username")) {
                console.log("user API");
                document.getElementById("username").innerHTML = json["username"];
            }
            return makeRequest('GET', 'http://ec2-54-70-113-113.us-west-2.compute.amazonaws.com:8080/income/' + json["income_id"]);
        })
        .then(function (moreDatums) {
            let json = JSON.parse(moreDatums);
            if (json.hasOwnProperty("value")) {
                console.log("income API");
                document.getElementById("income").innerHTML = json["value"];
            }
        })
        .catch(function (err) {
            console.error("There was an error", err.statusText);
        })
}


