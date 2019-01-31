/*
Jose Gilberto Ponce
01/30/2019
*/
var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var bodyParser = require('body-parser');
//var sqlite3 = require('sqlite3').verbose();
var formidable = require('formidable');
var fs = require('fs');

var port = process.env.PORT || 3000;
var inventoryUploadsDir = "./uploads";
var inventoryItemMasterDir = "./itemMaster";

var initial = {"area":0,
               "section":0,
               "is_reading_upc":false,
               "is_reading_quantity":false,
               "is_connected":false,
               "last_sequence":1,
               "item_master_count":0,
               "processing_file":"",
               "is_processing":false,
               "has_error":false,
               "error_message":"",
               "is_expanding_upc":true};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use('/assets', [
    express.static(__dirname + '/node_modules/jquery/dist/'),
    express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/'),
    express.static(__dirname + '/uploads/'),
    express.static(__dirname + '/itemMaster/'),
    express.static(__dirname + '/node_modules/bootstrap/dist/')
]);

//ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'gil'
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "gil",
  database: "db767221961"
});

app.get('/', function(req, res){

  console.log(req.query.action);
  switch(req.query.action) {
    case "itemMaster":
      //res.send('{"status":"success"}');
      getItemMaster(res)
      break;
    case "inventory":
      //res.send('{"status":"success"}');
      getSampleInventory(res);
      break;
    default:
      res.sendFile(__dirname + '/index.html');
      break;

  }
});

app.post('/', function (req, res){
    var form = new formidable.IncomingForm();

    form.parse(req);

    form.on('fileBegin', function (name, file){
        file.path = __dirname + '/uploads/' + file.name;
        //var contents = fs.readFileSync(file.path);
        //var jsonContent = JSON.parse(contents);
        //console.log(jsonContent.)
        //console.log(file);
        //var contents = fs.readFileSync(file.path);
        //var jsonContent = JSON.parse(contents);
        //console.log(jsonContent.inventory[0].area);

    });

    form.on('file', function (name, file){
        console.log('Uploaded ' + file.name);
        //console.log(file);
        //processUploadedFile(file);
        var contents = fs.readFileSync(file.path);
        var jsonContent = JSON.parse(contents);
        loadInventory(jsonContent, file.name)
        res.send('{"status":"success","fileName":"' + file.name + '","fileSize":"' + file.size + '"}')
    });
    //res.send('{"status":"success"}');

    //res.sendFile(__dirname + '/index.html');
});

fs.readdirAsync = function(dirname) {
    return new Promise(function(resolve, reject) {
        fs.readdir(dirname, function(err, filenames){
            //if (err)
            //    reject(err);
            //else
                resolve(filenames);
        });
    });
};

function getItemMaster(res){
  //con.connect(function(err) {
    //if (err) throw err;
    con.query("SELECT * FROM retail_item_master order by department", function (err, result, fields) {
      if (err) {
         res.send('{"status":"failed"}');

        //initial.is_processing = false;
        //initial.has_error = true;
        //initial.error_message = "Error retrieving data from retail_item_master(showItemMaster)";
        //console.log("error");
        //sendMessage(initial,"error");
        return;
      }
       res.send(result);
      //sendMessage(result,"item-master-data");
      //console.log(result);
      //console.log(fields);
    });
  //});
}

function getSampleInventory(res){
  //con.connect(function(err) {
    //if (err) throw err;
    con.query("SELECT inv_sequence, inv_area, inv_section, item_id, inv_quantity FROM retail_inventory order by inv_sequence", function (err, result, fields) {
      if (err) {
         res.send('{"status":"failed"}');

        //initial.is_processing = false;
        //initial.has_error = true;
        //initial.error_message = "Error retrieving data from retail_item_master(showItemMaster)";
        //console.log("error");
        //sendMessage(initial,"error");
        return;
      }
       res.send(result);
      //sendMessage(result,"item-master-data");
      //console.log(result);
      //console.log(fields);
    });
  //});
}

function processingInventoryComplete(){
  console.log("completed");
  initial.is_processing = false;
  initial.item_master_count = 0;
  sendMessage(initial,"processing-inventory-complete");


}


function isDataFile(filename) {
  return (filename.split('.')[1] == 'json')
}

function readAllRows(){
  console.log("completed");
  initial.is_processing = false;
  initial.item_master_count = 0;
  sendMessage(initial,"processing-item-master-is-complete");


}



function loadInventory(data, fileName){
  //console.log(data.inventory);
  var values = [];
  var auditorId=123;
  //var fileName="";
  auditorId = data.counter;
  //fileName = fi
  for(var i=0; i< data.inventory.length; i++)
    values.push([data.inventory[i].sequence,
                 data.inventory[i].itemId,
                 data.inventory[i].quantity,
                 data.inventory[i].area,
                 data.inventory[i].section,
                 auditorId,
                 fileName]);
//console.log(values);

  var sql = "INSERT IGNORE INTO retail_inventory (inv_sequence,item_id,inv_quantity,inv_area,inv_section, inv_auditor, inv_file_name) VALUES ?";
  con.query(sql, [values], function (err, result) {
    if (err) throw err;
    console.log(result);
    console.log("Number of records inserted: " + result.affectedRows);
  });

}

function loadItemMaster(data){

}

function processInventory(){
    fs.readdirAsync('./uploads')
    .then(function (filenames){
      if (typeof(filenames) != "undefined") {
        filenames = filenames.filter(isDataFile);
        filenames.forEach(function(file) {
          console.log(file);
          try {
            var contents = fs.readFileSync("./uploads/" +file);
                //console.log(contents);
                var json_file = JSON.parse(contents);
                loadInventory(json_file, file)
                //console.log(json_file);
                //loadItemMaster(json_file)
            } catch (error) {
                console.log(error);
            }
        });
    }
    console.log(filenames);
    })

}

function processItemMaster(){
    fs.readdirAsync('./itemMaster')
    .then(function (filenames){
      if (typeof(filenames) != "undefined") {
        filenames = filenames.filter(isDataFile);
        filenames.forEach(function(file) {
          console.log(file);
          try {
            var contents = fs.readFileSync("./itemMaster/" +file);
                //console.log(contents);
                var json_file = JSON.parse(contents);
                //console.log(json_file);
                loadItemMaster(json_file)
            } catch (error) {
                console.log(error);
            }
        });
    }
    console.log(filenames);
    })

}

function processUploadedFile(file) {
    console.log(file.name + " has been processed");
    var contents = fs.readFileSync(file.path);
    var jsonContent = JSON.parse(contents);
    var date = new Date(jsonContent.fileTime);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = date.getFullYear();
    var month = months[date.getMonth()];
    var date1 = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    var time =  date1 + " " + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;

    console.log(time);

    //for item in jsonContent.inventory {
    //    console.log(item);
    //}
    /*
    { area: '0005',
  section: '0021',
  sequence: 1100,
  itemId: '000000025503',
  quantity: -1698,
  itemDescription: '',
  quantityOnHand: 0,
  price: 0,
  department: '',
  departmentDescription: '' }
    */

    jsonContent.inventory.forEach(function(item) {
        //var stmt = db.prepare("INSERT INTO items VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
        //stmt.run(thisEntry.sequence,thisEntry.area,thisEntry.section,thisEntry.upc,thisEntry.quantity,1,thisEntry.check_digit);
/*
        stmt.run(jsonContent.counter,
                 file.name,
                 item.area,
                 item.section,
                 item.sequence,
                 item.itemId,
                 item.quantity,
                 item.itemDescription,
                 item.quantityOnHand,
                 item.price,
                 item.department,
                 item.departmentDescription);
        stmt.finalize();
        */
        console.log(item)

    });

    console.log(jsonContent.inventory[0].area);

}

function sendMessage(data, datatype){
  var message = {"status":"success","type": datatype, "data":data}
  io.emit('inventory', message);
}

function showItemMaster(){
  //con.connect(function(err) {
    //if (err) throw err;
    con.query("SELECT * FROM retail_item_master order by department limit 1000", function (err, result, fields) {
      if (err) {
        initial.is_processing = false;
        initial.has_error = true;
        initial.error_message = "Error retrieving data from retail_item_master(showItemMaster)";
        console.log("error");
        console.log(err)
        sendMessage(initial,"error");
        return;
      }
      sendMessage(result,"item-master-data");
      //console.log(result);
      //console.log(fields);
    });
  //});
}

http.listen(port, function(){
  console.log('listening on *:' + port);
});

io.on('connection', function(socket){
  console.log("connected");
  socket.on('test', function(msg){
    console.log(msg);
  })
  socket.on('inventory', function(msg){
  switch(msg.action){
      case "item-master":
          //loadItemMaster(msg.data);
          break;
      case "load-item-master":
          //processItemMaster();
          break;
      case "process-inventory":
          processInventory();
          break;
      case "show-itemMaster":
        initial.is_processing = true;
        initial.has_error = false;
//          console.log("error");
        sendMessage(initial,"retrieving-item-master-data");
        console.log("show itemMaster");
        showItemMaster();
              //processInventory();
          break;
      default:
          break
  }

});
});
