require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const exp = require("constants");
const { log } = require("console");
const encrypt = require("mongoose-encryption");
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email:String,
    password: String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});


const User = mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username},function(err,found){
        if(err){
            console.log(err);
        }else{
            if(found){
                if(found.password === password){
                    res.render("secrets");
                }
                else{
                    console.log("Please check your password and try again!");
                }
            }
            else{
                console.log("It seems like you haven't registered yet,so please register!");
            }
        }
    });
})

app.listen(3000,function(){
    console.log("The server is running successfully at port 3000");
});
