const express = require('express');
const app = express();
const PORT = process.env.PORT_ONE || 7070;
const mongoose = require('mongoose')
const User = require('./User');
const jwt =require('jsonwebtoken') 
//mongoURL = pass your mongoURI
app.use(express.json())
mongoose.connect(mongoURL,(err)=>{
    if (err) console.log(err)
    else console.log("Connected to auth-service db")
})

//Register
//Login
app.post("/auth/login",async (req,res)=>{
    const {email,password}= req.body;

    const user = await User.findOne({email});
    if (!user){
        return res.json({message:"User doesn't exist"});
    }
    else{
        //check if password is valid
        if(password !== user.password){
            return res.json({message:"password incorrect"})
        }
        const payload = {
            email,
            name:user.name
        };
        jwt.sign(payload,"secret",(err,token)=>{
            if (err) console.log(err);
            else{
                return res.json({token:token});
            }
        })
    }
})

app.post("/auth/register",async (req,res)=>{
    const {email,password,name} = req.body;
    const userExists = await User.findOne({email});
    if (userExists){
        return res.json({message:"User already exist"})
    }
    else{
        const newUser = new User({
            name,
            email,
            password
        });
        newUser.save();
        return res.json(newUser);
    }
})



app.use("/",(req,res)=>{
    console.log("Home route")
})

app.listen(PORT,()=>{
    console.log(`Auth-service at ${PORT}`)
})