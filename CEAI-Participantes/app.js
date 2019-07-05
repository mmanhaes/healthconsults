console.log("Iniciando CEAI Cadastro de Participantes Server...");
var express = require('express');
var config = require('./config');
var app = express();
var bodyParser = require("body-parser");
var vcapServices = require('vcap_services');
const uuidv1 = require('uuid/v1');
const case_ins = "(?i)"; 
//Variables used for authentication
var passport = require('passport');
var CustomStrategy = require('passport-local').Strategy;
var auth = require('./auth');
//Variables for Cloudant
var Cloudant = require('cloudant');
var credentials = vcapServices.getCredentials('cloudantNoSQLDB', 'Lite', config.cloudant.instance);
var dbURL =  credentials.url || config.cloudant.url; 
var cloudant = Cloudant(dbURL);
//Control Session data
var session = require('express-session');
//var RedisStore = require('connect-redis')(session);
//Variables for port
var port = (process.env.PORT || process.env.VCAP_APP_PORT || 3000);
var lgpd = require('./lgpd');
var users = require('./users');
const TOOL_NAME = "CEAI Participantes";
var crypto = require('./crypto');
const STANDARD_PASSWORD = '2b126db6d57d0d1763b1a77f3d89ea9e';

passport.use('custom',new CustomStrategy(
		//IF I BY PASS TO OTHER CLASS AND OTHER THREAD WILL CAUSE Error [ERR_STREAM_WRITE_AFTER_END]
		function(username, password, cb) {
			  var db = cloudant.db.use(config.database.users.name);
			  var sel = config.selectors.byUserName;
			  sel.selector.username = username;
			  
			  db.find(sel, function(err, result) {
				  if (err) {
				     console.log("Error in findByUsername",err);
				     return cb(err);
				  }
				  else{
					 if (result.docs.length > 0){
						 //console.log("Returned user name "+result.docs[0].username+" to authenticate");
						 crypto.encrypt(password,function(encryptedPwd){
							 if (result.docs[0].username == username && result.docs[0].password == encryptedPwd){ 
								 console.log("User and Password OK for user:",username);
								 session.user = result.docs[0];								 
								 if (result.docs[0].password == STANDARD_PASSWORD){
									 session.changePassword = true;
								 }
								 else{
									 session.changePassword = false;
								 }
								 return cb(null, result.docs[0]);								 
							 }
							 else{
								 console.log("User or Password NOK for user:",username);
								 return cb(null, false); 
							 }	
						 });
					 }
					 else{
						 return cb(null, false);
					 }
				  }
			  });
}));

passport.serializeUser(function(user, cb) {
	//console.log("Serializing User With Value:",user._id);
	cb(null, user._id);
});

passport.deserializeUser(function(id, cb) {
	 console.log("Calling deserializeUser",id);
	 //console.log("findById called");	  
	 if (session.user._id==id){
		 console.log("User "+session.user.displayName+" is valid");				 
		 return cb(null, session.user);
	 }
	 else{
		 cb(new Error('User ' + id + ' does not exist'));
	 }
});

//Configure view engine to render EJS templates.
app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');

//Use application-level middleware for common functionality, including
//logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(session({ 
		secret: 'keyboard cat', 
		/*
		store: new RedisStore({
			  host:'127.0.0.1',
			  port:6380,
			  prefix:'sess'
			}),*/
			resave: false, 
			saveUninitialized: false
		}));

//Initialize Passport and restore authentication state, if any, from the
//session.
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.use(express.static("node_modules/bootstrap/dist"));
app.use(bodyParser.urlencoded({ extended: false }));

//parse application/json
app.use(bodyParser.json());


var buildSelectorSearchPerson = function(type,data,callback){
	console.log('Checking contiguration by type',type);
	
	var configFound = config.searchPerson.filter(function(item) {
		  return item.type == type;
	});
	
	console.log('Configuration Found',JSON.stringify(configFound[0]));
	
	if (data.lastName!=="" && data.firstName!=="" && data.middleName!=="")
	{
		configFound[0].fullName_selector.selector.firstName.$regex = case_ins+data.firstName;
		configFound[0].fullName_selector.selector.middleName.$regex  = case_ins+data.middleName;
		configFound[0].fullName_selector.selector.lastName.$regex  = case_ins+data.lastName;
		
		return callback(false,configFound[0].fullName_selector);
	}	
	else{
		if (data.lastName!=="" && data.firstName!=="")
		{
			configFound[0].firstAndlastName_selector.selector.firstName.$regex  = case_ins+data.firstName;
			configFound[0].firstAndlastName_selector.selector.lastName.$regex  = case_ins+data.lastName;
			
			return callback(false,configFound[0].firstAndlastName_selector);
		}
		else
		{
			if (data.middleName!=="" && data.firstName!=="")
			{
				configFound[0].firstAndlastName_selector.selector.firstName.$regex  = case_ins+data.firstName;
				configFound[0].fullName_selector.selector.middleName.$regex  = case_ins+data.middleName;
				
				return callback(false,configFound[0].firstAndMiddleName_selector);
			}
			else
			{	
				if (data.firstName!=="")
				{				
					configFound[0].firstName_selector.selector.firstName.$regex  = case_ins+data.firstName;
					
					return callback(false,configFound[0].firstName_selector);
				}
			}	
		}			
	}
	return callback("No Selector Found",null);
};

app.get('/services/ceai/verifyChangePwd',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.setHeader('Content-Type', 'application/json');
	var data = {};
	if (session.changePassword){
		data.message = "CHANGE";		
	}
	else{
		data.message = "DO NOT CHANGE";
	}
	res.end(JSON.stringify(data));
});

app.get('/services/ceai/lgpd', 
		require('connect-ensure-login').ensureLoggedIn(),
        function(req, res){		
	res.setHeader('Content-Type', 'application/json');
	console.log("Reading GDPR for User",req.user.username);
	//I'll set only focusID variable to define what request will show on screen by default.
	//As on requests.html load all headers by requests, on requests.js i'll get more info about the request
	lgpd.findLgpdRecord(req.user.username,TOOL_NAME, function(result,err) {
		if (err){
			var data = {};
			data.message = "NOT ACCEPTED";
			res.end(JSON.stringify(data));
		}
		else{
			var data = {};
			if (result===true){
				data.message = "ACCEPTED";
			}
			else{
				data.message = "NOT ACCEPTED";
			}
			console.log('Response consult GPD record: '+JSON.stringify(data));
			res.end(JSON.stringify(data));
		}
	});	
}); 

app.post('/services/ceai/saveNewPassword', 
		require('connect-ensure-login').ensureLoggedIn(),
        function(req, res){	
	res.setHeader('Content-Type', 'application/json');
	console.log("Saving Password for User",req.user.username);
	var input = req.user
	crypto.encrypt(req.body.password,function(encryptedPwd){
		input.password = encryptedPwd;	
		var db = cloudant.db.use(config.database.users.name);
		
		db.insert(input,function(err, body, header) {
			  var data = {};
		      if (err) {
			        console.log('[db.update] saveNewPassword Error', err.message);
					data.message = "NOK";
					res.end(JSON.stringify(data));
			      }
		      else{
					data.message = "OK";
					res.end(JSON.stringify(data));
		      }
		});
	});
}); 


app.post('/services/ceai/lgpd', 
		require('connect-ensure-login').ensureLoggedIn(),
        function(req, res){	
	res.setHeader('Content-Type', 'application/json');
	console.log("Saving LGPD for User",req.user.username);
	var input = req.body;
	input.email = req.user.username;
	input.tool = TOOL_NAME;
	lgpd.saveLgpdRecord(input, function(result,err) {
		var data = {};
		if (err){
			data.message = "NOT ACCEPTED";
			res.end(JSON.stringify(data));
		}
		else{
			data.message = result;
			console.log('Response save GPD record: '+JSON.stringify(data));
			res.end(JSON.stringify(data));
		}
	});	
}); 

app.get('/services/ceai/userInfo',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.setHeader('Content-Type', 'application/json');
	var data= {};
	data.displayName = req.user.displayName;
	res.end(JSON.stringify(data));	
});

app.get('/services/ceai/checkUserAccess',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.setHeader('Content-Type', 'text/plain');
	console.log("Access Rule : "+session.role);
	res.end(session.role);	
});

app.post('/services/ceai/loadSessionData', function(req, res){
	res.setHeader('Content-Type', 'text/plain');
	//TODO with searchKey , example '{"searchKey" : "general"}' define what selector to search and execute the db.find
		
	if (typeof session.user.userID !== 'undefined')
	{
		var sel = config.selectors[req.body.searchKey];
		sel.selector.userID = session.user.userID;
		var db = null;
		
		if (req.body.searchKey === "general" || req.body.searchKey === "contact" 
			|| req.body.searchKey === "association" || req.body.searchKey === "work" 
				|| req.body.searchKey === "study" || req.body.searchKey ==="forUpdates"){
			db = cloudant.db.use(config.database.person.name);
		}		
		
		if (db !== null){
			db.find(sel, function(err, result) {
				  if (err) {
				    console.log(err);
				    res.end(err);
				  }
				  else{
					  console.log('Found %d documents with %s', result.docs.length,JSON.stringify(sel));
					  for (var i = 0; i < result.docs.length; i++) {
						  console.log('  Doc userIDs: %s', result.docs[i].userID);
					  }
					  console.log(JSON.stringify(result));
					  res.end(JSON.stringify(result));
				  }	  
			});	 
		}
		else{
			 res.end("Nenhum banco de dados encontrado para a operação, contacte o administrador");
		}
	}
});

app.post('/services/ceai/searchCPF', function(req, res){
	res.setHeader('Content-Type', 'application/json');
	
	var db = cloudant.db.use(config.database.person.name);
	
	var sel = config.selectors.cpf;
	
	sel.selector.cpf = req.body.cpf;
	
	//Search with FirstName and LastName or FullName
	db.find(sel, function(err, result) {
			if (err) {
			    console.log(err);
			    config.config.searchError.error = err;
			    res.end(config.searchError);
			}
			else{
				  console.log('Found %d documents with %s', result.docs.length,JSON.stringify(sel));
    			  var response = {};
				  if (result.docs.length>0)
				  {
					  response.data = result;
					  res.end(JSON.stringify(response));
				  }
				  else {
					  response.message = 'NOT FOUND';
					  res.end(JSON.stringify(response));		
				 }
			}
	});
});


app.post('/services/ceai/searchPerson', function(req, res){
	res.setHeader('Content-Type', 'text/plain');
	
	var db = cloudant.db.use(config.database.person.name);
	
	var selector = "";
	var type = JSON.parse(JSON.stringify(req.body.type));
	delete req.body.type;
	console.log("Searching Person by type",type);
	buildSelectorSearchPerson(type,req.body,function(err,response){
		if (err){
			console.log(err);
			config.searchError.error = err;
		    res.end(config.searchError);
		}
		else
		{	
			//Search with FirstName and LastName or FullName
			selector = response;
			console.log("Using selector "+JSON.stringify(selector)+ " to find into database");
			db.find(selector, function(err, result) {
				  if (err) {
				    console.log(err);
				    config.searchError.error = err;
				    res.end(config.searchError);
				  }
				  else{
					  console.log('Found %d documents with %s', result.docs.length,JSON.stringify(selector));
					  if (result.docs.length>0)
					  {
					  	  for (var i = 0; i < result.docs.length; i++) {
					  		  console.log('  Doc userIDs: %s', result.docs[i].userID);
					  	  }
					  	  //console.log('Final response from searchPerson',JSON.stringify(result));
					  	  res.end(JSON.stringify(result));
					  }
					  else {
						  //If not success in FullName or First/Last Name it goes to First and MiddleName 
						  if (req.body.firstName !=="" && req.body.lastName !==""){
							  req.body.middleName = "";
							  buildSelectorSearchPerson(type,req.body,function(err,response){
								  selector = response;
									db.find(selector, function(err, result) {
										 if (result.docs.length>0)
										 {
											  console.log('Found %d documents with %s', result.docs.length,JSON.stringify(selector));
										  	  for (var i = 0; i < result.docs.length; i++) {
										  		  console.log('  Doc userIDs: %s', result.docs[i].userID);
										  	  }
										  	  //console.log('Final response from searchPerson',JSON.stringify(result));
										  	  res.end(JSON.stringify(result));		
										 }
										 else{
										  	//If not success in FullName or First/Last Name it goes to First and MiddleName 
											req.body.middleName = "";
											req.body.lastName = "";
											buildSelectorSearchPerson(type,req.body,function(err,response){
											  selector = response;
												db.find(selector, function(err, result) {
													console.log('Found %d documents with %s', result.docs.length,JSON.stringify(selector));
												  	for (var i = 0; i < result.docs.length; i++) {
												  		  console.log('  Doc userIDs: %s', result.docs[i].userID);
												  	}
												  	if (result.docs.length>0){
												  		  	//console.log('Final response from searchPerson',JSON.stringify(result));
												  		  	res.end(JSON.stringify(result));
												  	}
												  	else{
														  var result = {};
														  result.message = "Not Found";								   
														  console.log("Not Found for query",req.body);
														  res.end(JSON.stringify(result));
													}
												});
   											});  
										 }	  
									});
							  });
						  }
						  else{
							  var result = {};
							  result.message = "Not Found";								   
							  console.log("Not Found for query",req.body);
							  res.end(JSON.stringify(result));
						  }
					  }						  
				  }	  
			});	 
		}	
	});
});

function prepareUpdate(dbSource,request,callback){
	
	switch (request.type){
		case  "all":	
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.cpf = request.cpf;
			dbSource.rg = request.rg;
			dbSource.rgExp = request.rgExp;
			dbSource.rgState = request.rgState;
			dbSource.birthDate = request.birthDate;
			dbSource.address = request.address;
			dbSource.number = request.number;
			dbSource.complement = request.complement;
			dbSource.neighborhood = request.neighborhood;
			dbSource.city = request.city;
			dbSource.state = request.state;
			dbSource.postCode = request.postCode;
			dbSource.parentCpf = request.parentCpf;
			dbSource.parentName = request.parentName;
			dbSource.phone1 = request.phone1;
			dbSource.whatsup1 = request.whatsup1;
			dbSource.phone2 = request.phone2;
			dbSource.whatsup2 = request.whatsup2;
			dbSource.email1 = request.email1;
			dbSource.email2 = request.email2;
			dbSource.habilities= request.habilities;
			dbSource.habilitesNotes= request.habilitesNotes;
			dbSource.association= request.association;
			dbSource.work = request.work;
			dbSource.study = request.study;
			break;
		case  "public":	
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.cpf = request.cpf;
			dbSource.rg = request.rg;
			dbSource.rgExp = request.rgExp;
			dbSource.rgState = request.rgState;
			dbSource.birthDate = request.birthDate;
			dbSource.address = request.address;
			dbSource.number = request.number;
			dbSource.complement = request.complement;
			dbSource.neighborhood = request.neighborhood;
			dbSource.city = request.city;
			dbSource.state = request.state;
			dbSource.postCode = request.postCode;
			dbSource.parentCpf = request.parentCpf;
			dbSource.parentName = request.parentName;
			dbSource.phone1 = request.phone1;
			dbSource.whatsup1 = request.whatsup1;
			dbSource.phone2 = request.phone2;
			dbSource.whatsup2 = request.whatsup2;
			dbSource.email1 = request.email1;
			dbSource.email2 = request.email2;
			dbSource.habilities= request.habilities;
			dbSource.habilitesNotes= request.habilitesNotes;
			break;
		case  "general":
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.cpf = request.cpf;
			dbSource.rg = request.rg;
			dbSource.rgExp = request.rgExp;
			dbSource.rgState = request.rgState;
			dbSource.birthDate = request.birthDate;
			dbSource.address = request.address;
			dbSource.number = request.number;
			dbSource.complement = request.complement;
			dbSource.neighborhood = request.neighborhood;
			dbSource.city = request.city;
			dbSource.state = request.state;
			dbSource.postCode = request.postCode;
			break;
		case "contact":
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.phone1 = request.phone1;
			dbSource.whatsup1 = request.whatsup1;
			dbSource.phone2 = request.phone2;
			dbSource.whatsup2 = request.whatsup2;
			dbSource.email1 = request.email1;
			dbSource.email2 = request.email2;
			break;
		case "association":
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.association = request.association;
			break;
		case "study":
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.study = request.study;
			break;
		case "work":
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.work = request.work;
			break;
	}
	
	return callback(dbSource);
}

app.post('/services/ceai/update', function(req, res){
	res.setHeader('Content-Type', 'text/plain');

	var db = cloudant.db.use(config.database.person.name);
	var selector = config.selectors.forUpdates;
	selector.selector.userID = req.body.userID;
	db.find(selector, function(err, result) {
		  if (err) {
		    console.log(err);
		    config.config.searchError.error = err;
		    res.end(config.searchError);
		  }
		  else{
			    console.log('Found %d documents with %s', result.docs.length,JSON.stringify(selector));
			    console.log('Result %s', JSON.stringify(result));
			    if (result.docs.length>0)
			    {					  	
			    	prepareUpdate(result.docs[0],req.body,function(response){
			    		db.insert(response, function(err, body, header) {
							if (err) {
								console.log('[db.update] ', err.message);
								res.end('[db.update] ', err.message);
							}
							else{
								console.log('You have updated the record.');
								console.log(body);
								console.log('With Content :');
								console.log(JSON.stringify(req.body, null, 2));
								res.write('Requisicão Atualizada com Sucesso com o ID :'+req.body.userID +'\n');
								res.end('para o participante : '+ req.body.firstName+ " "+ req.body.middleName+" "+req.body.lastName);	
							}	
						});								    		
			    	});
			    }
			    else
			    {
			    	res.end('Erro na Atualização para o participante : '+ req.body.firstName+ " "+ req.body.middleName+" "+req.body.lastName);
			    }	
		  }
	});	 
});


app.post('/services/ceai/inputGeneral', function(req, res){
	res.setHeader('Content-Type', 'text/plain');
	cloudant.db.list(function(err, allDbs) {
		console.log('All my databases: %s', allDbs.join(', '));
	});
	console.log(JSON.stringify(req.body, null, 2));

	var db = cloudant.db.use(config.database.person.name);
	var id =  uuidv1();

	db.insert(req.body, id, function(err, body, header) {
		if (err) {
			return console.log('[db.insert] ', err.message);
		}

		console.log('You have inserted the record.');
		console.log(body);
		console.log('With Content :');
		console.log(JSON.stringify(req.body, null, 2));
	});
	res.write('Requisicão Salva com Sucesso com o ID :'+req.body.userID +'\n');
	res.end('para o participante : '+ req.body.firstName+ " "+ req.body.middleName+" "+req.body.lastName);	 
});

app.post('/services/ceai/register', function(req, res){
	res.setHeader('Content-Type', 'text/plain');

	console.log(JSON.stringify(req.body, null, 2));
	
	users.findByUserName(req.body.email1, function(err,result){
		console.log("findByUserName result",JSON.stringify(result));
		//if user was not found create a new user into the system with initial password
		if (result.docs.length == 0){
		   var input = {};
		   input.username = req.body.email1;
		   input.password = STANDARD_PASSWORD;
		   if (req.body.work.length>0){
			   input.role = "admin";
		   }
		   else{
			   input.role = "user";
		   }
		   input.displayName =  req.body.firstName+ ' '+ req.body.middleName+' '+ req.body.lastName;
		   input.userID  = req.body.userID;
		   users.createUser(input,function(err,result){
			   if (err){
				   console.log('Error to create new user',err);
			   }
			   else{
				   console.log('User '+ input.username+' created with success with standard password');
			   }
		   })			
		}

		var db = cloudant.db.use(config.database.person.name);
		
		if (req.body.operation == "insert"){
			var id =  uuidv1();
			delete req.body._id;
			delete req.body._rev;
			db.insert(req.body, id, function(err, body, header) {
				if (err) {
					return console.log('[db.insert from public Register Error] ', err.message);
				}
		
				console.log('You have inserted the record.');
				console.log(body);
				console.log('With Content :');
				console.log(JSON.stringify(req.body, null, 2));
				
				res.end('Dados Cadastrados com Sucesso com o participante :'+req.body.firstName+' '+req.body.middleName+' '+ req.body.lastName+'\n');
			});
		}
		else{

			var db = cloudant.db.use(config.database.person.name);
			var selector = config.selectors.forUpdates;
			selector.selector.userID = req.body.userID;
			db.find(selector, function(err, result) {
				  if (err) {
				    console.log(err);
				    config.config.searchError.error = err;
				    res.end(config.searchError);
				  }
				  else{
					    console.log('Found %d documents with %s', result.docs.length,JSON.stringify(selector));
					    console.log('Result %s', JSON.stringify(result));
					    if (result.docs.length>0)
					    {					  	
					    	prepareUpdate(result.docs[0],req.body,function(response){
					    		db.insert(response, function(err, body, header) {
									if (err) {
										console.log('[db.update] ', err.message);
										res.end('[db.update] ', err.message);
									}
									else{
										console.log('You have updated the record.');
										console.log(body);
										console.log('With Content :');
										console.log(JSON.stringify(req.body, null, 2));
										res.end('Dados Cadastrados com Sucesso para o participante: '+req.body.firstName+' '+req.body.middleName+' '+ req.body.lastName+'\n');								}	
								});								    		
					    	});
					    }
					    else
					    {
					    	res.end('Erro na Atualização para o participante : '+ req.body.firstName+ " "+ req.body.middleName+" "+req.body.lastName);
					    }	
				  }
			});	 
		}
	});
});

app.get('/',
		function(req, res){
		if (typeof(session.user) == 'undefined'){
			res.redirect('/login');
		}else{
			if (session.user.role != 'admin'){		
				res.redirect('/publico');
			}
			else{
				res.redirect('/cadastro');
			}
		}
});

app.get('/home',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/home.html");
});

app.get('/login',
		function(req, res){
	res.render('login');
});

app.post('/login',
		passport.authenticate('custom', { successRedirect: '/', failureRedirect: '/login' }),
		function(req, res) {
	res.redirect('/');
});

app.get('/logout',
		function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/General',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/general.html");
});

app.get('/Contact',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/contact.html");
});

app.get('/Work',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/work.html");
});

app.get('/Book',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/book.html");
});

app.get('/Admin',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/admin.html");
});

app.get('/Study',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/study.html");
});

app.get('/Association',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/association.html");
});

app.get('/cadastro',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	
	console.log("Access Rule: "+session.user.role);
	if (session.user.role != 'admin'){
		console.log("O usuario: "+session.username +" nao tem acesso a esta funcionalidade");
		res.sendFile(__dirname + "/public/noaccess.html");
	}
	else{
		res.sendFile(__dirname + "/public/register.html");
	}
});

app.get('/publico',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
	res.sendFile(__dirname + "/public/public.html");
});

app.listen(port,function(){
	console.log('CEAI Cadastro de Participantes Server running on port:',port);
});

