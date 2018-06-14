#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jun 11 22:30:46 2018

@author: markbreen
"""

### Importing packages

from flask import Flask, request
from flask_restful import Api, Resource, reqparse

app = Flask(__name__)
api = Api(app)

### Example of what a user in the database will look like at the moment

users = [
    {
     "name": "",
     "disability": "",
     "pay_freq": "",
     "pay_gross": "",
     "c_first_name": "",
     "c_birth_year": "",
     "c_birth_month": "",
     "c_disability": "",
     "cc_start_date": "",
     "cc_rate": ""
     }
        ]

"""
    This is where the get, post, put and delete requests of the 
    API are performed. 
"""

class IncomeParent1(Resource):
    def get(self):
        args = request.args
        name = args["name"]
        for user in users:
            if name == user["name"]:
                return user, 200
        return "User not found", 404
        
    def post(self):
        args = request.args
        name = args["name"]
        pay_freq = args["pay_freq"]
        pay_gross = args["pay_gross"]
        
        for user in users:
            if name == user["name"]:
                return "User with name {} already exists".format(name), 400
            
        user = {
            "name": name,
            "disability": "",
            "pay_freq": pay_freq,
            "pay_gross": pay_gross,
            "c_first_name": "",
            "c_birth_month": "",
            "c_disability": "",
            "cc_start_date": "",
            "cc_rate": ""
            }
        users.append(user)
        return user, 201
        
    def put(self):
        args = request.args
        name = args["name"]
        pay_freq = args["pay_freq"]
        pay_gross = args["pay_gross"]
        
        for user in users:
            if name == user["name"]:
                user["disability"] = "",
                user["pay_freq"] = pay_freq
                user["pay_gross"] = pay_gross
                user["c_first_name"] = ""
                user["c_birth_year"] = ""
                user["c_birth_month"] = ""
                user["c_disability"] = ""
                user["cc_start_date"] = ""
                user["cc_rate"] = ""
                return user, 200
            
        user = {
            "name": name,
            "disability": "",
            "pay_freq": pay_freq,
            "pay_gross": pay_gross,
            "c_first_name": "",
            "c_birth_month": "",
            "c_disability": "",
            "cc_start_date": "",
            "cc_rate": ""
            }
        users.append(user)
        return user, 201
        
    def delete(self):
        args = request.args
        name = args["name"]
        global users
        users = [user for user in users if user["name"] != name]
        return "{} is deleted.".format(name), 200

"""
    Adding API endpoints.
"""  
      
api.add_resource(IncomeParent1, "/IncomeParent1")
app.run(debug=True)
        