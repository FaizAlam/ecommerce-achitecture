const express = require('express');
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require('mongoose');
const jwt =require('jsonwebtoken'); 
const amqp = require("amqplib");
const Product = require("./Product")
const isAuthenticated = require("../isAuthenticated");
//mongoURL = pass your mongoURI
app.use(express.json())
var channel,connection,order;

mongoose.connect(mongoURL,(err)=>{
    if (err) console.log(err)
    else console.log("Connected to product-service db")
})

async function connect(){
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}
connect();


//create a new product
//buy a product

app.post("/product/create",isAuthenticated,async (req,res)=>{
    //req.user.email
    const {name,description,price} = req.body;
    const newProduct = new Product({
        name,
        description,
        price,
    })
    newProduct.save();
    return res.json(newProduct);
})

// User sends a list of products IDs to buy
// creating an order with those products and total value of sum of products' prices

app.post("/product/buy",isAuthenticated,async (req,res)=>{
    const {ids}= req.body;
    const products = await Product.find({_id:{$in:ids}});

    channel.sendToQueue("ORDER",Buffer.from(JSON.stringify({
        products,
        userEmail : req.user.email,
    })));
    channel.consume("PRODUCT",(data)=>{
        console.log("Consuming PRODUCT queue")
        order = JSON.parse(data.content);
        channel.ack(data);
    })
    return res.json({order});
})

app.listen(PORT,()=>{
    console.log(`Product-service at ${PORT}`)
})