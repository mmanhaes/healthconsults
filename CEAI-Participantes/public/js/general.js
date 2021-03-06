/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* global $ */
'use strict';

var fwDescriptions=[];
var parentId = '';

function populateData(person){
	$('#userID').val(person.userID);
	$('#fullName').val(person.firstName+ " "+person.middleName+" "+person.lastName);
	$('#rg').val(person.rg);
	$('#rgExp').val(person.rgExp);
	$('#rgState').val(person.rgState);
	$('#cpf').val(person.cpf);
	var date = person.birthDate.split("-");
	$('#day').val(date[0]);
	$('#month').val(date[1]);
	$('#year').val(date[2]);
	$('#address').val(person.address);
	$('#number').val(person.number);
	$('#complement').val(person.complement);
	$('#neighborhood').val(person.neighborhood);
	$('#city').val(person.city);
	$('#state').val(person.state);
	var postCode = person.postCode.split("-");
	$('#postCode-1').val(postCode[0]);
	$('#postCode-2').val(postCode[1]);
}

function checkUserAccess(){
	
	$.ajax({
  		url: '/services/ceai/checkUserAccess',
        type: 'GET',
        contentType: "text/plain",
        success: function(data, textStatus, jqXHR){
        	if (data !== 'admin'){
        		$('#insert').prop("disabled",true).css('opacity',0.5);
        		$('#update').prop("disabled",true).css('opacity',0.5);
        		$('#delete').prop("disabled",true).css('opacity',0.5);
        	}
        },
        error: function(jqXHR, textStatus, errorThrown){
        	console.log("Saving Session Data Failed "+errorThrown);
        }
      });	
}


function loadSessionData(){
	
	var loadData = '{"searchKey" : "general"}';
    
    $.ajax({
  		url: '/services/ceai/loadSessionData',
        type: 'POST',
        data: loadData,
        contentType: "application/json",
        success: function(data, textStatus, jqXHR){
        	//TODO Work on logic to load HTML Fields if session is set with previous search on home.html also disable insert 
        	//alert(data);
        	//{"warning":"no matching index found, create an index to optimize query time","docs":[{"firstName":"Marcelo","middleName":"Mota","lastName":"Manhães","userID":"2017-10-6-21-35-36-580","rg":"09614131-2","rgExp":"SSP-RJ","rgState":"RJ","birthDate":"21-08-1972","address":"Rua Angelo Massignan","number":"955","complement":"Casa","neighborhood":"São Braz","city":"Curitiba","state":"PR","postCode":"82315-000"}]}
        	data = JSON.parse(data);
        	if (data.docs.length>0)
        	{
        		$('#insert').prop("disabled",true).css('opacity',0.5);
        		populateData(data.docs[0]);        		
        	}
        	else
        	{
        		$('#insert').prop("disabled",false).css('opacity',1.0);
        	}	
        },
        error: function(jqXHR, textStatus, errorThrown){
        	console.log("Saving Session Data Failed "+errorThrown);
        }
      });
}

function validateFields(callback){
	if ($.trim($('#fullName').val()) === ''){
		return callback(false,"Insira o nome completo do participante");
	}  
	
	var res = $.trim($('#fullName')).split(" ");
	if (res.length ===1){
		return callback(false,"Nome do participante precisa estar completo");
	}
	
	if ($.trim($('#day').val()) === '' || $.trim($('#month').val()) === '' || $.trim($('#year').val()) === ''){
		return callback(false,"Preencha a data de nascimento completa");
	} 
	
	if ($.trim($('#address').val()) === ''){
		return callback(false,"Preencha o endereço, colocando o número, bairro e cidade nos campos específicos");
	}
	if ($.trim($('#number').val()) === ''){
		return callback(false,"Preencha o número do seu endereço");
	}
	if ($.trim($('#neighborhood').val()) === ''){
		return callback(false,"Preencha o bairro onde mora");
	} 
	if ($.trim($('#city').val()) === ''){
		return callback(false,"Preencha a cidade onde mora");
	} 
	var state = document.getElementById("state");
	
	if (state.selectedIndex === 0 ){

		return callback(false,"Preencha a cidade onde mora");
	}
	
	var rg_state = document.getElementById("rgState");
	
	if ($.trim($('#postCode-1').val()) === '' || $.trim($('#postCode-2').val()) === '')  
	{
		return callback(false,"Coloque a caixa postal nos campos específicos exemplo CEP: 82315-340 (campo 1:82315) (campo 2:340)");
	}	
	
	if (($.trim($('#rg').val()) === '' || $.trim($('#rgExp').val()) === '' || rg_state.selectedIndex === 0) && $.trim($('#cpf').val()) === '' && $.trim($('#parentCpf').val() === ''){
		return callback(false,"Se for maior de idade coloque CPF ou RG (Numero, Orgão Expeditor, Estado do RG), se for menor colocar o CPF do pai ou da mãe e o nome, pode-se usar o botão pesquisar para prenchar automaticamente");
	}
	
	return callback(true,"");
}

function splitFullNameOLD(name,callback){
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
	response.firstName = res[0];
	response.lastName = res[res.length-1];
	var middleName = "";
	for (var i=1; i<res.length-1;++i){
		middleName += " "+res[i];
	}
	response.middleName = middleName;
	return callback(response);
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

function getCustomerID(){
	var currentdate = new Date(); 
	return  currentdate.getFullYear() 
					+ "-" + (currentdate.getMonth()+1) 
					+ "-" + currentdate.getDay()					 
					+ "-" + currentdate.getHours()  
	                + "-" + currentdate.getMinutes() 
	                + "-" + currentdate.getSeconds()
	                + "-" + currentdate.getMilliseconds();
}

$(document).ready(function() {
	$("#parentCpf").focusout(function(){
		var val = $.trim($('#cpf').val())
		var isnum = /^\d+$/.test(val);
		if (!isnum){
			alert("Coloque somente números sem separadores");
			$('#cpf').val("");
		}
	});
	$( "#parentCpf" ).keypress(function() {
		var val = $.trim($('#cpf').val())
		var isnum = /^\d+$/.test(val);
		if (!isnum){
			alert("Coloque somente números sem separadores");
			$('#cpf').val("");
		}
	});	
	$("#cpf").focusout(function(){
		var val = $.trim($('#cpf').val())
		var isnum = /^\d+$/.test(val);
		if (!isnum){
			alert("Coloque somente números sem separadores");
			$('#cpf').val("");
		}
	});
	$( "#cpf" ).keypress(function() {
		var val = $.trim($('#cpf').val())
		var isnum = /^\d+$/.test(val);
		if (!isnum){
			alert("Coloque somente números sem separadores");
			$('#cpf').val("");
		}
	});	
	$('#previous').click(function(){
		window.location = "/home";
	});
	$('#next').click(function(){
		window.location = "/Contact";
	});
	$('#update').click(function(){
		//alert('Insert Button'); 
		var $output = $('.output'),
		$process = $('.processing');	
		validateFields(function(valid,response){
			if (valid === false){
				if (response !== "")
					alert(response);
				else
					alert('Preencha todos os campos !');				
			}
			else{
				$process.show();
				$output.hide();
				var rg_state = document.getElementById("rgState");
				var state = document.getElementById("state");
				var respNames = "";
				splitFullName($.trim($('#fullName').val()),function(response){
					respNames = response;
				});
				
				//+'"confidential" : "'+confidential.options[confidential.selectedIndex].value+'",'
				var updateGeneral = '{'
					+'"type" : "general",'
					+'"userID" : "'+$.trim($('#userID').val())+'",'
					+'"firstName" : "'+$.trim(respNames.firstName)+'",'
					+'"middleName" : "'+$.trim(respNames.middleName)+'",'
					+'"lastName" : "'+$.trim(respNames.lastName)+'",'
					+'"cpf" : "'+$.trim($('#cpf').val())+'",'
					+'"rg" : "'+$.trim($('#rg').val())+'",'
					+'"rgExp" : "'+$.trim($('#rgExp').val())+'",'
					+'"rgState" : "'+rg_state.options[rg_state.selectedIndex].value+'",'
					+'"birthDate" : "'+$.trim($('#day').val())+'-'+$.trim($('#month').val())+'-'+$.trim($('#year').val())+'",'
					+'"address" : "'+$.trim($('#address').val())+'",'
					+'"number" : "'+$.trim($('#number').val())+'",'
					+'"complement" : "'+$.trim($('#complement').val())+'",'
					+'"neighborhood" : "'+$.trim($('#neighborhood').val())+'",'
					+'"city" : "'+$.trim($('#city').val())+'",'
					+'"state" : "'+state.options[state.selectedIndex].value+'",'
					+'"postCode" : "'+$.trim($('#postCode-1').val())+'-'+$.trim($('#postCode-2').val())+'"}';

				console.log(JSON.stringify(updateGeneral));

				$.ajax({
					url: '/services/ceai/update',
					type: 'POST',
					data: updateGeneral,
					contentType: "application/json",
					success: function(data, textStatus, jqXHR){
							console.log(data);
							$('#results').text(data);
							$process.hide();
							$output.show(); 				      	           
					},
					error: function(jqXHR, textStatus, errorThrown){
						$('#results').text('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
						//alert('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
						$process.hide();
						$output.show(); 
					}
				});
			}
		}); 
	});		
	$('#insert').click(function(){
		//alert('Insert Button'); 
		var $output = $('.output'),
		$process = $('.processing');	
		validateFields(function(valid,response){
			if (valid === false){
				if (response !== "")
					alert(response);
				else
					alert('Preencha todos os campos !');				
			}
			else{
				$process.show();
				$output.hide();
				var rg_state = document.getElementById("rgState");
				var state = document.getElementById("state");
				var respNames = "";
				splitFullName($.trim($('#fullName').val()),function(response){
					respNames = response;
				});
				
				//+'"confidential" : "'+confidential.options[confidential.selectedIndex].value+'",'
				var inputGeneral = '{'
					+'"userID" : "'+getCustomerID()+'",'
					+'"firstName" : "'+$.trim(respNames.firstName)+'",'
					+'"middleName" : "'+$.trim(respNames.middleName)+'",'
					+'"lastName" : "'+$.trim(respNames.lastName)+'",'
					+'"cpf" : "'+$.trim($('#cpf').val())+'",'
					+'"rg" : "'+$.trim($('#rg').val())+'",'
					+'"rgExp" : "'+$.trim($('#rgExp').val())+'",'
					+'"rgState" : "'+rg_state.options[rg_state.selectedIndex].value+'",'
					+'"birthDate" : "'+$.trim($('#day').val())+'-'+$.trim($('#month').val())+'-'+$.trim($('#year').val())+'",'
					+'"address" : "'+$.trim($('#address').val())+'",'
					+'"number" : "'+$.trim($('#number').val())+'",'
					+'"complement" : "'+$.trim($('#complement').val())+'",'
					+'"neighborhood" : "'+$.trim($('#neighborhood').val())+'",'
					+'"city" : "'+$.trim($('#city').val())+'",'
					+'"state" : "'+state.options[state.selectedIndex].value+'",'
					+'"parentId" : "'+parentId+'",'
					+'"postCode" : "'+$.trim($('#postCode-1').val())+'-'+$.trim($('#postCode-2').val())+'"}';

				console.log(JSON.stringify(inputGeneral));

				$.ajax({
					url: '/services/ceai/inputGeneral',
					type: 'POST',
					data: inputGeneral,
					contentType: "application/json",
					success: function(data, textStatus, jqXHR){
							console.log(data);
							$('#results').text(data);
							$process.hide();
							$output.show(); 				      	           
					},
					error: function(jqXHR, textStatus, errorThrown){
						$('#results').text('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
						//alert('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
						$process.hide();
						$output.show(); 
					}
				});
			}
		}); 		
	});	
	$('#searchParent').click(function(){
		//alert('Insert Button'); 
		var $output = $('.output'),
		$process = $('.processing');	
		if ($.trim($('#parentCpf').val()) === ''){
			alert('Preencha o campo Parentesco CPF com o CPF do pai ou da Mãe antes de pesquisar! Esta pesquisa é somente necessária quando o participante é menor');
		}		
		else{
			$process.show();
			$output.hide();
			var inputParent = '{'
				+'"parentCpf" : "'+$.trim($('#parentCpf').val())+'"}';

			console.log(JSON.stringify(inputParent));

			$.ajax({
				url: '/services/ceai/searchParent',
				type: 'POST',
				data: inputParent,
				contentType: "application/json",
				success: function(response, textStatus, jqXHR){
						console.log(response);
						if (response.message =='NOT FOUND'){
							$('#results').text("Responsável com o CPF: "+$.trim($('#parentCpf').val())+" não foi encontrado");
						}
						else{
							$('#parentName').val(response.data.firstName+" "+response.data.middleName+" "+response.data.lastName);
							$('#results').text("Responsável Encontrado !");
						}
						$process.hide();
						$output.show(); 				      	           
				},
				error: function(jqXHR, textStatus, errorThrown){
					$('#results').text('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
					//alert('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
					$process.hide();
					$output.show(); 
				}
			});
		}
		
	});	
});
