var mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var path = require('path')
var multer  = require('multer')
var storage = multer.diskStorage({
	destination: './public/uploads/',
 	filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  	},
  	
})
var upload = multer({ storage: storage })

app.set('view engine','ejs');

app.use(express.static(__dirname + ''));

server.listen(process.env.PORT || 61018, function()

//read file view
app.get('/',function(req,res){
	res.render('home');
});
app.get('/app',function(req,res){
	res.render('mobile');
});
app.get('/index',function(req,res){
	res.render('index');
});
app.get('/setting/create',function(req,res){
	res.render('create');
});

//connect mongodb
mongo.connect('mongodb://admin:123123@ds161018.mlab.com:61018/slot-machine', function (err,db){

	if(err) throw err;
	io.on('connection', function(socket){

		var col  = db.collection('event');

		socket.on('input',function(data){
			var token = data.id,
				name = data.name,
				picture = data.picture;
				col.insert({token: token, name: name, picture: picture}, function (){
				console.log('Inserted');
			});
			io.emit('output',[data]);
		});

		console.log('hello');

		socket.on('logout', function(data) {
			console.log(data);
			io.emit('logout',[data]);
		});

		socket.on('getdata_rand',function(data){
			setting.find().limit(100).toArray(function(err,res){
				io.emit('data_rand',res);
				console.log('yes');
			});
		});
		socket.on('num_reward',function(data){
			console.log(data.num_reward-1);
			setting.updateOne({ "_id" : ObjectId(data._id)},{$set:{num_reward:data.num_reward-1}})
		});

	});


	var setting  = db.collection('setting');

	app.post('/store_setting', upload.single('image'), function (req, res) {
		var data = {
			chance:req.body.chance,
			num_reward:req.body.num_reward,
			image:req.file.filename
		}
		setting.insert({chance:data.chance, num_reward:data.num_reward, image:data.image},function(){
			res.redirect("/setting");
		});
	});
	
	
	app.get('/setting',function(req,res){
		setting.find().limit(100).toArray(function(err,item){
			if (err) throw err;
				res.render('setting',{data:item});
		});
	});
	

	app.get('/store_delete',function(req,res){
		setting.remove({ "_id" : ObjectId(req.query._id) }, function(err, result) {
			console.log('removed');
			res.redirect("/setting");
		});
	});
});

