require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const exp = require("constants");
const { log } = require("console");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
const findOrCreate = require("mongoose-findorcreate");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(session({
    secret: "OurLitTLeSeCRet....",
    resave:false,
    saveUninitialized:true
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    username:String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        console.log(user);
        return cb(err, user);
    });
    }
));


app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",passport.authenticate("google",{scope:["profile"]}));

app.get("/auth/google/secrets",
    passport.authenticate("google",{failureRedirect: "/login"}),function(req,res){
        res.redirect("/secrets");
    }
);

app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});



app.get("/secrets",function(req,res){
    User.find({"secrets": {$ne:null}},function(err,users){
        if(err){
            console.log(err);
        }else{
            res.render("secrets",{foundUsers: users});
        }
    });
});
app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user._id, (err, foundUser) => {
        if(err) {
            console.log(err);
        } else {
            if(foundUser) {
                foundUser.secret = (submittedSecret);
                foundUser.save(() => {res.redirect('/secrets');});
            }
        }
    });
});
app.get("/logout",function(req,res){
    req.logOut(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
});


app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local") (req,res,function(){
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
            passport.authenticate("local") (req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

});



app.listen(3000,function(){
    console.log("The server is running successfully at port 3000");
});
