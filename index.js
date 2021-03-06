const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/newDB");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");

app.use(session({
    secret: "OurLittleSecret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    req.logOut(function(err){
        if(err){console.log(err);}
        else {
            res.redirect("/");
        }
    });
});

app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local") (req,res,function(err){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.logIn(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local") (req,res,function(err){
                res.redirect("/secrets");       
            });
        }
    });
});
app.listen(4000,function(){
    console.log("Server is running at port 4000");
});