var PROTO_PATH = __dirname + '/../protos';

var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var fs = require('fs');
var async = require('async');
require('dotenv').config();

var packageDefinition = protoLoader.loadSync(
    PROTO_PATH + "/shipping.proto",
    {keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);

var shipping_proto = grpc.loadPackageDefinition(packageDefinition).Shipping;

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

/* Creates a Shipping address*/
function createAddress(call, callback) {
    var data = fs.readFileSync('./db.json', 'utf-8');
    var json = JSON.parse(data);
    var request = call.request;
    if(json[`${request.addressId}`] != null){
        callback(null, { success: false, msg: "AddressId already taken"});
    }
    else{
        json[`${request.addressId}`] = request.addressInfo;
        var str = JSON.stringify(json);
        fs.writeFileSync('db.json', str, { encoding: 'utf-8' });
        callback(null, {success: true, msg: "Address created successfully"});
    }
}

/* Deletes a Shipping address*/
function deleteAddress(call, callback) {
    var data = fs.readFileSync('./db.json', 'utf-8');
    var json = JSON.parse(data);
    var addressId = call.request.addressId;

    if(json[`${addressId}`] == null){
        callback(null, { success: false, msg: "AddressId doesn't exist" })
    }
    else{
        delete json[`${addressId}`];
        var str = JSON.stringify(json);
        fs.writeFileSync('db.json', str, { encoding: 'utf-8' });
        callback(null, {success: true, msg: "Address deleted successfully"});
    }
}

/* ChecksOut a ShopCart, removes the quantities from the storage and ships them to an address*/
function checkOut(call, callback){
    var data = fs.readFileSync('./db.json', 'utf-8');
    var json = JSON.parse(data);
    var addressId = call.request.addressId;
    var cartId = call.request.cartId;
    if(json[`${addressId}`] == null){
        callback(null, { success: false, msg: "AddressId doesn't exists" })
    }
    else{
        var shopcartClient = new shopcart_proto.ShopCart(process.env.SHOPCART_PORT, grpc.credentials.createInsecure());
        var call = shopcartClient.checkCart({ cartId: cartId });
        var arr = [];
        call.on('data', function(item) {
            arr.push(item);
        });
        call.on('end', function() {
            if(arr.length == 0){
                callback(null, {success: false, msg: "The selected cart doesn't exists or is empty"});
            }
            else{
                var inventoryClient = new inventory_proto.Inventory(process.env.INVENTORY_PORT, grpc.credentials.createInsecure());
                if(arr.length == 1){
                    inventoryClient.checkQuantity({ itemId: arr[0].itemId }, function(err, response) {
                        if(response.quantity < arr[0].quantity){
                            callback(null, {success: false, msg: `The cart has ${arr[0].quantity} units of the item #${arr[0].itemId} but there are only ${response.quantity} units in inventory.`});
                        }
                        else{
                            inventoryClient.removeQuantity({ itemId: arr[0].itemId, quantity: arr[0].quantity }, function(err, response){
                                if(response.success){
                                    callback(null, { success: true, msg: `The delivery of ${arr[0].quantity} units of item #${arr[0].itemId} has been dispatched to address: "${json[`${addressId}`]}"`});
                                }
                                else{
                                    callback(null, { success: response.success, msg: response.msg });
                                }
                            })
                        }
                    });
                }
                else{
                    var check_inventory = inventoryClient.checkInventory({});
                    var inventoryArr = [];
                    check_inventory.on('data', function(item){
                        inventoryArr.push(item);
                    });
                    check_inventory.on('end', function() {
                        var err_msg = "";
                        arr.forEach(item => {
                            var quantity_inventory = inventoryArr.find(i => i.itemId == item.itemId)?.quantity;
                            if(quantity_inventory == undefined){
                                err_msg += `The item #${item.itemId} doesn't exists in the storage<br>`;
                            }
                            else if(quantity_inventory < item.quantity){
                                err_msg += `The cart has ${item.quantity} units of the item #${item.itemId} but there are only ${quantity_inventory} units in inventory.<br>`
                            }
                        });
                        if(err_msg.length == 0){
                            var call_mass_remove = inventoryClient.massRemove(function(error, response) {
                                if(response.success){
                                    var final_msg = "The delivery of<br>";
                                    arr.forEach(item => {
                                        final_msg += `- ${item.quantity} units of item #${item.itemId}<br>`
                                    })
                                    final_msg += `has been dispatched to address: "${json[`${addressId}`]}"`
                                    callback(null, { success: true, msg: final_msg });
                                }
                                else{
                                    callback(null, { success: response.success, msg: response.msg })
                                }
                            });

                            function itemSender(itemId, quantity) {
                                return function(callback) {
                                    call_mass_remove.write({
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
                                call_mass_remove.end();
                            });
                        }
                        else{
                            err_msg = "Failed request:<br>" + err_msg
                            callback(null, {success: false, msg: err_msg});
                        }
                    });
                    check_inventory.on('error', function(e) {
                        console.log(e);
                        callback(null, {success: false, msg: JSON.stringify(e)});
                    });
                }
            }
        });
        call.on('error', function(e) {
            console.log(e);
            callback(null, { success: false, msg: JSON.stringify(e) });
        });
    }
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
    var server = new grpc.Server();
    server.addService(shipping_proto.Shipping.service, {createAddress: createAddress, deleteAddress: deleteAddress, checkOut: checkOut});
    server.bindAsync(process.env.PORT, grpc.ServerCredentials.createInsecure(), () => {
        console.log(`... running insecurely on ${process.env.PORT}`);
        server.start();
    });
}
  
main();
  