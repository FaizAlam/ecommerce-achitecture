const express = require('express');
const app = express();
const PORT = process.env.PORT_ONE || 9090;
const mongoose = require('mongoose');
const jwt =require('jsonwebtoken'); 
const amqp = require("amqplib");
const Order = require("./Order")
const isAuthenticated = require("../isAuthenticated");
//mongoURL = pass your mongoURI
app.use(express.json())
var channel,connection;

mongoose.connect(mongoURL,(err)=>{
    if (err) console.log(err)
    else console.log("Connected to order-service db")
})

async function connect(){
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
}

function createOrder(products,userEmail){
    let total = 0;
    for (let t=0;t<products.length;++t){
        total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user:userEmail,
        total_price:total
    })
    newOrder.save();
    return newOrder; 
}

connect().then(()=>{
    channel.consume("ORDER",(data)=>{
        const {products,userEmail} = JSON.parse(data.content);
        const newOrder = createOrder(products,userEmail);
        console.log("Consuming ORDER queue");
        channel.ack(data);
        channel.sendToQueue("PRODUCT",Buffer.from(JSON.stringify({newOrder})));
    });
});



app.listen(PORT,()=>{
    console.log(`Order-service at ${PORT}`)
})