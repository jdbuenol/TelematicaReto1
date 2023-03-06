var PROTO_PATH = __dirname + '/../protos';

const express = require('express')
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const async = require('async');
const { response } = require('express');
require('dotenv').config();

const server = express();
server.use(express.json());
const port = process.env.PORT;


// SE CREA LA DEFINICION DEL MICRO-SERVICIO INVENTORY
var inventoryDefinition = protoLoader.loadSync(
  PROTO_PATH + "/inventory.proto",
  {keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
  }
);

var inventory_proto = grpc.loadPackageDefinition(inventoryDefinition).Inventory;

// SE CREA LA DEFINICION DEL MICRO-SERVICIO SHOPCART
var shopcartDefinition = protoLoader.loadSync(
  PROTO_PATH + "/shopcart.proto",
  {keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
  }
);

var shopcart_proto = grpc.loadPackageDefinition(shopcartDefinition).ShopCart;

// SE CREA LA DEFINICION DEL MICRO-SERVICIO  SHIPPING
var shippingDefinition = protoLoader.loadSync(
  PROTO_PATH + "/shipping.proto",
  {keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
  }
);

var shipping_proto = grpc.loadPackageDefinition(shippingDefinition).Shipping;

// SE DEFINEN LOS ENDPOINTS PARA EL MICRO-SERVICIO INVENTORY
server.post('/items/:itemId', (req, res) => {
  try{
    var itemId = req.params.itemId;
    var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
    inventoryClient.createItem({ itemId: itemId }, function(err, response) {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.delete('/items/:itemId', (req, res) => {
  try{
    var itemId = req.params.itemId;
    var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
    inventoryClient.deleteItem({ itemId: itemId }, function(err, response) {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.put('/items/:itemId/add', (req, res) => {
  try{
    var itemId = req.params.itemId;
    var quantity = req.body.quantity;
    var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
    inventoryClient.addQuantity({ itemId: itemId, quantity: quantity }, function(err, response) {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.put('/items/:itemId/remove', (req, res) => {
  try{
    var itemId = req.params.itemId;
    var quantity = req.body.quantity;
    var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
    inventoryClient.removeQuantity({ itemId: itemId, quantity: quantity }, function(err, response) {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.get('/items/:itemId', (req, res) => {
  try{
    var itemId = req.params.itemId;
    var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
    inventoryClient.checkQuantity({ itemId: itemId }, function(err, response) {
      if(response.quantity == -1){
        res.send({ "success": false, "msg": `The item #${itemId} doesn't exists` });
      }
      else{
        res.send({ "success": true, "msg": `The item #${itemId} has ${response.quantity} units in storage`});
      }
    });
  }
  catch(err){
    res.send(err);
  }
});

server.get('/items', (req, res) => {
  try{
    var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
    var call = inventoryClient.checkInventory({});
    var arr = [];

    call.on('data', (item) => {
      arr.push(item);
    });

    call.on('end', () => {
      var msg = "";
      arr.forEach((item) => {
        msg += `There are ${item.quantity} units of item #${item.itemId} in storage.<br>`;
      });
      res.send({ success: true, msg: msg });
    });

    call.on('error', (err) => {
      console.log(err);
      res.send(err);
    })
  }
  catch(err){
    res.send(err);
  }
});

server.put('/items/massremove', (req, res) => {
  try{
    var arr = req.body;
    var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
    var call = inventoryClient.massRemove((error, response) => {
      res.send(response);
    });

    function itemSender(itemId, quantity) {
      return function(callback) {
        call.write({
            itemId: itemId,
            quantity: quantity
        });
        callback();
      };
    }

    var itemSenders = [];
    arr.forEach(item => {
      itemSenders.push(itemSender(item.itemId, item.quantity));
    });
    async.series(itemSenders, function() {
      call.end();
    });
  }
  catch(err){
    res.send(err);
  }
});

// SE DEFINEN LOS ENDPOINTS PARA EL MICRO-SERVICIO SHOPCART
server.post('/carts/:cartId', (req, res) => {
  try{
    var cartId = req.params.cartId;
    var shopcartClient = new shopcart_proto.ShopCart(process.env.SHOPCART_PORT, grpc.credentials.createInsecure());
    shopcartClient.createCart({ cartId: cartId }, (err, response) => {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.delete('/carts/:cartId', (req, res) => {
  try{
    var cartId = req.params.cartId;
    var shopcartClient = new shopcart_proto.ShopCart(process.env.SHOPCART_PORT, grpc.credentials.createInsecure());
    shopcartClient.deleteCart({ cartId: cartId }, (err, response) => {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.post('/carts/:cartId/add', (req, res) => {
  try{
    var cartId = req.params.cartId;
    var itemId = req.body.itemId;
    var quantity = req.body.quantity;
    var shopcartClient = new shopcart_proto.ShopCart(process.env.SHOPCART_PORT, grpc.credentials.createInsecure());
    shopcartClient.addToCart({ cartId: cartId, quantity: quantity, itemId: itemId}, (err, response) => {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.post('/carts/:cartId/remove', (req, res) => {
  try{
    var cartId = req.params.cartId;
    var itemId = req.body.itemId;
    var quantity = req.body.quantity;
    var shopcartClient = new shopcart_proto.ShopCart(process.env.SHOPCART_PORT, grpc.credentials.createInsecure());
    shopcartClient.removeFromCart({ cartId: cartId, quantity: quantity, itemId: itemId}, (err, response) => {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.get('/carts/:cartId', (req, res) => {
  try{
    var shopcartClient = new shopcart_proto.ShopCart(process.env.SHOPCART_PORT, grpc.credentials.createInsecure());
    var call = shopcartClient.checkCart({ cartId: req.params.cartId });
    var arr = [];

    call.on('data', (item) => {
      arr.push(item);
    });

    call.on('end', () => {
      var msg = "";
      arr.forEach((item) => {
        msg += `There are ${item.quantity} units of item #${item.itemId} in the shopcart.<br>`;
      });
      res.send({ success: true, msg: msg });
    });

    call.on('error', (err) => {
      console.log(err);
      res.send(err);
    })
  }
  catch(err){
    res.send(err);
  }
});

// SE DEFINEN LOS ENDPOINTS DEL MICRO-SERVICIO DE 
server.post('/addresses/:addressId', (req, res) => {
  try{
    var addressId = req.params.addressId;
    var addressInfo = req.body.addressInfo;
    var shippingClient = new shipping_proto.Shipping(process.env.SHIPPING_PORT, grpc.credentials.createInsecure());
    shippingClient.createAddress({ addressId: addressId, addressInfo: addressInfo }, (err, response) => {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.delete('/addresses/:addressId', (req, res) => {
  try{
    var addressId = req.params.addressId;
    var shippingClient = new shipping_proto.Shipping(process.env.SHIPPING_PORT, grpc.credentials.createInsecure());
    shippingClient.deleteAddress({ addressId: addressId }, (err, response) => {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

server.post('/checkout', (req, res) => {
  try{
    var addressId = req.body.addressId;
    var cartId = req.body.cartId;
    var shippingClient = new shipping_proto.Shipping(process.env.SHIPPING_PORT, grpc.credentials.createInsecure());
    shippingClient.checkOut({ addressId: addressId, cartId: cartId }, (err, response) => {
      res.send(response);
    });
  }
  catch(err){
    res.send(err);
  }
});

// SE PONE A CORRER EL SERVIDOR
server.listen(port, () => {
  console.log(`... running insecurely on ${port}`);
});