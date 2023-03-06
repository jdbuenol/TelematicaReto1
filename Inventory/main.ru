this_dir = File.expand_path(File.dirname(__FILE__))
lib_dir = File.join(this_dir, 'lib')
$LOAD_PATH.unshift(lib_dir) unless $LOAD_PATH.include?(lib_dir)

require 'grpc'
require 'json'
require 'inventory_services_pb'

# InventoryServer is a simple server that implements the InventoryServer server.
class InventoryServer < Inventory::Inventory::Service
    
    # Creates a new item with the Id given and with zero quantity in store
    def create_item(item_id, _unused_call)
        file = File.read("./db.json")
        data_hash = JSON.parse(file)
        itemId = item_id.itemId

        if data_hash["#{itemId}"] == nil
            data_hash["#{itemId}"] = { quantity: 0}
            File.write('./db.json', JSON.dump(data_hash))
            Inventory::Reply.new(success: true, msg: "You created the item ##{itemId}")
        else
            Inventory::Reply.new(success: false, msg: "The item ##{itemId} already exists.")
        end
    end

    # Deletes an existing item
    def delete_item(item_id, _unused_call)
        file = File.read("./db.json")
        data_hash = JSON.parse(file)
        itemId = item_id.itemId

        if data_hash["#{itemId}"] == nil
            Inventory::Reply.new(success: false, msg: "The selected item doesn't exist")
        else
            data_hash.delete("#{itemId}")
            File.write('./db.json', JSON.dump(data_hash))
            Inventory::Reply.new(success: true, msg: "You deleted the item ##{itemId}")
        end
    end

    # Adds quantity to an item
    def add_quantity(item, _unused_call)
        file = File.read("./db.json")
        data_hash = JSON.parse(file)

        itemId = item.itemId
        quantity = item.quantity
        if quantity <= 0
            Inventory::Reply.new(success: false, msg: "You can't add negative or zero quantities")
        elsif data_hash["#{itemId}"] == nil
            Inventory::Reply.new(success: false, msg: "The selected item doesn't exist")
        else
            data_hash["#{itemId}"]["quantity"] += quantity
            File.write('./db.json', JSON.dump(data_hash))
            Inventory::Reply.new(success: true, msg: "You Added #{quantity} units of the item ##{itemId} to the storage")
        end
    end

    # Removes quantity from an item
    def remove_quantity(item, _unused_call)
        file = File.read("./db.json")
        data_hash = JSON.parse(file)

        itemId = item.itemId
        quantity = item.quantity
        if quantity <= 0
            Inventory::Reply.new(success: false, msg: "You can't remove negative or zero quantities")
        elsif data_hash["#{itemId}"] == nil
            Inventory::Reply.new(success: false, msg: "The selected item doesn't exist")
        else
            data_hash["#{itemId}"]["quantity"] -= quantity
            if data_hash["#{itemId}"]["quantity"] < 0 
                Inventory::Reply.new(success: false, msg: "The item ##{itemId} have only #{data_hash["#{itemId}"]["quantity"] + quantity} units in storage, and you want to remove #{quantity} units")
            else
                File.write('./db.json', JSON.dump(data_hash))
                Inventory::Reply.new(success: true, msg: "You Removed #{quantity} units of the item ##{itemId} from the storage")
            end
        end
    end

    # Returns the quantity in storage of a specific item or -1 in case the item doesn't exist
    def check_quantity(item_id, _unused_call)
        file = File.read("./db.json")
        data_hash = JSON.parse(file)

        itemId = item_id.itemId
        if data_hash["#{itemId}"] == nil
            Inventory::Quantity.new(quantity: -1)
        else
            Inventory::Quantity.new(quantity: data_hash["#{itemId}"]["quantity"])
        end
    end

    # Returns the array of all items in store with their quantity
    def check_inventory(empty, _unused_call)
        file = File.read("./db.json")
        data_hash = JSON.parse(file)

        arr = []
        data_hash.each do |itemId, quantity|
            arr.push(Inventory::Item.new(itemId: itemId.to_i, quantity: quantity["quantity"]))
        end
        arr
    end

    # Removes quantities from multiple items
    def mass_remove(call)
        file = File.read("./db.json")
        data_hash = JSON.parse(file)
        successful = true
        fail_msg = ""

        call.each_remote_read do |item|
            itemId = item.itemId
            quantity = item.quantity
            if quantity <= 0
                successful = false
                fail_msg += "- You can't remove negative or zero quantities item ##{item.itemId}<br>"
            elsif data_hash["#{itemId}"] == nil
                successful = false
                fail_msg += "- The item ##{item.itemId} doesn't exists<br>"
                #Inventory::Reply.new(success: false, msg: "The selected item doesn't exist")
            else
                data_hash["#{itemId}"]["quantity"] -= quantity
                if data_hash["#{itemId}"]["quantity"] < 0
                    successful = false
                    fail_msg += "- The item ##{itemId} have only #{data_hash["#{itemId}"]["quantity"] + quantity} units in storage, and you want to remove #{quantity} units<br>"
                end
            end
        end
        if successful == false
            Inventory::Reply.new(success: false, msg: "FAILED REQUEST:<br>" + fail_msg)
        else
            File.write('./db.json', JSON.dump(data_hash))
            Inventory::Reply.new(success: true, msg: "Mass Removal successful");
        end
    end
end

# main starts an RpcServer that receives requests to InventoryServer at the sample
# server port.
def main
    env = File.read("./.env")
    data_hash = JSON.parse(env)
    s = GRPC::RpcServer.new
    s.add_http2_port(data_hash["port"], :this_port_is_insecure)
    s.handle(InventoryServer)
    # Runs the server with SIGHUP, SIGINT and SIGTERM signal handlers to
    #   gracefully shutdown.
    # User could also choose to run server via call to run_till_terminated
    puts "... running insecurely on #{data_hash["port"]}"
    s.run_till_terminated_or_interrupted([1, 'int', 'SIGTERM'])
  end
  
  main
  