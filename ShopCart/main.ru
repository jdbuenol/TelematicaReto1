this_dir = File.expand_path(File.dirname(__FILE__))
lib_dir = File.join(this_dir, 'lib')
$LOAD_PATH.unshift(lib_dir) unless $LOAD_PATH.include?(lib_dir)

require 'grpc'
require 'json'
require 'shopcart_services_pb'
require 'inventory_services_pb'

# ShopCartServer is a simple server that implements the ShopCartServer server.
class ShopCartServer < ShopCart::ShopCart::Service
  # Adds items to the cart
  def add_to_cart(shop_cart_req, _unused_call)
    file = File.read("./db.json")
    data_hash = JSON.parse(file)

    env_file = File.read("./.env")
    env = JSON.parse(env_file)

    cartId = shop_cart_req.cartId
    itemId = shop_cart_req.itemId
    quantity = shop_cart_req.quantity

    stub = Inventory::Inventory::Stub.new(env["inventory_port"], :this_channel_is_insecure)
    reply = stub.check_quantity(Inventory::ItemId.new(itemId: itemId))

    if quantity <= 0
      ShopCart::Reply.new(success: false, msg: "You can't add negative or zero quantities")
    elsif data_hash["#{cartId}"] == nil
      ShopCart::Reply.new(success: false, msg: "The selected cart doesn't exist")
    elsif reply.quantity == -1
      ShopCart::Reply.new(success: false, msg: "The selected item doesn't exist in storage")
    else      
      in_inventory = true

      items = data_hash["#{cartId}"]
      if items.select { |item| item["itemId"] == itemId}.size == 0
        if reply.quantity < quantity
          in_inventory = false
        else
          data_hash["#{cartId}"].push({"itemId": itemId, "quantity": quantity})
        end
      else
        data_hash["#{cartId}"].each do |item|
          if item['itemId'] == itemId 
            item['quantity'] += quantity
            if reply.quantity < item['quantity']
              in_inventory = false
            end
          end
        end
      end
      if in_inventory
        File.write('./db.json', JSON.dump(data_hash))
        ShopCart::Reply.new(success: true, msg: "You Added #{quantity} units of the item ##{itemId} to the cart ##{cartId}")
      else
        ShopCart::Reply.new(success: false, msg: "Limited stock: Only #{reply.quantity} units left in storage of item ##{itemId}")
      end
    end
  end

  # Removes an item from the cart
  def remove_from_cart(shop_cart_req, _unused_call)
    file = File.read("./db.json")
    data_hash = JSON.parse(file)
    cartId = shop_cart_req.cartId
    itemId = shop_cart_req.itemId
    quantity = shop_cart_req.quantity
    if quantity <= 0
      ShopCart::Reply.new(success: false, msg: "You can't remove negative or zero quantities")
    elsif data_hash["#{cartId}"] == nil
      ShopCart::Reply.new(success: false, msg: "The selected cart doesn't exist")
    elsif data_hash["#{cartId}"].select { |item| item["itemId"] == itemId}.size == 0
      ShopCart::Reply.new(success: false, msg: "The selected item doesn't exist in the cart selected")
    else
      sent = false
      msg_to_send = ''
      data_hash["#{cartId}"].each do |item|
        if item['itemId'] == itemId 
          item['quantity'] -= quantity
          if item['quantity'] < 0
            sent = true
            msg_to_send = "The item ##{itemId} have only #{item['quantity'] + quantity} units in the cart, and you want to remove #{quantity} units"
          elsif item['quantity'] == 0
            data_hash["#{cartId}"].delete(item)
          end
        end
      end
      if sent == false
        File.write('./db.json', JSON.dump(data_hash))
        ShopCart::Reply.new(success: true, msg: "You Removed #{quantity} units of the item ##{itemId} of the cart ##{cartId}")
      else
        ShopCart::Reply.new(success: false, msg: msg_to_send)
      end
    end
  end

  # checks the content of the cart
  def check_cart(cart_id, _unused_call)
    file = File.read("./db.json")
    data_hash = JSON.parse(file)
    cartId = cart_id.cartId

    if data_hash["#{cartId}"] == nil
      []
    elsif data_hash["#{cartId}"].size == 0
      []
    else
      arr = []
      data_hash["#{cartId}"].each do |item|
        arr.push(ShopCart::Item.new(itemId: item["itemId"], quantity: item["quantity"]))
      end
      arr
    end
  end

  # Creates a new empty cart with the Id given
  def create_cart(cart_id, _unused_call)
    file = File.read("./db.json")
    data_hash = JSON.parse(file)
    cartId = cart_id.cartId

    if data_hash["#{cartId}"] == nil
      data_hash["#{cartId}"] = []
      File.write('./db.json', JSON.dump(data_hash))
      ShopCart::Reply.new(success: true, msg: "You created the cart ##{cartId}")
    else
      ShopCart::Reply.new(success: false, msg: "The cart ##{cartId} already exists.")
    end
  end

  # Deletes an existing cart
  def delete_cart(cart_id, _unused_call)
    file = File.read("./db.json")
    data_hash = JSON.parse(file)
    cartId = cart_id.cartId

    if data_hash["#{cartId}"] == nil
      ShopCart::Reply.new(success: false, msg: "The selected cart doesn't exist")
    else
      data_hash.delete("#{cartId}")
      File.write('./db.json', JSON.dump(data_hash))
      ShopCart::Reply.new(success: true, msg: "You deleted the cart ##{cartId}")
    end
  end
end

# main starts an RpcServer that receives requests to ShopCartServer at the sample
# server port.
def main
  env = File.read("./.env")
  data_hash = JSON.parse(env)
  s = GRPC::RpcServer.new
  s.add_http2_port(data_hash["port"], :this_port_is_insecure)
  s.handle(ShopCartServer)
  # Runs the server with SIGHUP, SIGINT and SIGTERM signal handlers to
  #   gracefully shutdown.
  # User could also choose to run server via call to run_till_terminated
  puts "... running insecurely on #{data_hash["port"]}"
  s.run_till_terminated_or_interrupted([1, 'int', 'SIGTERM'])
end

main