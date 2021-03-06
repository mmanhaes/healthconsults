/**
 * http://usejsdoc.org/
 */

var config = require('./config');
var vcapServices = require('vcap_services');
var Cloudant = require('cloudant');
var credentials = vcapServices.getCredentials('cloudantNoSQLDB', 'Lite', config.cloudant.instance);
var dbURL =  credentials.url || config.cloudant.url; 
var cloudant = Cloudant({url: dbURL, plugin:'retry', retryAttempts:30, retryTimeout:35000 });
const uuidv1 = require('uuid/v1');
const REPLACEMENT_KEY = '<ENTRY>';
const case_ins = "(?i)"; 
var nInserts = 0;
var nUpdates = 0;
var randomstring = require("randomstring");
const fs = require("fs");
var notFound = [];

function getParticipantID(){
	var currentdate = new Date(); 
	
	var padding = randomstring.generate({
		  length: 4,
		  charset: 'numeric'
	});
	
	return  currentdate.getFullYear() 
					+ "-" + (currentdate.getMonth()+1) 
					+ "-" + currentdate.getDay()					 
					+ "-" + currentdate.getHours()  
	                + "-" + currentdate.getMinutes() 
	                + "-" + currentdate.getSeconds()
	                + "-" + padding;
}

function insertParticipant(data,callback){

	var id =  uuidv1(); 
	var db = cloudant.db.use(config.database.person.name);
	db.insert(data, id, function(err, response, header) {
		if (err) {
			console.log('[db.insert] ', err.message);
			return callback(null,err);
		}

		console.log('You have inserted the record.');
		console.log('With Content :');
		console.log(JSON.stringify(response, null, 2));

		return callback(true,null);
	});	
}

function insertParticipantPromise(data){
	return new Promise(function (resolve, reject) {
		var id =  uuidv1(); 
		var db = cloudant.db.use(config.database.person.name);
		db.insert(data, id, function(err, response, header) {
			if (err) {
				console.log('[db.insert] ', err.message);
				reject(err);
			}
	
			console.log('You have inserted the record.');
			console.log('With Content :');
			console.log(JSON.stringify(response, null, 2));
	
			resolve(true);
		});	
	});
}


function updateParticipant(data,callback){

	var db = cloudant.db.use(config.database.person.name);
	db.insert(data, function(err, response, header) {
		if (err) {
			console.log('[db.update] for data: '+JSON.stringify(data)+' Error: '+ err.message);
			return callback(null,err);
		}

		console.log('You have updated the record.');
		console.log('With Content :');
		console.log(JSON.stringify(response, null, 2));

		return callback(true,null);
	});	
}

function prepareUpdateFinance(dbSource,request,callback){
	
	dbSource.fincode = request.fincode;
	dbSource.finance = request.finance;

	return callback(dbSource);
}


function prepareUpdate(dbSource,request,callback){
	
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
			dbSource.userID= request.userID;
			dbSource.firstName = request.firstName;
			dbSource.middleName = request.middleName;
			dbSource.lastName = request.lastName;
			dbSource.association = request.association;
			dbSource.study = request.study;
			dbSource.work = request.work;
			dbSource.finance = request.finance;

	
	return callback(dbSource);
}

var buildSelectorSearchPerson = function(data,callback){
	var configFound = config.searchPerson.filter(function(item) {
		  return item.type == "register";
	});
	
	if (data.lastName!=="" && typeof (data.lastName) !=='undefined' && data.firstName!=="" && typeof (data.firstName) !=='undefined' && data.middleName!=="" && typeof (data.middleName) !=='undefined')
	{
		configFound[0].fullName_selector.selector.firstName.$regex = case_ins+data.firstName;
		configFound[0].fullName_selector.selector.middleName.$regex  = case_ins+data.middleName;
		configFound[0].fullName_selector.selector.lastName.$regex  = case_ins+data.lastName;
		
		return callback(false,configFound[0].fullName_selector);
	}	
	else{
		if (data.lastName!=="" && typeof (data.lastName) !=='undefined' && data.firstName!=="" && typeof (data.firstName) !=='undefined')
		{
			configFound[0].firstAndlastName_selector.selector.firstName.$regex  = case_ins+data.firstName;
			configFound[0].firstAndlastName_selector.selector.lastName.$regex  = case_ins+data.lastName;
			
			return callback(false,configFound[0].firstAndlastName_selector);
		}
		else
		{
			if (data.middleName!==""&& typeof (data.middleName) !=='undefined' && data.firstName!=="" && typeof (data.firstName) !=='undefined')
			{
				configFound[0].firstAndlastName_selector.selector.firstName.$regex  = case_ins+data.firstName;
				configFound[0].fullName_selector.selector.middleName.$regex  = case_ins+data.middleName;
				
				return callback(false,configFound[0].firstAndMiddleName_selector);
			}
			else
			{	
				if (data.firstName!=="" && typeof (data.firstName) !=='undefined')
				{				
					configFound[0].firstName_selector.selector.firstName.$regex  = case_ins+data.firstName;
					
					return callback(false,configFound[0].firstName_selector);
				}
			}	
		}			
	}
	return callback("No Selector Found",null);
};

function insertParticipantControl(data,index){
	return new Promise(function (resolve, reject) {
		if (index == data.length){
			resolve(false);
		}
		else{
			var db = cloudant.db.use(config.database.person.name);
			buildSelectorSearchPerson(data[index],function(err,sel){
				console.log("Search Existing Participant with selector: "+JSON.stringify(sel));
				db.find(sel, function(err, result) {
					  if (err) {
					    console.log(err);
					    reject(err);
					  }
					  else{
						  if (result.docs.length===0){
							  console.log("No docs found preparing for insert data:",data[index]);
							  insertParticipant(data[index],function(result,error){
									if (error){
										reject(error);
									}else{
										console.log('Insert worked for the Name '+ data[index].firstName+' '+ data[index].middleName + ' ' + data[index].lastName);
										var insert = insertParticipantControl(data,++index);
										insert.then(function(response){		
											if (response)
												nInserts++;
											resolve(true);
										},function(err){
											console.log("Error in insertParticipantControl",err);
										});
									}
							  });
						  }
						  else{
							  console.log('insert not done ! Reason: participant with Name '+ data[index].firstName+' '+ data[index].middleName + ' ' + data[index].lastName + ' already exists in database');
							  var insert = insertParticipantControl(data,++index);
							  insert.then(function(response){		
									if (response)
										nInserts++;
									resolve(false);
								},function(err){
									console.log("Error in insertParticipantControl",err);
							  });
						  }
					  }
				});		
			});
		}
	});
}

function splitFullName(name,callback){
	var res = name.split(" ");
	var response = {
			firstName: "",
			lastName: "",
			middleName: ""
	};
	if (res.length ===1 )
	{
		response.firstName = name;
		return callback(response);
	}
	response.firstName = res[0].trim();
	response.lastName = res[res.length-1];
	var middleName = "";
	var complement_lastName = "";
	for (var i=1; i<res.length-1;++i){
		if (i == res.length-2){
			if (res[i]=="DOS" || res[i]=="DAS" || res[i]=="DO" || res[i]=="DA" || res[i]=="DE" || res[i]=="DI" || res[i]=="DU" || res[i]=="E"){
				complement_lastName = res[i];
			}
			else{
				middleName += " "+res[i];
			}
		}
		else{
			middleName += " "+res[i];
		}
	}
	if (complement_lastName != ""){
		response.lastName =complement_lastName+" "+response.lastName;
		response.lastName = response.lastName.trim();
	}
	response.middleName = middleName.trim();
	
	console.log('Name Structure',JSON.stringify(response));
	
	return callback(response);
}

function transformDataFinance(data){
	var particpants = [];
	
	for(var i=0;i<data.length;++i){
		var participant = JSON.parse(JSON.stringify(config.participant));
		console.log('Transforming data line',data[i]);
		splitFullName(data[i]['NOME COMPLETO'].trim(),function(response){
			participant.firstName = response.firstName;
			participant.middleName = response.middleName;
			participant.lastName = response.lastName;
			participant.finance = [];
			participant.fincode = data[i]['NCODE'];
			particpants.push(participant);	
		});		
	}
	
	return particpants;
}

function transformDataV2(data){
	var particpants = [];
	
	for(var i=0;i<data.length;++i){
		var participant = JSON.parse(JSON.stringify(config.participant));
		if (data[i]['TIPOS DE CADASTRO'] == 'B' || data[i]['TIPOS DE CADASTRO'] == 'F'){
			if (data[i]['userID']=='' || typeof (data[i]['userID']) =='undefined'){
				participant.firstName = data[i].firstName;
				participant.middleName = data[i].middleName;
				participant.lastName = data[i].lastName;
				var association = JSON.parse(JSON.stringify(config.association));
				if (data[i]['TIPO DE ASSOCIADO'] === 'FREQUENTADOR'){
					association.associationType = "Participante";
				}
				participant.association.push(association);
				participant.rg = data[i].rg;
				participant.rgExp = data[i].rgExp;
				participant.rgState = data[i].rgState;
				participant.address = data[i].address;
				participant.number = data[i].number;
				participant.complement = data[i].complement;
				participant.neighborhood = data[i].neighborhood;
				participant.city = data[i].city;
				participant.state = data[i].state;
				participant.postCode = data[i].postCode;
				participant.phone1 = data[i].phone1
				participant.phone2 = data[i].phone2
				participant.email1 = data[i].email1
				participant.email2 = data[i].email2
				particpants.push(participant);
			}
			else{
				console.log('User '+data[i]['userID']+ ' is already inserted');
			}
		}
		else{
			console.log('User '+ data[i]['userID']+' is already a financial and library user and it is already inserted');
		}
	}
	
	return particpants;
}

function transformData(data){
	var particpants = [];
	
	for(var i=0;i<data.length;++i){
		var participant = JSON.parse(JSON.stringify(config.participant));
		participant.userID = getParticipantID();
		splitFullName(data[i]['NOME'],function(respNames){
			participant.firstName = respNames.firstName;
			participant.middleName = respNames.middleName;
			participant.lastName = respNames.lastName;
			participant.address = data[i]['ENDERECO'];
			participant.neighborhood = data[i]['BAIRRO'];
			participant.city = data[i].CIDADE;
			participant.state = data[i]['ESTADO'];
			participant.postCode = data[i]['CEP'];
			participant.phone1 = data[i]['FONE_1'];
			participant.phone2 = data[i]['FONE_2'];
			var association = JSON.parse(JSON.stringify(config.association));
			if (data[i].SITUA === 'INATIVO' || data[i].SITUA === 'inativa'){
				association.associationType = "INATIVO";
			}
			else{
				if (data[i].SITUA === 'ISENTO' || data[i].SITUA === 'ISENTA'){
					association.contribution = "ISENTO";
				}				
				if (data[i].TIPO === 'C'){
					association.associationType = "Colaborador";
				}
				if (data[i].TIPO === 'E'){
					association.associationType = "Efetivo";
				}
			}
			participant.association.push(association);
			participant.email1 = data[i].EMAIL;
			particpants.push(participant);
		});
	}
	
	return particpants;
}

function changeEncoding(path) {
	var iconv = require('iconv-lite');
    var buffer = fs.readFileSync(path);
    var output = iconv.encode(iconv.decode(buffer, "iso8859-1"), "utf-8");
    fs.writeFileSync(path, output);
}

function convertFile(fileName){
	var fs = require("fs");
	var input = fs.readFileSync(fileName, {encoding: "ascii"});

	var iconv = require('iconv-lite');
	var output = iconv.decode(input, "ISO-8859-1");

	fs.writeFileSync(fileName, output);
}

function loadParticipantsFromFileCSV(fileName){
	var iconv = require('iconv-lite');
	const csv = require('csv-parser');
	const fs = require('fs');

	var data = [];
	fs.createReadStream(fileName)
	  .pipe(iconv.decodeStream("utf-8"))
	  .pipe(csv())
	  .on('data', (row) => {
	    console.log(row);
		data.push(row);
	})
	.on('end', () => {
	    console.log('CSV file successfully processed');
	    return data;	    
	});		
}
		
function loadParticipantsFromFileExcel(fileName,sheetName){
	var XLSX = require('xlsx');
	
	/* DOES NOT WORK
		let buf = fs.readFileSync(fileName, {encoding: 'utf8'});
		var workbook = XLSX.read(buf, {type:'string'});
	*/
	//changeEncoding(fileName);
	var workbook = XLSX.readFile(fileName,{codepage:65001,encoding:"utf-8"});	
	var worksheet = workbook.Sheets[sheetName];
	var headers = {};
	var data = [];
	for(z in worksheet) {
		//console.log(z);
	    if(z[0] === '!') continue;
	    //parse out the column, row, and value
	    var col = z.substring(0,1);
	    var row = parseInt(z.substring(1));
	    var value = worksheet[z].v;
	    //console.log('Row Number',row);
	    //console.log('Row values',value);
	    
	    //store header names
	    if(row === 1) {
	        headers[col] = value;
	        //console.log('Headers',headers);
	        continue;
	    }
	
	    if(!data[row]) data[row]={};
	    data[row][headers[col]] = value;
	}

	//Deal with empty values
	var filtered = data.filter(Boolean);
	
	return filtered;
}

function updateParticipantControlFinance(data,index){
	return new Promise(function (resolve, reject) {
		if (index == data.length){
			resolve(false);
		}
		else{
			var db = cloudant.db.use(config.database.person.name);
			buildSelectorSearchPerson(data[index],function(err,sel){
				console.log("Search Existing Participant with selector: "+JSON.stringify(sel));
				db.find(sel, function(err, result) {
					  if (err) {
					    console.log(err);
					    reject(err);
					  }
					  else{
						  if (result.docs.length>0){
							  prepareUpdateFinance(result.docs[0],data[index],function(updated){
								  console.log("data to be updated",updated);
								  updateParticipant(updated,function(result,error){
										if (error){
											reject(error);
										}else{
											console.log('Update worked for the Name '+ data[index].firstName+' '+ data[index].middleName + ' ' + data[index].lastName+ ' with Financial code: '+data[index].fincode);
											var update = updateParticipantControlFinance(data,++index);
											update.then(function(response){		
												if (response)
													nUpdates++;
												resolve(true);
											},function(err){
												console.log("Error in updateParticipantControlFinance",err);
											});
										}
								  });
								  /*
								     var update = updateParticipantControlFinance(data,++index);
									update.then(function(response){		
										if (response)
											nUpdates++;
										resolve(true);
									},function(err){
										console.log("Error in updateParticipantControlFinance",err);
								  });
								  */ 
							  });							  
						  }
						  else{
							  console.log('Update not done ! Reason: participant with Name '+ data[index].firstName+' '+ data[index].middleName + ' ' + data[index].lastName + ' does not exists in database');
							  notFound.push(data[index]);
							  var update = updateParticipantControlFinance(data,++index);
							  update.then(function(response){		
									if (response)
										nUpdates++;
									resolve(false);
								},function(err){
									console.log("Error in updateParticipantControlFinance",err);
							  });
						  }
					  }
				});		
			});
		}
	});
}

function loadParticipants(fileName){
	var data = loadParticipantsFromFileExcel(fileName,'CADGERAL');
	var participants = transformData(data);
	//console.log(participants);
	var nCheck=0;	
	var insert = insertParticipantControl(participants,nCheck);
	insert.then(function(response){		
		if (response)
			nInserts++;
		console.log('Number of Participants Inserted',nInserts);
	},function(err){
		console.log("Error in loadParticipants",err);
	});		
}

function dumpParticipantsNotFound(data,outputFile){
	var xlsx = require('node-xlsx').default;
	
	var fields = JSON.parse(JSON.stringify(config.selectors.forDump.fields));
 
    var output = [['NOME COMPLETO','NCODE']];
    
    
	for (var j=0;j<data.length;++j){
	   var item = [];
	   item.push(data[j].firstName+" "+data[j].middleName+" "+data[j].lastName);
	   item.push(data[j].fincode);
	   output.push(item);
	}
	
	const buffer = xlsx.build([{ name: "participants", data: output }]);
				   
	fs.writeFile(outputFile, buffer, (err) => {
		    if (err) throw err
		    console.log('Dump of finance participants not found in the system executed with success on file',outputFile);					    
	});	
}

function dumpParticipants(outputFile){
	var xlsx = require('node-xlsx').default;
	
	var db = cloudant.db.use(config.database.person.name);
	var sel = config.selectors.forDump;
	
	var fields = JSON.parse(JSON.stringify(config.selectors.forDump.fields));
 
    var data = [fields];
    
	db.find(sel, function(err, result) {
		if (err) {
		 	data.message = "NOK";
			res.end(JSON.stringify(data));
		}
		else{
			 if (result.docs.length>0){
				   console.log('Number of participantes found',result.docs.length);
				   for(var i=0;i<result.docs.length;++i){
					   var item = [];
					   for (var j=0;j<fields.length;++j){
						   item.push(result.docs[i][fields[j]])
					   }
					   data.push(item);
				   }				 
				   const buffer = xlsx.build([{ name: "participants", data: data }]);
				   
				   fs.writeFile(outputFile, buffer, (err) => {
					    if (err) throw err
					    console.log('Dump of participantes executed with success on file',outputFile);					    
				   });
			 }
		}
	});
	
}

function loadParticipantsV2(fileName,sheetName){
	var data = loadParticipantsFromFileExcel(fileName,sheetName);
	var participants = transformDataV2(data);
	var promises = [];
	for(var i=0;i<participants.length;++i){
		promises.push(insertParticipantPromise(participants[i]));
	}
	Promise.all(promises).then(function(values) {
		  console.log('Number of Inserts '+values.length);
	},function(err){
		console.log("Error in insertParticipantControl",err);
	});
}

function loadParticipantsFinance(fileName,sheetName){
	//convertFile(fileName);
	//var data = loadParticipantsFromFileCSV(fileName);
	
	var data = loadParticipantsFromFileExcel(fileName,sheetName);
	var participants = transformDataFinance(data);
	
	nUpdates=0;
	var nCheck=0;	
	var update = updateParticipantControlFinance(participants,nCheck);
	update.then(function(response){		
		if (response)
			nUpdates++;		
		dumpParticipantsNotFound(notFound,'./data/financeParticipantsNotFond.xlsx');
		console.log('Number of Participants Update',nUpdates);
	},function(err){
		console.log("Error in loadParticipantsFinance",err);
	});	
}

function searchRecursive(data, records,outputFile,counter){
	var db = cloudant.db.use(config.database.person.name);
	buildSelectorSearchPerson(data[counter],function(err,sel){
		console.log("Search Participant with selector: "+JSON.stringify(sel));
		db.find(sel, function(err, result) {
			  if (err) {
			    console.log(err);
			  }
			  else{
				  if (result.docs.length===0){
					  console.log("Record not inserted");
					  //records.push("NOT INSERTED: "+ data[counter].firstName + data[counter].middleName + data[counter].lastName+' - Tipo Cadastro: '+data[counter]['TIPOS DE CADASTRO']+'\n');
					  records.push(data[counter].firstName +' ' +data[counter].middleName +' ' +data[counter].lastName+' - Tipo Cadastro: '+data[counter]['TIPOS DE CADASTRO']+'\n');
				  }
				  else{
					  console.log("Record already inserted");
					  //records.push("INSERTED: "+ result.docs[0].firstName + result.docs[0].middleName + result.docs[0].lastName+' - Tipo Cadastro: '+data[counter]['TIPOS DE CADASTRO']+'\n');
				  }
				  counter++;
				  if (counter == data.length){
					  fs.writeFile(outputFile, records, (err) => {
						    if (err) throw err
						    console.log('Check of participantes executed with success on file',outputFile);					    
					  });					  
				  }
				  else{
					  searchRecursive(data,records,outputFile,counter);
				  }
			  }			  
		});
	});
}

function checkInserts(fileName,sheetName,outputFile){	
	var data = loadParticipantsFromFileExcel(fileName,sheetName);
	var records = [];
	var counter =0;
	searchRecursive(data,records,outputFile,counter);	
}

//var args = process.argv.splice(2);
//loadParticipants('./data/CADASTRO BIBLIOTECA FINAL.xlsx');
//dumpParticipants('./data/participantsCloud.xlsx');
//loadParticipantsV2('./data/RemainingNotInserted.xlsx','Sheet1');
loadParticipantsFinance('./data/financeParticipantsNotFond-Input.xlsx','participants');
//checkInserts('./data/RemainingNotInserted.xlsx','Sheet1','./data/checkInserts-remaining.txt');
//checkInserts('./data/CADASTRO BIBLIOTECA FINAL.xlsx','ajuste 30.08.19','./data/checkInserts.txt');