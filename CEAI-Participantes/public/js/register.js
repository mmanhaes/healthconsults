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
var parentId = '';

var searchCache = [];
var cachedPosition;
var association = [];
var work = [];
var study = [];
var currentDepartment;

function cleanSearchOutput(table){
	var length = table.rows.length;
	for (var i = length-1; i >=2 ; --i) {
		table.deleteRow(i);
	} 	
}

function loadCurrentUser(){
	$.ajax({
		url: '/services/ceai/userInfo',
        type: "GET",
        success: function(data, textStatus, jqXHR){
        	$('#displayName').text('CEAI - Bem Vindo '+data.displayName);               
        },
        error: function(jqXHR, textStatus, errorThrown){
        	console.log(errorThrown);
        }
    });	
}

function handleChangeRadioButton(){
	
	var radios = document.getElementsByName("group1");
	var table = document.getElementById("tableResult");
	var pos,row,cellFullName;
    for (var i = 0, len = radios.length; i < len; i++) {
         if (radios[i].checked) {
        	 pos = i;
        	 row = table.rows[i+2];
        	 cellFullName = row.cells[2];
        	 break;
         }
    }
    cachedPosition = pos;
    checkUserAccess(function(access){
    	enableDisableActions(access);
    	enableDisableFields(access);
    	switch (access){
    	case 0:
    		alert("Usuário "+cellFullName.innerHTML+" carregado para leitura.");
    		break;
    	case 1:
    		alert("Usuário "+cellFullName.innerHTML+" carregado para alterações parciais.");    		
    		break;
    	case 2:
    		alert("Usuário "+cellFullName.innerHTML+" carregado para alterações em todos os campos.");    		
    		break;
    	}    	
        association = [];
        work = [];
        study = [];
        populateData(searchCache.docs[pos]);
    	var $userData = $('.userData');
    	var $output = $('.outputGeneral');
    	var $newRecordButton = $('.newRecord');
    	$userData.show();
    	$output.hide();
    	$newRecordButton.hide();
    });    
}

function buildSearhOutput(data){
	 
	    var table = document.getElementById("tableResult");

	    for (var i = 0; i < data.docs.length; i++) {
		    var rowCount = table.rows.length;
		    var row = table.insertRow(rowCount);
	
		    var cell = row.insertCell(0);
		    cell.innerHTML= '<input type="radio" name="group1" onchange="handleChangeRadioButton();">';		    
		    cell.style="border: 1px solid grey";
		    cell.align="center";
		    cell  = row.insertCell(1);
		    cell.innerHTML= data.docs[i].userID;
		    cell.style="border: 1px solid grey";
		    cell.align="center";
		    cell = row.insertCell(2);
		    if (data.docs[i].middleName !== "")
		    	cell.innerHTML= data.docs[i].firstName+" "+data.docs[i].middleName+" "+data.docs[i].lastName;
		    else
		    	cell.innerHTML= data.docs[i].firstName+" "+data.docs[i].lastName;
		    cell.colSpan = 2;
		    cell.style="border: 1px solid grey";
		    cell.align="center";
		    cell = row.insertCell(3);
		    cell.innerHTML= data.docs[i].phone1 || "";
		    cell.style="border: 1px solid grey";
		    cell.align="center";
		    cell = row.insertCell(4);
		    cell.innerHTML= data.docs[i].email1 || "";
		    cell.style="border: 1px solid grey";
		    cell.align="center";
	    }
}

function validateFieldsSearch(){
	if ($.trim($('#fullName').val()) === '' && $.trim($('#cpf').val()) === '' )  
	{
		return 0;
	}
	else{
		if ($.trim($('#fullName').val()) != ''){
			return 1;
		}
		if  ($.trim($('#cpf').val()) != ''){
			return 2;
		}
	}
	
	return -1;
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
	response.firstName = res[0];
	response.lastName = res[res.length-1];
	var middleName = "";
	for (var i=1; i<res.length-1;++i){
		middleName += " "+res[i];
	}
	response.middleName = middleName;
	return callback(response);
}

function populateAssociationData(association){
	$('#associationGroup').val(association.associationGroup);
	handleAssociationGroupChange();
	$('#associationType').val(association.associationType);
	$('#associationStatus').val(association.associationStatus);
	var date = '';
	if (typeof(association.initDate)!=='undefined'){
		var date =association.initDate.split("-");
		$('#initAssociationDay').val(date[0]);
		$('#initAssociationMonth').val(date[1]);
		$('#initAssociationYear').val(date[2]);
	}
	date = association.exitDate.split("-");
	if (typeof(association.initDate)!=='undefined'){
		$('#exitAssociationDay').val(date[0]);
		$('#exitAssociationMonth').val(date[1]);
		$('#exitAssociationYear').val(date[2]);			
		$('#contribution').val(association.contribution);
		$('#notesAssociation').val(association.notes);
	}
}

function buildAssociationRowTable(data){
	 
    var table = document.getElementById("tableResultAssociation");

    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    row.insertCell(0).innerHTML= '<input type="radio" name="group1" onchange="handleChangeRadioButtonAssociation();">';
    row.insertCell(1).innerHTML= data.associationGroup;
    row.insertCell(2).innerHTML= data.associationType;
    row.insertCell(3).innerHTML= data.associationStatus;
    row.insertCell(4).innerHTML= data.initDate;
    row.insertCell(5).innerHTML= data.exitDate;
    row.insertCell(6).innerHTML= data.contribution;
    row.insertCell(7).innerHTML= data.notes;
  
}

function populateData(person){
	$('#userID').val(person.userID);
	$('#fullNameInput').val(person.firstName+ " "+person.middleName+" "+person.lastName);
	$('#rg').val(person.rg);
	$('#rgExp').val(person.rgExp);
	$('#rgState').val(person.rgState);
	$('#cpfInput').val(person.cpf);
	if (typeof(person.birthDate)!='undefined'){
		var date = person.birthDate.split("-");
		$('#day').val(date[0]);
		$('#month').val(date[1]);
		$('#year').val(date[2]);
	}
	$('#address').val(person.address);
	$('#number').val(person.number);
	$('#complement').val(person.complement);
	$('#neighborhood').val(person.neighborhood);
	$('#city').val(person.city);
	$('#state').val(person.state);
	if (typeof(person.postCode)!=='undefined'){
		var postCode = person.postCode.split("-");
		$('#postCode-1').val(postCode[0]);
		$('#postCode-2').val(postCode[1]);
	}
	$('#parentCpf').val(person.parentCpf);
	$('#parentName').val(person.parentName);
	$('#habilities').val(person.habilities);
	$('#notesHabilities').val(person.habilitiesNotes);
		
	var phone = [];
	if (typeof(person.phone1) !== 'undefined')
	{
		phone = person.phone1.split("-");
		$('#ddd1').val(phone[0]);
		$('#phone1').val(phone[1]);
	}
	if (typeof(person.whatsup1) != 'undefined' || person.whatsup1 != ''){
		$('#whatsup1').val(person.whatsup1);
	}
	if (typeof(person.phone2) !== 'undefined')
	{
		phone = person.phone2.split("-");
		$('#ddd2').val(phone[0]);
		$('#phone2').val(phone[1]);
	}
	if (person.whatsup2 !== ""){
		$('#whatsup2').val(person.whatsup2);
	}
	$('#email1').val(person.email1);
	$('#email2').val(person.email2);	
	
	console.log(JSON.stringify(person));
	
	if (typeof(person.association)!='undefined'){
	    association = person.association;
		for(var i=association.length-1;i>=0;--i){
			if (i===association.length-1){
				populateAssociationData(association[i]);
			}
			buildAssociationRowTable(association[i]);
		}
		var radios = document.getElementsByName("groupAssociation");
		if (radios.length > 0){
			radios[0].checked = true;
		}
	}
	if (typeof(person.work)!='undefined'){
		work = person.work;
		for(var i=0; i<work.length;++i){
			if (i==0){
				populateWorkData(work[i]);
			}
			buildWorkRowTable(work[i]);
		}
		var radios = document.getElementsByName("groupWork");
		if (radios.length > 0){
			radios[0].checked = true;
		}
	}
	if (typeof(person.study)!='undefined'){	
		study = person.study;
		for(var i=0;i<study.length;++i){
			if (i==0){
				populateStudyData(study[i]);
			}
			buildStudyRowTable(study[i]);
		}
		var radios = document.getElementsByName("groupStudy");
		if (radios.length > 0){
			radios[0].checked = true;
		}
	}
	if (typeof(person.fincode)!='undefined'){
		$('#fincode').val(person.fincode);
	}	
	if (typeof(person.finance)!='undefined'){
		handlePaymentYearLoad();
		var currentdate = new Date(); 
		$('#paymentYear').val(currentdate.getFullYear());
		handlePaymentChange(person,currentdate.getFullYear());
	}	
	populateVolunteerFormData(person);
}

function populateVolunteerFormData(person){
	
	var a = document.getElementById('vonlunteerFormLink'); //or grab it by tagname etc
	a.href = "/services/ceai/showVolunteerForm?fincode="+ person.fincode;		
	   
    console.log('Data Form Populated');
}

function handlePaymentChange(person,year){
	
	var finance = person.finance.filter(function(item) {
		  return item.year == year;
	});
	for(var i=finance.length-1;i>=0;--i){
		buildPaymentRowTable(finance[i]);
	}
}

function validateFieldsStudy(callback){
	
	if ($('#studyType').val() === "No Selection"){
		return callback(false,"Selecione um tipo de estudo");
	}
	if ($('#weekDayStudy').val() === "No Selection"){
		return callback(false,"Selecione o dia da semana de estudo");
	}
	if ($('#periodStudy').val() === "No Selection"){
		return callback(false,"Selecione o período de estudo");
	}


	if ($.trim($('#initStudyDay').val()) === '' || $.trim($('#initStudyMonth').val()) === '' || $.trim($('#initStudyYear').val())==='')  
	{
		return callback(false,"Preencha o campo data inicial corretamente dd-MM-YYYY");
	}	
	
	
	return callback(true,"");
}

function validateFieldsWork(callback){
	
	if ($('#department').val() === "No Selection"  || $.trim($('#department').val()) == ''){
		return callback(false,"Selecione o departamento no qual exerce a atividade voluntária");
	}
	if ($('#section').val() === "No Selection" || $.trim($('#section').val()) == ''){
		return callback(false,"Selecione a seção ou grupo no qual exerce a atividade voluntária");
	}
	if ($('#function').val() === "No Selection" || $.trim($('#function').val()) == ''){
		return callback(false,"Selecione a função na seção ou grupo no qual exerce a atividade voluntária");
	}
	
	if ($('#section').val()!="Diretoria" 
		&& $('#section').val()!="Conselho Fiscal" 
		 && $('#section').val()!="Secretaria"
		  && $('#section').val()!="Coordenação" 
		   && $('#section').val()!="Eventos" 
			 && $('#section').val()!="Manutenção" 
			   && $('#section').val()!="TI" 
				 && $('#section').val()!="Colaboração"){
		if ($('#weekDayWork').val() === "No Selection"){
			return callback(false,"Selecione o dia da semana da atividade voluntária");
		}
		if ($('#periodWork').val() === "No Selection"){
			return callback(false,"Selecione o período da Atividade voluntária");
		}
	}

	if ($.trim($('#initWorkDay').val()) === '' || $.trim($('#initWorkMonth').val()) === '' || $.trim($('#initWorkYear').val())==='')  
	{
		return callback(false,"Preencha o campo data inicial da atividade vonluntária corretamente dd-MM-YYYY");
	}	
	
	
	return callback(true,"");
}


function populateWorkData(work){
	   
	$('#department').val(work.department);
	handleDepartmentChange();
	$('#section').val(work.section);
	handleSectionChange();
	$('#function').val(work["function"]);
	if (typeof(work.weekDay)!='undefined' && work.weekDay!=''){
		$('#weekDayWork').val(work.weekDay);
		$('#periodWork').val(work.period);
	}
	var initDate =  work.initDate.split("-");
	$('#initWorkDay').val(initDate[0]);
	$('#initWorkMonth').val(initDate[1]);
	$('#initWorkYear').val(initDate[2]);
	var finalDate =  work.finalDate.split("-");
	if (finalDate.length > 0){
		$('#finalWorkDay').val(finalDate[0]);
		$('#finalWorkMonth').val(finalDate[1]);
		$('#finalWorkYear').val(finalDate[2]);
	}
	if (typeof(work.classNumber)!='undefined'){
		$('#classWorkLabel').css("display","block");
		$('#classWork').css("display","block");
		$('#classWork').val(work.classNumber);
	}
	else{
		$('#classWorkLabel').css("display","none");
		$('#classWork').css("display","none");
	}
	$('#notes').val(work.notes);	
}


function buildWorkRowTable(data){
	 
    var table = document.getElementById("tableResultWork");

    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    row.insertCell(0).innerHTML= '<input type="radio" name="groupWork" onchange="handleChangeRadioButtonWork();">';
    row.insertCell(1).innerHTML= data.department;
    row.insertCell(2).innerHTML= data.section;
    row.insertCell(3).innerHTML= data["function"];
    if (typeof(data.weekDay)!='undefined'){
    	row.insertCell(4).innerHTML= data.weekDay;
    }
    else{
    	row.insertCell(4).innerHTML= "";
    }
    if (typeof(data.weekDay)!='undefined'){
    	row.insertCell(5).innerHTML= data.period;
    }
    else{
    	row.insertCell(5).innerHTML= "";
    }    
    row.insertCell(6).innerHTML= data.initDate;
    row.insertCell(7).innerHTML= data.finalDate;
    row.insertCell(8).innerHTML= data.notes;  
}


function handleChangeRadioButtonWork(){
	
	var radios = document.getElementsByName("groupWork");
	var table = document.getElementById("tableResultWork");
	var row;
    for (var i = 0, len = radios.length; i < len; i++) {
         if (radios[i].checked) {
        	 row = table.rows[i+2];         	 
        	 break;
         }
    }

    var work = {};
    work["department"] = row.cells[1].innerHTML;
    work["section"] = row.cells[2].innerHTML;
    work["function"] = row.cells[3].innerHTML;
    work["weekDay"] = row.cells[4].innerHTML;
    work["period"] = row.cells[5].innerHTML; 
    work["initDate"] = row.cells[6].innerHTML;
    work["finalDate"] = row.cells[7].innerHTML;
    work["notes"] = row.cells[8].innerHTML;
    
    console.log(JSON.stringify(work));
    populateWorkData(work);
}

function enableDisableActions(access){
	switch(access){
	case 0:
		$('#create').prop("disabled",true).css('opacity',0.5);
		$('#update').prop("disabled",true).css('opacity',0.5);
		$('#resetPassword').prop("disabled",true).css('opacity',0.5);
		$('#cleanFields').prop("disabled",true).css('opacity',0.5);
		$('#insertWork').prop("disabled",true).css('opacity',0.5);
		$('#updateWork').prop("disabled",true).css('opacity',0.5);
		$('#deleteWork').prop("disabled",true).css('opacity',0.5);
		$('#insertStudy').prop("disabled",true).css('opacity',0.5);
		$('#updateStudy').prop("disabled",true).css('opacity',0.5);
		$('#deleteStudy').prop("disabled",true).css('opacity',0.5);
		$('#insertAssociation').prop("disabled",true).css('opacity',0.5);
		$('#updateAssociation').prop("disabled",true).css('opacity',0.5);
		$('#deleteAssociation').prop("disabled",true).css('opacity',0.5);
		$('#searchParent').prop("disabled",true).css('opacity',0.5);
		break;
	case 1:
		$('#create').prop("disabled",false).css('opacity',1.0);
		$('#update').prop("disabled",false).css('opacity',1.0);
		$('#resetPassword').prop("disabled",false).css('opacity',1.0);
		$('#cleanFields').prop("disabled",false).css('opacity',1.0);
		$('#insertWork').prop("disabled",true).css('opacity',0.5);
		$('#updateWork').prop("disabled",true).css('opacity',0.5);
		$('#deleteWork').prop("disabled",true).css('opacity',0.5);
		$('#insertStudy').prop("disabled",true).css('opacity',0.5);
		$('#updateStudy').prop("disabled",true).css('opacity',0.5);
		$('#deleteStudy').prop("disabled",true).css('opacity',0.5);
		$('#insertAssociation').prop("disabled",true).css('opacity',0.5);
		$('#updateAssociation').prop("disabled",true).css('opacity',0.5);
		$('#deleteAssociation').prop("disabled",true).css('opacity',0.5);
		$('#searchParent').prop("disabled",false).css('opacity',1.0);		
		break;		
	case 2:
		$('#create').prop("disabled",false).css('opacity',1.0);
		$('#update').prop("disabled",false).css('opacity',1.0);
		$('#resetPassword').prop("disabled",false).css('opacity',1.0);
		$('#cleanFields').prop("disabled",false).css('opacity',1.0);
		$('#insertWork').prop("disabled",false).css('opacity',1.0);
		$('#updateWork').prop("disabled",false).css('opacity',1.0);
		$('#deleteWork').prop("disabled",false).css('opacity',1.0);
		$('#insertStudy').prop("disabled",false).css('opacity',1.0);
		$('#updateStudy').prop("disabled",false).css('opacity',1.0);
		$('#deleteStudy').prop("disabled",false).css('opacity',1.0);
		$('#insertAssociation').prop("disabled",false).css('opacity',1.0);
		$('#updateAssociation').prop("disabled",false).css('opacity',1.0);
		$('#deleteAssociation').prop("disabled",false).css('opacity',1.0);
		$('#searchParent').prop("disabled",false).css('opacity',1.0);
		break;	
	}
}

function enableDisableFields(access){
	switch(access){
	case 0:
		$('#fullNameInput').prop("disabled",true);
		$('#rg').prop("disabled",true);
		$('#rgExp').prop("disabled",true);
		$('#rgState').prop("disabled",true).css('opacity',0.5);
		$('#cpfInput').prop("disabled",true);
		$('#day').prop("disabled",true);
		$('#month').prop("disabled",true);
		$('#year').prop("disabled",true);
		$('#address').prop("disabled",true);
		$('#number').prop("disabled",true);
		$('#complement').prop("disabled",true);
		$('#neighborhood').prop("disabled",true);
		$('#city').prop("disabled",true);
		$('#state').prop("disabled",true).css('opacity',0.5);
		$('#postCode-1').prop("disabled",true);
		$('#postCode-2').prop("disabled",true);
		$('#parentCpf').prop("disabled",true);
		$('#parentName').prop("disabled",true);
		$('#ddd1').prop("disabled",true);
		$('#phone1').prop("disabled",true);
		$('#whatsup1').prop("disabled",true).css('opacity',0.5);
		$('#ddd2').prop("disabled",true);
		$('#phone2').prop("disabled",true);
		$('#whatsup2').prop("disabled",true).css('opacity',0.5);
		$('#email1').prop("disabled",true);
		$('#email2').prop("disabled",true);
		$('#habilities').prop("disabled",true);
		$('#notesHabilities').prop("disabled",true);
		$('#associationType').prop("disabled",true).css('opacity',0.5);
		$('#initAssociationDay').prop("disabled",true);
		$('#initAssociationMonth').prop("disabled",true);
		$('#initAssociationYear').prop("disabled",true);
		$('#exitAssociationDay').prop("disabled",true);
		$('#exitAssociationMonth').prop("disabled",true);
		$('#exitAssociationYear').prop("disabled",true);
		$('#contribution').prop("disabled",true);
		$('#notesAssociation').prop("disabled",true);
		$('#studyType').prop("disabled",true).css('opacity',0.5);
		$('#weekDayStudy').prop("disabled",true).css('opacity',0.5);
		$('#periodStudy').prop("disabled",true).css('opacity',0.5);
		$('#initStudyDay').prop("disabled",true);
		$('#initStudyMonth').prop("disabled",true);
		$('#initStudyYear').prop("disabled",true);
		$('#finalStudyDay').prop("disabled",true);
		$('#finalStudyMonth').prop("disabled",true);
		$('#finalStudyYear').prop("disabled",true);
		$('#classStudy').prop("disabled",true);
		$('#notesStudy').prop("disabled",true);
		$('#department').prop("disabled",true).css('opacity',0.5);
		$('#section').prop("disabled",true).css('opacity',0.5);
		$('#function').prop("disabled",true).css('opacity',0.5);
		$('#weekDayWork').prop("disabled",true).css('opacity',0.5);
		$('#periodWork').prop("disabled",true).css('opacity',0.5);
		$('#initWorkDay').prop("disabled",true);
		$('#initWorkMonth').prop("disabled",true);
		$('#initWorkYear').prop("disabled",true);
		$('#finalWorkDay').prop("disabled",true);
		$('#finalWorkMonth').prop("disabled",true);
		$('#finalWorkYear').prop("disabled",true);
		$('#classWork').prop("disabled",true).css('opacity',1.0);
		$('#notesWork').prop("disabled",true);		
		break;
		
	case 1:
		
		break;		
	case 2:
		$('#fullNameInput').prop("disabled",false);
		$('#rg').prop("disabled",false);
		$('#rgExp').prop("disabled",false);
		$('#rgState').prop("disabled",false).css('opacity',1.0);
		$('#cpfInput').prop("disabled",false);
		$('#day').prop("disabled",false);
		$('#month').prop("disabled",false);
		$('#year').prop("disabled",false);
		$('#address').prop("disabled",false);
		$('#number').prop("disabled",false);
		$('#complement').prop("disabled",false);
		$('#neighborhood').prop("disabled",false);
		$('#city').prop("disabled",false);
		$('#state').prop("disabled",false).css('opacity',1.0);
		$('#postCode-1').prop("disabled",false);
		$('#postCode-2').prop("disabled",false);
		$('#parentCpf').prop("disabled",false);
		$('#parentName').prop("disabled",false);
		$('#ddd1').prop("disabled",false);
		$('#phone1').prop("disabled",false);
		$('#whatsup1').prop("disabled",false).css('opacity',1.0);
		$('#ddd2').prop("disabled",false);
		$('#phone2').prop("disabled",false).css('opacity',1.0);
		$('#whatsup2').prop("disabled",false);
		$('#email1').prop("disabled",false);
		$('#email2').prop("disabled",false);
		$('#habilities').prop("disabled",false);
		$('#notesHabilities').prop("disabled",false);
		$('#associationType').prop("disabled",false).css('opacity',1.0);
		$('#initAssociationDay').prop("disabled",false);
		$('#initAssociationMonth').prop("disabled",false);
		$('#initAssociationYear').prop("disabled",false);
		$('#exitAssociationDay').prop("disabled",false);
		$('#exitAssociationMonth').prop("disabled",false);
		$('#exitAssociationYear').prop("disabled",false);
		$('#contribution').prop("disabled",false);
		$('#notesAssociation').prop("disabled",false);
		$('#studyType').prop("disabled",false).css('opacity',1.0);
		$('#weekDayStudy').prop("disabled",false).css('opacity',1.0);
		$('#periodStudy').prop("disabled",false).css('opacity',1.0);
		$('#initStudyDay').prop("disabled",false);
		$('#initStudyMonth').prop("disabled",false);
		$('#initStudyYear').prop("disabled",false);
		$('#finalStudyDay').prop("disabled",false);
		$('#finalStudyMonth').prop("disabled",false);
		$('#finalStudyYear').prop("disabled",false);
		$('#classStudy').prop("disabled",false);
		$('#notesStudy').prop("disabled",false);
		$('#department').prop("disabled",false).css('opacity',1.0);
		$('#section').prop("disabled",false).css('opacity',1.0);
		$('#function').prop("disabled",false).css('opacity',1.0);
		$('#weekDayWork').prop("disabled",false).css('opacity',1.0);
		$('#periodWork').prop("disabled",false).css('opacity',1.0);
		$('#initWorkDay').prop("disabled",false);
		$('#initWorkMonth').prop("disabled",false);
		$('#initWorkYear').prop("disabled",false);
		$('#finalWorkDay').prop("disabled",false);
		$('#finalWorkMonth').prop("disabled",false);
		$('#finalWorkYear').prop("disabled",false);
		$('#classWork').prop("disabled",false).css('opacity',1.0);
		$('#notesWork').prop("disabled",true);		
		break;
	}
}
/**
 * This function purpose is to return level access on fields
 * @param callback 
 * @returns 
 * This function will return 3 access Levels
 * 0 - Read Access
 * 1 - Write Partial (It is not allowed to change Work neither association)
 * 2 - Write Full (It is to change all Fields
 */
function checkUserAccess(callback){
	
	//Needs to improve to match coordinators, Look comment searchCache.docs[cachedPosition]
	
	$.ajax({
  		url: '/services/ceai/checkUserAccess',
        type: 'GET',
        contentType: "text/plain",
        success: function(data, textStatus, jqXHR){
        	//If is the own user, enable changes
        	console.log("Data from checkUserAccess "+JSON.stringify(data));
        	if (data.username === searchCache.docs[cachedPosition].email1){
        		console.log("Level access : Writer (it is own user data)");
        		var higherRole = data.role[0]['function'];
        		for(var i=1;i<data.role.length;++i){
        			if (accessClassification[higherRole]<accessClassification[data.role[i]['function']]){
        				higherRole = data.role[i]['function'];
        			}
        		}        		
        		/*
        		var higherRole = '';
        		for(var i=0;i<data.role.length;++i){
	        		if ((data.role[i]['function']=='Worker' || data.role[i]['function']=='User') && higherRole==''){
	        			higherRole = data.role[i]['function'];
	        		}
	        		else{
	        			if (data.role[i]['function']=='Diretor' && higherRole=='Coordenador'){
	        				higherRole = data.role[i]['function'];
	        			}
	        			if (data.role[i]['function']=='Coordenador' && (higherRole=='Worker' || higherRole=='User')){
	        				higherRole = data.role[i]['function'];
	        			}	  
	        			if (data.role[i]['function']=='Diretor' && (higherRole=='Worker' || higherRole=='User')){
	        				higherRole = data.role[i]['function'];
	        			}
	        		}
        		}
        		*/
        		console.log('Role: '+higherRole);
        		if (higherRole == 'Worker' || higherRole=='User'){
        			return callback(1);
        		}
        		else{        			
        			return callback(2);
        		}
        	}
        	else{
        		//Working with Rules only
        		console.log("Checking access Level, as it is not the owner of data");
        		data = data.role;
	        	var i=0;
	        	for(;i<data.length;++i){
	        		if (data[i]['function']=='Worker' || data[i]['function']=='User'){
	        			console.log("Level access : "+data[i]['function']);
	        			return callback(0);
	        		}
	        	}
	        	if (i == data.length){
	        		console.log("User it is not a regular worker neither regular user");	        		
	        		var isWriter = false;
	        		var i=0;
	        		for(;i<data.length && isWriter == false ;++i){
	        			console.log("Checking user function "+data[i]['function']);	        			
	        			switch(data[i]['function']){
	        				case 'Diretor':
	        					if (data[i].department != "Administração"){
		        					var studyUser = searchCache.docs[cachedPosition].study;	        		       		
		    		        		for (var j=0;j<studyUser.length;++j){
		    		        			if (studyUser[j].department == data[i].department){
		    		        				console.log("Level Access: is not director of user department - Reader");
		    		        				isWriter = true;
		    		        			}
		    		        		}	        					
	        					}
	        					else{
	        						console.log("Level Access: is administrative director - Writer");
	        						isWriter = true;
	        					}
	    		        		break;
	        				case 'Coordenador':
	        					if (data[i]['section']=='Coordenação'){
	        						var studyUser = searchCache.docs[cachedPosition].study;	        		       		
	        						var j=0;
	        						for (;j<studyUser.length;++j){
		    		        			if (studyUser[j].department == data[i].department){
		    		        				console.log("Is coordinator of participants department - Writer");
		    		        				isWriter = true;
		    		        				break;
		    		        			}
		    		        		}
	        						if (j==studyUser.length){
	        							console.log("Is not coordinator of participants department - Reader");
	        							isWriter = false;
	        						}
	        					}
	        					else{
	        						var studyUser = searchCache.docs[cachedPosition].study;	        		       		
	        						var j=0;
	        						for (;j<studyUser.length;++j){
		    		        			if (studyUser[j].department == data[i].department && studyUser[j].studyType == data[i].section && studyUser[j].weekDay == data[i].weekDay && studyUser[j].period == data[i].period){
		    		        				console.log("Is coordinator of participants study - Writer");
		    		        				isWriter = true;
		    		        				break;
		    		        			}
		    		        		}
	        						if (j==studyUser.length){
			    		        		console.log("Is not coordinator of participants group - Reader");
			    		        		isWriter = false;
	        						}
	        					}
	        					break;
	        				default:
	        					console.log("It is a worker with no access writer to user");
	        					isWriter = false; 
	        			}
	        		}
	        		if (isWriter){
	        			return callback(2);
	        		}
	        		else{
	        			return callback(0);
	        		}	        		
	        	}
        	}
        },
        error: function(jqXHR, textStatus, errorThrown){
        	console.log("Check Access Failed "+errorThrown);
        }
      });	
}

function validateFieldsForGeneral(callback){
	if ($.trim($('#fullNameInput').val()) === ''){
		return callback(false,"Insira o nome completo do participante");
	}  
	
	var res = $.trim($('#fullNameInput')).split(" ");
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
	
	if (($.trim($('#rg').val()) === '' || $.trim($('#rgExp').val()) === '' || rg_state.selectedIndex === 0) && $.trim($('#cpfInput').val()) === '' && $.trim($('#parentCpf').val()) === ''){
		return callback(false,"Se for maior de idade coloque CPF ou RG (Numero, Orgão Expeditor, Estado do RG), se for menor colocar o CPF do pai ou da mãe e o nome, pode-se usar o botão pesquisar para prenchar automaticamente");
	}
	
	return callback(true,"");
}

function validateFieldsContact(callback){
	if ($.trim($('#email1').val()) === '')  
	{
		return callback(false,"Pelo menos o campo telefone 1 e o email 1 precisa ser preenchido");
	}	
	if ($.trim($('#phone1').val()) === '')  
	{
		return callback(false,"Pelo menos o campo telefone 1 e o email 1 precisa ser preenchido");
	}	
	var whatsup1 = document.getElementById("whatsup1");
	
	if (whatsup1.selectedIndex === 0 || whatsup1.selectedIndex === -1 || $.trim($('#whatsup1').val()) === ''){

		return callback(false,"Selecione se o telefone 1 tem whatsup ou não");
	}

	return callback(true,"");
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
	response.firstName = res[0];
	response.lastName = res[res.length-1];
	var middleName = "";
	for (var i=1; i<res.length-1;++i){
		middleName += " "+res[i];
	}
	response.middleName = middleName;
	return callback(response);
}

function getCustomerID(){
	var currentdate = new Date(); 
	
	var min=1000; 
    var max=9999;  
    var padding = Math.floor(Math.random() * (+max - +min) + +min); 
	
	return  currentdate.getFullYear() 
					+ "-" + (currentdate.getMonth()+1) 
					+ "-" + currentdate.getDate()					 
					+ "-" + currentdate.getHours()  
	                + "-" + currentdate.getMinutes() 
	                + "-" + currentdate.getSeconds()
	                + "-" + padding;
}

function handleChangeRadioButtonAssociation(){
	
	var radios = document.getElementsByName("groupAssociation");
	var table = document.getElementById("tableResultAssociation");
	var row;
    for (var i = 0, len = radios.length; i < len; i++) {
         if (radios[i].checked) {
        	 row = table.rows[i+2];         	 
        	 break;
         }
    }
    console.log(row.cells[1]);
    var association = {};
    association["associationType"] = row.cells[1].innerHTML;
    association["proposeDate"] = row.cells[2].innerHTML;
    association["exitDate"] = row.cells[3].innerHTML;
    association["contribution"] = row.cells[4].innerHTML;
    association["notes"] = row.cells[5].innerHTML;
    
    console.log(JSON.stringify(association));
    populateAssociationData(association);
}

function buildAssociationRowTable(data){
	 
    var table = document.getElementById("tableResultAssociation");

    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    row.insertCell(0).innerHTML= '<input type="radio" name="groupAssociation" onchange="handleChangeRadioButtonAssociation();">';
    row.insertCell(1).innerHTML= data.associationGroup;
    row.insertCell(2).innerHTML= data.associationType;
    row.insertCell(3).innerHTML= data.associationStatus;
    row.insertCell(4).innerHTML= data.initDate;
    row.insertCell(5).innerHTML= data.exitDate;
    row.insertCell(6).innerHTML= data.contribution;
    row.insertCell(7).innerHTML= data.notes;  
}

function validateAssociationSave(callback){

	var table = document.getElementById("tableResultAssociation");
	if (table.rows.length<=2){
		return callback(false,"É necessario que seja cadastrada pelo menos uma associação ao CEIA (Participante, Assistivo, Sócio Efetivo, Sócio Colaborador ou Inativo");
    }
 	
	return callback(true,"");
}

function validateFieldsForAssociation(callback){
	
	var associationGroup = $('#associationGroup').val();
	if (associationGroup == "No Selection"){
		return callback(false,"Insira um Grupo de associação ao CEAI");
	}

	var associationType = $('#associationType').val();
	if (associationType == "No Selection"){
		return callback(false,"Insira um tipo de associação ao CEAI");
	}
	
	var associationStatus = $('#associationStatus').val();
	if (associationStatus == "No Selection"){
		return callback(false,"Insira um status de associação ao CEAI");
	}
	
	if ($.trim($('#initAssociationDay').val()) === '' || $.trim($('#initAssociationMonth').val()) === '' || $.trim($('#initAssociationYear').val())==='')  
	{
		return callback(false,"Preencha o campo de início da associação corretamente no formato dia/mes/ano");
	}
	
	if (associationType == "Efetivo" || associationType == "Colaborador" ){
		if ($('#contribution').val() == ""){
			return callback(false,"Insira por favor o valor de sua contribuicão mensal");
		}	
	}
	
	return callback(true,"");
}

function updateAssociation(){
	var $output = $('.outputAssociation'),
	$process = $('.processingAssociation');	
	validateFieldsForAssociation(function(valid,response){
		if (valid === false){
			if (response !== "")
				alert(response);
			else
				alert('Preencha todos os campos !');
			return;
		}
		else
		{
			$process.show();
			$output.hide();
			var radios = document.getElementsByName("groupAssociation");
			var table = document.getElementById("tableResultAssociation");
			var row;
			var index=-1;
		    for (var i = 0, len = radios.length; i < len; i++) {
		         if (radios[i].checked) {
		        	 row = table.rows[i+2];         	 
		        	 index = i;
		        	 break;
		         }
		    }
		    if (index != -1){
			    var associationItem = association[index];
				var associationType = document.getElementById("associationType");
				
			    row.cells[1].innerHTML = document.getElementById("associationGroup").value;
			    associationItem["associationGroup"] = document.getElementById("associationGroup").value;
			    
			    row.cells[2].innerHTML = document.getElementById("associationType").value;
			    associationItem["associationType"] = document.getElementById("associationType").value;
			    
			    row.cells[3].innerHTML = document.getElementById("associationStatus").value;
			    associationItem["associationStatus"] = document.getElementById("associationStatus").value;
			    
			    row.cells[4].innerHTML = $.trim($('#initAssociationDay').val()) + '-' + $.trim($('#initAssociationMonth').val()) + '-' + $.trim($('#initAssociationYear').val());
			    associationItem["initDate"] = $.trim($('#initAssociationDay').val()) + '-' + $.trim($('#initAssociationMonth').val()) + '-' + $.trim($('#initAssociationYear').val());
			    if ($.trim($('#exitAssociationDay').val())!=='' && $.trim($('#exitAssociationMonth').val()) !=='' && $.trim($('#exitAssociationYear').val()) !==''){
			    	row.cells[5].innerHTML = $.trim($('#exitAssociationDay').val()) + '-' + $.trim($('#exitAssociationMonth').val()) + '-' + $.trim($('#exitAssociationYear').val());
			    	associationItem["exitDate"] = $.trim($('#exitAssociationDay').val()) + '-' + $.trim($('#exitAssociationMonth').val()) + '-' + $.trim($('#exitAssociationYear').val());
			    }
			    else{
			    	row.cells[5].innerHTML = '';
			    	associationItem["exitDate"] = '';
			    }
			    row.cells[6].innerHTML = $.trim($('#contribution').val());
			    associationItem["contribution"] = $.trim($('#contribution').val());
			    row.cells[7].innerHTML = $.trim($('#notes').val());
			    associationItem["notes"] = $('#notesAssociation').val();
			    association[index] = associationItem;
		    }
			$process.hide();
			$output.show();
		}	
	}); 	
}

function insertAssociation(){
	var $output = $('.outputAssociation'),
	$process = $('.processingAssociation');		
	validateFieldsForAssociation(function(valid,response){
		if (valid === false){
			if (response !== "")
				alert(response);
			else
				alert('Preencha todos os campos !');
			return;
		}
		else
		{
			$process.show();
			$output.hide();
			var associationItem = {};
			associationItem["associationGroup"] = document.getElementById("associationGroup").value;
			associationItem["associationType"] = document.getElementById("associationType").value;
			associationItem["associationStatus"] = document.getElementById("associationStatus").value;
			associationItem["initDate"] = $.trim($('#initAssociationDay').val()) + '-' + $.trim($('#initAssociationMonth').val()) + '-' + $.trim($('#initAssociationYear').val());
		    if ($.trim($('#exitAssociationDay').val())!==''){
		    	associationItem["exitDate"] = $.trim($('#exitAssociationDay').val()) + '-' + $.trim($('#exitAssociationMonth').val()) + '-' + $.trim($('#exitAssociationYear').val());
		    }
		    else{
		    	associationItem["exitDate"] = "";
		    }
		    associationItem["contribution"] = $.trim($('#contribution').val());
		    associationItem["notes"] = $('#notesAssociation').val();
		    association.push(associationItem);
		    buildAssociationRowTable(associationItem);
			var radios = document.getElementsByName("groupAssociation");
			radios[radios.length-1].checked = "true";
			$process.hide();
			$output.show();
		}	
	});	
}

function cleanUpAssociationFields(){
	document.getElementById("associationGroup").selectedIndex = 0;
	document.getElementById("associationType").selectedIndex = 0;
	document.getElementById("associationStatus").selectedIndex = 0;
	$('#initAssociationDay').val('');
	$('#initAssociationMonth').val('');
	$('#initAssociationYear').val('');
    $('#exitAssociationDay').val('');
    $('#exitAssociationMonth').val('');
    $('#exitAssociationYear').val('')
    $('#contribution').val('');
    $('#notesAssociation').val('');
}

function clearComboOptions(sel){
	while (sel.options.length > 0) {                
		sel.remove(0);
    }   
}

function cleanUpWorkFields(){
	
	var department = document.getElementById("department");
	var section = document.getElementById("section");
	var funct = document.getElementById("function");
	var weekDay = document.getElementById("weekDayWork");
	var period = document.getElementById("periodWork");
	department.selectedIndex = 0;
	section.selectedIndex = 0;
	funct.selectedIndex = 0;
	weekDay.selectedIndex = 0;
	period.selectedIndex = 0;
	$('#initWorkDay').val('');
	$('#initWorkMonth').val('');
	$('#initWorkYear').val('');
    $('#finalWorkDay').val('');
    $('#finalWorkMonth').val('');
    $('#finalWorkYear').val('');
    $('#notesWork').val('');
}

function cleanUpStudyFields(){
	
	var workType = document.getElementById("studyType");
	var weekDay = document.getElementById("weekDayStudy");
	var period = document.getElementById("periodStudy");
	workType.selectedIndex = 0;
	weekDay.selectedIndex = 0;
	period.selectedIndex = 0;
	$('#initStudyDay').val('');
	$('#initStudyMonth').val('');
	$('#initStudyYear').val('');
    $('#finalStudyDay').val('');
    $('#finalStudyMonth').val('');
    $('#finalStudyYear').val('');
    $('#notesStudy').val('');
}

function cleanUpContactFields(){
	$('#ddd1').val('');
	$('#phone1').val('');
	$('#whatsup1').val("No Selection");
	$('#ddd2').val('');
	$('#phone2').val('');
	$('#whatsup2').val("No Selection");
	$('#email1').val('');
	$('#email2').val('');
}

function cleanUpHabilitiesFields(){
	$('#habilities').val('');
	$('#habilitiesNotes').val('');
}

function cleanUpGeneralFields(){
	$('#userID').val('');
	$('#fullNameInput').val('');
	$('#rg').val('');
	$('#rgExp').val('');
	$('#rgState').val('');
	$('#cpfInput').val('');
	$('#day').val('');
	$('#month').val('');
	$('#year').val('');
	$('#address').val('');
	$('#number').val('');
	$('#complement').val('');
	$('#neighborhood').val('');
	$('#city').val('');
	$('#state').val('');
	$('#postCode-1').val('');
	$('#postCode-2').val('');
}

function removeAssociation(){
	
	var $output = $('.outputAssociation'),
	$process = $('.processingAssociation');	
	
	$process.show();
	$output.hide();
	
	var radios = document.getElementsByName("groupAssociation");
	var table = document.getElementById("tableResultAssociation");
	var rowIndex=-1;
    for (var i = 0, len = radios.length; i < len; i++) {
         if (radios[i].checked) {
        	 rowIndex = i+2;
         }
    }
    
    if (rowIndex != -1){
    
	    table.deleteRow(rowIndex);
	    association.splice(rowIndex-2, 1);
	    
	    if (table.rows.length > 2){
	    	radios[0].checked = "true";
	    }	

    }
    $process.hide();
	$output.show();
}

function cleanupAllFields(){
	cleanUpGeneralFields();
	cleanUpAssociationFields();
	cleanUpWorkFields();
	cleanUpStudyFields();
	cleanUpContactFields();
	cleanUpHabilitiesFields();
	cleanSearchOutput(document.getElementById("tableResultAssociation"));
	cleanSearchOutput(document.getElementById("tableResultWork"));
	cleanSearchOutput(document.getElementById("tableResultStudy"));
	cleanSearchOutput(document.getElementById("tableResultPayment"));
}

function removeWork(){
	
	var $output = $('.outputWork'),
	$process = $('.processingWork');
	
	$process.show();
	$output.hide();
	
	var radios = document.getElementsByName("groupWork");
	var table = document.getElementById("tableResultWork");
	var rowIndex=-1;
    for (var i = 0, len = radios.length; i < len; i++) {
         if (radios[i].checked) {
        	 rowIndex = i+2;
         }
    }
    
    console.log('Work before remove'+JSON.stringify(work));
    
    if (rowIndex != -1){
	    table.deleteRow(rowIndex);
	    work.splice(rowIndex-2, 1);
	           
	    if (table.rows.length > 2){
	    	radios[0].checked = "true";
	    	populateWorkData(work[0]);
	    }

    }
    
    console.log('Work to be updated when save'+JSON.stringify(work));
    $process.hide();
	$output.show()
}



function updateWork(){
	//alert('Insert Button'); 
	var $output = $('.outputWork'),
	$process = $('.processingWork');	
	validateFieldsWork(function(valid,response){
		if (valid === false){
			if (response !== "")
				alert(response);
			else
				alert('Preencha todos os campos !');
			return;
		}
		else
		{
			$process.show();
			$output.hide();
			var radios = document.getElementsByName("groupWork");
			var table = document.getElementById("tableResultWork");
			var row;
			var index=-1;
		    for (var i = 0, len = radios.length; i < len; i++) {
		         if (radios[i].checked) {
		        	 row = table.rows[i+2];         	 
		        	 index = i;
		        	 break;
		         }
		    }
		    if (index != -1){
			    var department = document.getElementById("department");
			    var section = document.getElementById("section");
			    var funct = document.getElementById("function");
				var weekDay = document.getElementById("weekDayWork");
				var period = document.getElementById("periodWork");
				var workItem = {};			
				row.cells[1].innerHTML = department.options[department.selectedIndex].value;
				workItem.department = department.options[department.selectedIndex].value;
				row.cells[2].innerHTML = section.options[section.selectedIndex].value;
				workItem.section = section.options[section.selectedIndex].value;
				row.cells[3].innerHTML = funct.options[funct.selectedIndex].value;
				workItem["function"] = funct.options[funct.selectedIndex].value;
			    if ($('#section').val()!="Diretoria" 
					&& $('#section').val()!="Conselho Fiscal" 
					 && $('#section').val()!="Secretaria"
					  && $('#section').val()!="Coordenação" 
					   && $('#section').val()!="Eventos" 
						 && $('#section').val()!="Manutenção" 
						   && $('#section').val()!="TI" 
							 && $('#section').val()!="Colaboração"){
			    	 row.cells[4].innerHTML = weekDay.options[weekDay.selectedIndex].value;
					 workItem.weekDay = weekDay.options[weekDay.selectedIndex].value
					 row.cells[5].innerHTML = period.options[period.selectedIndex].value;
					 workItem.period = period.options[period.selectedIndex].value;
				}
			    row.cells[6].innerHTML = $.trim($('#initWorkDay').val()) + '-' + $.trim($('#initWorkMonth').val()) + '-' + $.trim($('#initWorkYear').val());
			    workItem.initDate = $.trim($('#initWorkDay').val()) + '-' + $.trim($('#initWorkMonth').val()) + '-' + $.trim($('#initWorkYear').val());
			    if ($.trim($('#finalWorkDay').val())!=='' && $.trim($('#finalWorkMonth').val()) !=='' && $.trim($('#finalWorkYear').val()) !=='' ){
			    	row.cells[7].innerHTML = $.trim($('#finalWorkDay').val()) + '-' + $.trim($('#finalWorkMonth').val()) + '-' + $.trim($('#finalWorkYear').val());
			    	workItem.finalDate =  $.trim($('#finalWorkDay').val()) + '-' + $.trim($('#finalWorkMonth').val()) + '-' + $.trim($('#finalWorkYear').val());
			    }
			    else{
			    	row.cells[7].innerHTML = '';
			    	workItem.finalDate =  '';
			    }
			    row.cells[8].innerHTML = $.trim($('#notesWork').val());
			    if ($('#classWork').css("display") != "none"){
			    	workItem.classNumber = $('#classWork').val(); 
			    }			    
			    workItem.notes = $.trim($('#notesWork').val());
			    work[index] = workItem;
		    }
			    
		    $process.hide();
			$output.show();	
		}	
	}); 	
}

function insertWork(){
	
	//alert('Insert Button'); 
	var $output = $('.outputWork'),
	$process = $('.processingWork');	
	validateFieldsWork(function(valid,response){
		if (valid === false){
			if (response !== "")
				alert(response);
			else
				alert('Preencha todos os campos !');
			return;
		}
		else
		{
			$process.show();
			$output.hide();
			var department = document.getElementById("department");
			var section = document.getElementById("section");
			var funct = document.getElementById("function");
			var weekDay = document.getElementById("weekDayWork");
			var period = document.getElementById("periodWork");
			var workItem = {};
			workItem.department = department.options[department.selectedIndex].value;
			workItem.section = section.options[section.selectedIndex].value;
			workItem["function"] = funct.options[funct.selectedIndex].value;
			
			if ($('#section').val()!="Diretoria" 
				&& $('#section').val()!="Conselho Fiscal" 
				 && $('#section').val()!="Secretaria"
				  && $('#section').val()!="Coordenação" 
				   && $('#section').val()!="Eventos" 
					 && $('#section').val()!="Manutenção" 
					   && $('#section').val()!="TI" 
						 && $('#section').val()!="Colaboração"){
				workItem.weekDay = weekDay.options[weekDay.selectedIndex].value
				workItem.period = period.options[period.selectedIndex].value;
			}
			
			workItem.initDate = $.trim($('#initWorkDay').val()) + '-' + $.trim($('#initWorkMonth').val()) + '-' + $.trim($('#initWorkYear').val());
		    if ($.trim($('#finalWorkDay').val())!==''){
		    	workItem.finalDate = $.trim($('#finalWorkDay').val()) + '-' + $.trim($('#finalWorkMonth').val()) + '-' + $.trim($('#finalWorkYear').val());
		    }
		    else{
		    	workItem.finalDate = "";
		    }
		    if ($('#classWork').css("display") != "none"){
		    	workItem.classNumber = $('#classWork').val(); 
		    }
		    workItem.notes = $.trim($('#notesWork').val());
			work.push(workItem)
		    buildWorkRowTable(workItem);
			var radios = document.getElementsByName("groupWork");
			radios[radios.length-1].checked = "true";
			$process.hide();
			$output.show();
		}	
	}); 	
	
}

function removeStudy(){
	
	var $output = $('.outputStudy'),
	$process = $('.processingStudy');
	
	$process.show();
	$output.hide();
	
	var radios = document.getElementsByName("groupStudy");
	var table = document.getElementById("tableResultStudy");
	var rowIndex=-1;
    for (var i = 0, len = radios.length; i < len; i++) {
         if (radios[i].checked) {
        	 rowIndex = i+2;
         }
    }
    
    if (rowIndex != -1){
	    table.deleteRow(rowIndex);
	    study.splice(rowIndex-2, 1);
	           
	    if (table.rows.length > 2){
	    	radios[0].checked = "true";
	    	populateStudyData(study[0]);
	    }	
    }
    
    $process.hide();
	$output.show()
}

function updateStudy(){
	//alert('Insert Button'); 
	var $output = $('.outputStudy'),
	$process = $('.processingStudy');	
	validateFieldsStudy(function(valid,response){
		if (valid === false){
			if (response !== "")
				alert(response);
			else
				alert('Preencha todos os campos !');
			return;
		}
		else
		{
			$process.show();
			$output.hide();
			var radios = document.getElementsByName("groupStudy");
			var table = document.getElementById("tableResultStudy");
			var row;
			var index=-1;
		    for (var i = 0, len = radios.length; i < len; i++) {
		         if (radios[i].checked) {
		        	 row = table.rows[i+2]; 
		        	 index = i;
		        	 break;
		         }
		    }
		    if (index != -1){
				var studyType = document.getElementById("studyType");
				var weekDay = document.getElementById("weekDayStudy");
				var period = document.getElementById("periodStudy");
				var studyItem = {};
				var studyDepartment = studySectionDepartment.find(element => element.section == studyType.options[studyType.selectedIndex].value);
				studyItem.department = studyDepartment.department;
			    row.cells[1].innerHTML = studyType.options[studyType.selectedIndex].value;
			    studyItem.studyType = studyType.options[studyType.selectedIndex].value;
			    row.cells[2].innerHTML = weekDay.options[weekDay.selectedIndex].value;
			    studyItem.weekDay = weekDay.options[weekDay.selectedIndex].value;
			    row.cells[3].innerHTML = period.options[period.selectedIndex].value;
			    studyItem.period = period.options[period.selectedIndex].value;
			    row.cells[4].innerHTML = $.trim($('#initStudyDay').val()) + '-' + $.trim($('#initStudyMonth').val()) + '-' + $.trim($('#initStudyYear').val());
			    studyItem.initDate = $.trim($('#initStudyDay').val()) + '-' + $.trim($('#initStudyMonth').val()) + '-' + $.trim($('#initStudyYear').val()); 
			    if ($.trim($('#finalStudyDay').val())!=='' && $.trim($('#finalStudyMonth').val()) !=='' && $.trim($('#finalStudyYear').val()) !=='' ){
			    	row.cells[5].innerHTML = $.trim($('#finalStudyDay').val()) + '-' + $.trim($('#finalStudyMonth').val()) + '-' + $.trim($('#finalStudyYear').val());
			    	studyItem.finalDate = $.trim($('#finalStudyDay').val()) + '-' + $.trim($('#finalStudyMonth').val()) + '-' + $.trim($('#finalStudyYear').val());
			    }
			    else{
			    	row.cells[5].innerHTML = '';
			    	studyItem.finalDate = '';
			    }
			    row.cells[6].innerHTML = $.trim($('#notesStudy').val());
			    if ($('#classStudy').css("display") != "none"){
			    	studyItem.classNumber = $('#classStudy').val(); 
			    }
			    studyItem.notes = $.trim($('#notesStudy').val());
			    study[index] = studyItem;
		    }			
		    
		    $process.hide();
			$output.show();
		}	
	}); 	
}

function insertStudy(){

	var $output = $('.outputStudy'),
	$process = $('.processingStudy');	
	validateFieldsStudy(function(valid,response){
		if (valid === false){
			if (response !== "")
				alert(response);
			else
				alert('Preencha todos os campos !');
			return;
		}
		else
		{
			$process.show();
			$output.hide();
			var studyType = document.getElementById("studyType");
			var weekDay = document.getElementById("weekDayStudy");
			var period = document.getElementById("periodStudy");
			var studyItem = {};			
			var studyDepartment = studySectionDepartment.find(element => element.section == studyType.options[studyType.selectedIndex].value);
			studyItem.department = studyDepartment.department;
			studyItem.studyType = studyType.options[studyType.selectedIndex].value;
			studyItem.weekDay = weekDay.options[weekDay.selectedIndex].value
			studyItem.period = period.options[period.selectedIndex].value;
			studyItem.initDate = $.trim($('#initStudyDay').val()) + '-' + $.trim($('#initStudyMonth').val()) + '-' + $.trim($('#initStudyYear').val());
		    if ($.trim($('#finalStudyDay').val())!==''){
		    	studyItem.finalDate = $.trim($('#finalStudyDay').val()) + '-' + $.trim($('#finalStudyMonth').val()) + '-' + $.trim($('#finalStudyYear').val());
		    }
		    else{
		    	studyItem.finalDate = "";
		    }
		    studyItem.notes = $.trim($('#notesStudy').val());
		    if ($('#classStudy').css("display") != "none"){
		    	studyItem.classNumber = $('#classStudy').val(); 
		    }
			study.push(studyItem);
		    buildStudyRowTable(studyItem);

			var radios = document.getElementsByName("groupStudy");
			radios[radios.length-1].checked = "true";
			
			$process.hide();
			$output.show();
		}	
	}); 	
	
}



function newRecord(){
	$('#create').prop("disabled",false).css('opacity',1.0);
	$('#update').prop("disabled",true).css('opacity',0.5);
	var $userData = $('.userData');
	var $output = $('.outputGeneral');
	var $message = $('.messageSearchPanel')
	cleanupAllFields();
	$userData.show();
	$output.hide();
	$message.hide();	
}

function populateStudyData(study){
	   
	$('#studyType').val(study.studyType);
	$('#weekDayStudy').val(study.weekDay);
	$('#periodStudy').val(study.period);
	var initDate =  study.initDate.split("-");
	$('#initStudyDay').val(initDate[0]);
	$('#initStudyMonth').val(initDate[1]);
	$('#initStudyYear').val(initDate[2]);
	var finalDate =  study.finalDate.split("-");
	$('#finalStudyDay').val(finalDate[0]);
	$('#finalStudyMonth').val(finalDate[1]);
	$('#finalStudyYear').val(finalDate[2]);
	if (typeof(study.classNumber)!='undefined'){
		$('#classStudyLabel').css("display","block");
		$('#classStudy').css("display","block");
		$('#classStudy').val(study.classNumber);
	}
	else{
		$('#classStudyLabel').css("display","none");
		$('#classStudy').css("display","none");
	}
	$('#notesStudy').val(study.notes);	
}

function handleChangeRadioButtonStudy(){
	
	var radios = document.getElementsByName("groupStudy");
	var table = document.getElementById("tableResultStudy");
	var row;
    for (var i = 0, len = radios.length; i < len; i++) {
         if (radios[i].checked) {
        	 row = table.rows[i+2];         	 
        	 break;
         }
    }
    console.log(row.cells[1]);
    var study = {};
    study["studyType"] = row.cells[1].innerHTML;
    study["dayWeek"] = row.cells[2].innerHTML;
    study["period"] = row.cells[3].innerHTML; 
    study["initDate"] = row.cells[4].innerHTML;
    study["finalDate"] = row.cells[5].innerHTML;
    study["notes"] = row.cells[6].innerHTML;
    
    console.log(JSON.stringify(study));
    populateStudyData(study);
}

function buildStudyRowTable(data){
	 
    var table = document.getElementById("tableResultStudy");

    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    row.insertCell(0).innerHTML= '<input type="radio" name="groupStudy" onchange="handleChangeRadioButtonStudy();">';
    row.insertCell(1).innerHTML= data.studyType;
    row.insertCell(2).innerHTML= data.weekDay;
    row.insertCell(3).innerHTML= data.period;
    row.insertCell(4).innerHTML= data.initDate;
    row.insertCell(5).innerHTML= data.finalDate;
    if (typeof(data.notes)!=='undefined'){
    	row.insertCell(6).innerHTML= data.notes;
    }
    else{
    	row.insertCell(6).innerHTML= "";
    }
}

function buildPaymentRowTable(data){
	 
    var table = document.getElementById("tableResultPayment");

    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);

    row.insertCell(0).innerHTML= data.month;
    row.insertCell(1).innerHTML= data.paymentDate;
    row.insertCell(2).innerHTML= data.value;
    row.insertCell(3).innerHTML= data.receptNumber;
    row.insertCell(4).innerHTML= data.paymentType;    
}

function createOrUpdate(type){
	//alert('Insert Button'); 
	var	$process = $('.processingCreateOrUpdate');
	
	validateFieldsForGeneral(function(validGeneral,response){
		if (validGeneral === false){
			if (response !== "")
				alert(response);
			else
				alert('Preencha os campos requiridos para os dados pessoais !');				
		}
		else{
			validateFieldsContact(function(validContact,response){
				
				if (validContact === false){
					if (response !== "")
						alert(response);
					else
						alert('Preencha os campos requiridos para os dados de contato !');				
				}
				else{
					validateAssociationSave(function(validAssociation,response){
						if (validAssociation === false){						
							if (response != "")
								alert(response);
							else
								alert("Preencha pelo menos uma associação ao CEAI");
						}
						else{
							$process.show();
							var state = document.getElementById("state");
							var respNames = "";
							splitFullName($.trim($('#fullNameInput').val()),function(response){
								respNames = response;
								console.log("Full Name to be updated",JSON.stringify(respNames));
							});
							var userId,_id,_rev;
							if (type === "insert"){
								userId = getCustomerID();
								_id = '';
								_rev = '';
							}
							else{
								userId = $.trim($('#userID').val());
								_id = searchCache.docs[cachedPosition]._id;
								_rev = searchCache.docs[cachedPosition]._rev;
							}
							
							var input = '{'
								+'"operation" : "'+type+'",'
								+'"type" : "all",'
								+'"_id" : "'+_id+'",'
								+'"_rev" : "'+_rev+'",'
								+'"userID" : "'+userId+'",'
								+'"firstName" : "'+$.trim(respNames.firstName)+'",'
								+'"middleName" : "'+$.trim(respNames.middleName)+'",'
								+'"lastName" : "'+$.trim(respNames.lastName)+'",'
								+'"cpf" : "'+$.trim($('#cpfInput').val())+'",'
								+'"rg" : "'+$.trim($('#rg').val())+'",'
								+'"rgExp" : "'+$.trim($('#rgExp').val())+'",'
								+'"rgState" : "'+$.trim($('#rgState').val())+'",'
								+'"birthDate" : "'+$.trim($('#day').val())+'-'+$.trim($('#month').val())+'-'+$.trim($('#year').val())+'",'
								+'"address" : "'+$.trim($('#address').val())+'",'
								+'"number" : "'+$.trim($('#number').val())+'",'
								+'"complement" : "'+$.trim($('#complement').val())+'",'
								+'"neighborhood" : "'+$.trim($('#neighborhood').val())+'",'
								+'"city" : "'+$.trim($('#city').val())+'",'
								+'"state" : "'+state.options[state.selectedIndex].value+'",'
								+'"postCode" : "'+$.trim($('#postCode-1').val())+'-'+$.trim($('#postCode-2').val())+'",'
								+'"parentCpf" : "'+$.trim($('#parentCpf').val())+'",'
								+'"parentName" : "'+$.trim($('#parentName').val())+'",'
								+'"lastName" : "'+$.trim(respNames.lastName)+'",'
								+'"phone1" : "'+$.trim($('#ddd1').val())+"-"+$.trim($('#phone1').val())+'",'
								+'"whatsup1" : "'+whatsup1.options[whatsup1.selectedIndex].value+'",'
								+'"phone2" : "'+($.trim($('#phone2').val())!==""? $.trim($('#ddd2').val())+"-"+$.trim($('#phone2').val()):'')+'",'
								+'"whatsup2" : "'+(whatsup2.selectedIndex >=0 ?  whatsup2.options[whatsup2.selectedIndex].value : '')+'",'
								+'"email1" : "'+$.trim($('#email1').val())+'",'
								+'"email2" : "'+$.trim($('#email2').val())+'",'
								+'"association" : '+JSON.stringify(association)+','
								+'"habilities" : "'+$.trim($('#habilities').val())+'",'
								+'"habilitiesNotes" : "'+$.trim($('#notesHabilities').val())+'",'
								+'"study" : '+JSON.stringify(study)+','
								+'"work" : '+JSON.stringify(work)+'}';
											
							console.log(JSON.stringify(input));
			
							$.ajax({
								url: '/services/ceai/register',
								type: 'POST',
								data: input,
								contentType: "application/json",
								success: function(data, textStatus, jqXHR){
										console.log(data);
										$process.hide();
										alert(data);										
								},
								error: function(jqXHR, textStatus, errorThrown){
									console.log('Problemas na atualização de Cadastro, Contate administrador, Erro:',errorThrown);
									$process.hide();
									alert('Problemas na atualização de Cadastro, Contate administrador, Erro:',errorThrown);									
								}
							});
						}
					});
				}
			});
		}
	}); 
}

function enableDisableClassLabel(){
	if ($('#section').val()=="No Selection" || $('#section').val()=="EIDE I" || $('#section').val()=="EIDE II"
		|| $('#section').val()=="ESDE I" 
			|| $('#section').val()=="ESDE II" 
			   || $('#section').val()=="EADE" 
				   || $('#section').val()=="Grupo de Estudo da Codificação Espírita (GECE)"
					   || $('#section').val()=="Estudo das Obras de André Luiz"
						   || $('#section').val()=="Estudo da Série Psic. de Joanna de Ângelis"
							   || $('#section').val()=="Infância 1"
								   || $('#section').val()=="Infância 2"
									   || $('#section').val()=="Primeiro Ciclo"
										   || $('#section').val()=="Segundo Ciclo"
											   || $('#section').val()=="Terceiro Ciclo"
												   || $('#section').val()=="Juventude 1"
													   || $('#section').val()=="Juventude 2"){
		$('#classWorkLabel').css("display","block");
		$('#classWork').css("display","block");
	}
	else{
		$('#classWorkLabel').css("display","none");
		$('#classWork').css("display","none");
	}
}

function enableDisableDayAndPeriod(){
	if ($('#section').val()=="Diretoria" || $('#section').val()=="Conselho Fiscal" || $('#section').val()=="Secretaria"
		|| $('#section').val()=="Coordenação" 
		  || $('#section').val()=="Eventos" 
			|| $('#section').val()=="Manutenção" 
			   || $('#section').val()=="TI" 
				   || $('#section').val()=="Colaboração"){
		$('#weekDayWorkLabel').css("display","none");
		$('#weekDayWork').css("display","none");
		$('#periodWorkLabel').css("display","none");
		$('#periodWork').css("display","none");
	}
	else{
		$('#weekDayWorkLabel').css("display","block");
		$('#weekDayWork').css("display","block");
		$('#periodWorkLabel').css("display","block");
		$('#periodWork').css("display","block");
	}
}

function handleSectionChange(){
	 enableDisableClassLabel();
	 enableDisableDayAndPeriod();
	 if (typeof(currentDepartment)!='undefined'){
		 var valueSection = currentDepartment.sections.map(function(item){return item.section});
		 console.log("value Array of Department:",JSON.stringify(valueSection));
		 var sectionIndex = valueSection.indexOf($('#section').val());
		 var currentSession = currentDepartment.sections[sectionIndex];
		 console.log("Department Selected:",JSON.stringify(currentSession));
	  	 var sel = document.getElementById('function');
	  	 clearComboOptions(sel);
	  	 var fragment = document.createDocumentFragment();
	  	 var opt;
	
	     opt = document.createElement('option');
	     opt.innerHTML = "Selecione";
	     opt.value = "No Selection"; 
	     fragment.appendChild(opt);
	     if (typeof(currentSession)!='undefined'){
		     for(var i=0;i<currentSession.functions.length;++i)
		  	 {    		 
		 	      opt = document.createElement('option');
		  	      opt.innerHTML = currentSession.functions[i];
		  	      opt.value = currentSession.functions[i];
		  	      fragment.appendChild(opt);
		  	 }
	     }
	  	 sel.appendChild(fragment);
	 }
}

function handlePaymentYearLoad(){
	var sel = document.getElementById('paymentYear');
 	 clearComboOptions(sel);
 	 var fragment = document.createDocumentFragment();
 	 var opt;
 	 var baseYear = 2018;
	 var currentYear = (new Date()).getFullYear();
 	 
 	 for(var i=baseYear;i<=currentYear;++i)
 	 {    		 
 	      opt = document.createElement('option');
  	      opt.innerHTML = i
  	      opt.value = i;
  	      fragment.appendChild(opt);
 	 }        	
 	 sel.appendChild(fragment);
}

function handleAssociationGroupChange(){
	 var valueGroup = group.map(function(item){ return item.name});
	 console.log("value Array of Department:",JSON.stringify(valueGroup));
	 var groupIndex = valueGroup.indexOf($('#associationGroup').val());
	 if (groupIndex!=-1){
		 var currentGroup = group[groupIndex];
		 console.log("Group Selected:",JSON.stringify(currentGroup));
	  	 var sel = document.getElementById('associationType');
	  	 clearComboOptions(sel);
	  	 var fragment = document.createDocumentFragment();
	  	 var opt;
	
	     opt = document.createElement('option');
	     opt.innerHTML = "Selecione";
	     opt.value = "No Selection"; 
	     fragment.appendChild(opt);
	     for(var i=0;i<currentGroup.types.length;++i)
	  	 {    		 
	  	      opt = document.createElement('option');
	   	      opt.innerHTML = currentGroup.types[i];
	   	      opt.value = currentGroup.types[i];
	   	      fragment.appendChild(opt);
	  	 }        	
	  	 sel.appendChild(fragment);
	  	 
	  	 sel = document.getElementById('associationStatus');
	  	 clearComboOptions(sel);
	  	 fragment = document.createDocumentFragment();
	
	     opt = document.createElement('option');
	     opt.innerHTML = "Selecione";
	     opt.value = "No Selection"; 
	     fragment.appendChild(opt);
	     for(var i=0;i<currentGroup.status.length;++i)
	  	 {    		 
	  	      opt = document.createElement('option');
	   	      opt.innerHTML = currentGroup.status[i];
	   	      opt.value = currentGroup.status[i];
	   	      fragment.appendChild(opt);
	  	 }        	
	  	 sel.appendChild(fragment);
	 }
}

function handleDepartmentChange(){
	 var valueDepartment = chart.map(function(item){ return item.department});
	 console.log("value Array of Department:",JSON.stringify(valueDepartment));
	 var departmentIndex = valueDepartment.indexOf($('#department').val());
	 if (departmentIndex!=-1){
		 currentDepartment = chart[departmentIndex];
		 console.log("Department Selected:",JSON.stringify(currentDepartment));
	  	 var sel = document.getElementById('section');
	  	 clearComboOptions(sel);
	  	 var fragment = document.createDocumentFragment();
	  	 var opt;
	
	     opt = document.createElement('option');
	     opt.innerHTML = "Selecione";
	     opt.value = "No Selection"; 
	     fragment.appendChild(opt);
	     for(var i=0;i<currentDepartment.sections.length;++i)
	  	 {    		 
	  	      opt = document.createElement('option');
	   	      opt.innerHTML = currentDepartment.sections[i].section;
	   	      opt.value = currentDepartment.sections[i].section;
	   	      fragment.appendChild(opt);
	  	 }        	
	  	 sel.appendChild(fragment);
	 }
}
	 
function search(){
	//alert('Search Button'); 
	var $output = $('.outputGeneral'),
	$message = $('.messageSearchPanel'),
	$process = $('.processingSearch'),	
	$userData = $('.userData'),
	$newRecordButton = $('.newRecord');
	$newRecordButton.hide();
	var validate = validateFieldsSearch();
	if (validate==0){	
		alert('Favor preencher um nome para pesquisar, pode ser o primeiro nome ou nome completo ou coloque o CPF');
		return;
	}	
	$process.show();
	$userData.hide();
	cleanSearchOutput(document.getElementById("tableResult"));
	cleanupAllFields();
  	$output.hide();
  	$message.hide();
  	if (validate == 1){
  	
	  	var respNames = "";		
	  	splitFullName($.trim($('#fullName').val()),function(response){
			respNames = response;
		});
	  	
	  	var inputSearch = '{'
	  		+'"type" : "register",'
	  		+'"firstName" : "'+$.trim(respNames.firstName)+'",'
			+'"middleName" : "'+$.trim(respNames.middleName)+'",'
			+'"lastName" : "'+$.trim(respNames.lastName)+'"}';
	  	  
	  	  console.log(JSON.stringify(inputSearch));
	  	  
	  	  $.ajax({
	  		url: '/services/ceai/searchPerson',
	        type: 'POST',
	        data: inputSearch,
	        contentType: "application/json",
	        success: function(data, textStatus, jqXHR){
	        	try{
		        	data = JSON.parse(data);
		            $process.hide();
		        	if (typeof(data.message)=='undefined'){
		            	buildSearhOutput(data);
		            	searchCache = data;
		            	$output.show(); 
		         		$newRecordButton.show();
		        	}
		        	else{
		        		$('#messageSearch').text('Pesquisa por participante '+$.trim($('#fullName').val())+' não econtrou dados');
		        		$message.show(); 
		         		$newRecordButton.show();
		        	}
	        	}
		        catch (e){
		        	alert('Execute Reload no Browser');
		        }
	        },
	        error: function(jqXHR, textStatus, errorThrown){
	        	$('#messageSearch').text('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
	        	//alert('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
	        	 $process.hide();
	        	 $message.show(); 
	        }
	      });
  	}
  	else{
		var input = '{'
			+'"cpf" : "'+$.trim($('#cpf').val())+'"}';

		console.log(JSON.stringify(input));

		$.ajax({
			url: '/services/ceai/searchCPF',
			type: 'POST',
			data: input,
			contentType: "application/json",
			success: function(response, textStatus, jqXHR){
					$process.hide();
					if (response.message == 'NOT FOUND'){
		        		$('#messageSearch').text('Pesquisa por participante '+$.trim($('#cpf').val())+' não econtrou dados');
		        		$message.show(); 
		         		$newRecordButton.show();
					}
					else{
		            	buildSearhOutput(response.data);
		            	searchCache = response.data;
		            	$output.show(); 
		         		$newRecordButton.show();
					}
			},
			error: function(jqXHR, textStatus, errorThrown){
				$('#messageSearch').text('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
				//alert('Error on Process: '+ jqXHR.responseText+' status: '+jqXHR.statusText);
				$process.hide();
				$output.show(); 
			}
		});
  	}
}
	 

$(document).ready(function() {
	$('#newRegister').click(function(){
		newRecord();
	});	
	$('#search').click(function(){
		search();
	});
	$("#parentCpf").focusout(function(){
		if (changePwdDialog==false){
			var val = $.trim($('#parentCpf').val());
			if (val!==''){
				var isnum = /^\d+$/.test(val);
				if (!isnum){
					alert("Coloque somente números sem separadores");
					$('#parentCpf').val("");
				}
			}
			if (cpfValidate(val)==false){
				alert("CPF Inválido, Coloque somente números válidos e sem separadores");
				$('#parentCpf').val("");
			}
		}
	});
	$( "#parentCpf" ).keypress(function() {
		if (changePwdDialog==false){
			var val = $.trim($('#parentCpf').val());
			if (val!==''){
				var isnum = /^\d+$/.test(val);
				if (!isnum){
					alert("Coloque somente números sem separadores");
					$('#parentCpf').val("");
				}
			}
		}
	});	
	$("#cpf").focusout(function(){
		if (changePwdDialog==false){
			var val = $.trim($('#cpf').val());
			if (val!==''){
				var isnum = /^\d+$/.test(val);
				if (!isnum){
					alert("Coloque somente números sem separadores");
					$('#cpf').val("");
				}
			}
			if (cpfValidate(val)==false){
				alert("CPF Inválido, Coloque somente números válidos e sem separadores");
				$('#cpf').val("");
			}
		}
	});
	$( "#cpf" ).keypress(function(e) {
		var keycode = (e.keyCode ? e.keyCode : e.which);
	    if (keycode == '13') {
	    	search();
	    }
	    else{
			var val = $.trim($('#cpf').val());
			if (val!==''){
				var isnum = /^\d+$/.test(val);
				if (!isnum){
					alert("Coloque somente números sem separadores");
					$('#cpf').val("");
				}
			}		
	    }
	});	
	$("#cpfInput").focusout(function(){
		if (changePwdDialog==false){
			//alert("Acionou verificador");
			var val = $.trim($('#cpfInput').val());
			if (val!==''){
				var isnum = /^\d+$/.test(val);
				if (!isnum){
					alert("Coloque somente números válidos e sem separadores");
					$('#cpfInput').val("");
				}
			}
			if (cpfValidate(val)==false){
				alert("CPF Inválido, Coloque somente números válidos e sem separadores");
				$('#cpfInput').val("");
			}
		}
	});
	$( "#cpfInput" ).keypress(function() {
		//alert("Acionou verificador");
		if (changePwdDialog==false){
			var val = $.trim($('#cpfInput').val());
			if (val!==''){
				var isnum = /^\d+$/.test(val);
				if (!isnum){
					alert("Coloque somente números sem separadores");
					$('#cpf').val("");
				}
			}
		}
	});	
	$( "#fullName").keypress(function(e) {
		var keycode = (e.keyCode ? e.keyCode : e.which);
	    if (keycode == '13') {
	    	search();
	    }
	});	
	$('#previous').click(function(){
		window.location = "/home";
	});
	$('#next').click(function(){
		window.location = "/Contact";
	});
	$('#update').click(function(){
		createOrUpdate("update");
	});		
	$('#create').click(function(){
		createOrUpdate("insert");
	});	
	$('#cleanFields').click(function(){
		newRecord();
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
				+'"cpf" : "'+$.trim($('#parentCpf').val())+'"}';

			console.log(JSON.stringify(inputParent));

			$.ajax({
				url: '/services/ceai/searchCPF',
				type: 'POST',
				data: inputParent,
				contentType: "application/json",
				success: function(response, textStatus, jqXHR){
						console.log(response);
						if (response.message =='NOT FOUND'){
							$('#results').text("Responsável com o CPF: "+$.trim($('#parentCpf').val())+" não foi encontrado");
						}
						else{
							response.data = response.data.docs[0];
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
	$('#updateAssociation').click(function(){
		updateAssociation();
	});		
	$('#insertAssociation').click(function(){
		insertAssociation();
	});	
	$('#deleteAssociation').click(function(){
		removeAssociation();
	});	
	$('#resetPassword').click(function(){
		var data = {};
		data.userID = $('#userID').val();
	
		$.ajax({
			url: '/services/ceai/resetPassword',
	        type: "POST",
	        data: JSON.stringify(data),
	        contentType: "application/json",
	        success: function(data, textStatus, jqXHR){
	        	if (data.message=="OK"){
	        		alert("Senha Resetada com Sucesso");
	        	}
	        	else{
	        		alert("Problemas no Reset de senha, Contate o Administrador");
	        	}
	        },
	        error: function(jqXHR, textStatus, errorThrown){
	        	alert("Problemas no Reset de senha, Contate o Administrador");
	        	
	        	console.log('GDPR acceptance failed to save ');
	        }
	    });	
	});
	$('#department').change(function(){
		handleDepartmentChange();
	});
	$('#paymentYear').change(function(){
		cleanSearchOutput(document.getElementById("tableResultPayment"));
		handlePaymentChange(searchCache.docs[cachedPosition],$('#paymentYear').val());
	});
	$('#section').change(function(){
		handleSectionChange();
	});
	$('#studyType').change(function(){
		if ($('#studyType').val()=="No Selection"){
			$('#classStudyLabel').css("display","none");
			$('#classStudy').css("display","none");
		}
		else{
			$('#classStudyLabel').css("display","block");
			$('#classStudy').css("display","block");
		}
	});
	$('#associationGroup').change(function(){		
		handleAssociationGroupChange();
		
		var associationGroup = $('#associationGroup').val();
		
		if (associationGroup == "Associado"){
			$('#contribution').val('');
			$('#contribution').prop("disabled",false);
			
		}
		if (associationGroup == "Não Associado"){
			$('#contribution').val('ISENTO');
			$('#contribution').prop("disabled",true);
		}
		
	});		
	$('#updateWork').click(function(){
		updateWork();
	});		
	$('#insertWork').click(function(){
		insertWork();
	});	
	$('#deleteWork').click(function(){
		removeWork();
	});	
	$('#updateStudy').click(function(){
		updateStudy();
	});		
	$('#insertStudy').click(function(){
		insertStudy();
	});	
	$('#deleteStudy').click(function(){
		removeStudy();
	});
	$('#logout').click(function(){
		window.location = "/logout";
	});
});
