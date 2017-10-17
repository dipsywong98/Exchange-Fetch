/**index.js
 * Copyright (c) Dipsy Wong 2017
 * 
 * Author: Dipsy Wong(dipsywong98)
 * Created on 2017-10-16
 * 
 * Fetch all exchange data from http://arr.ust.hk/ust_actoe/credit_overseas.php
 */

//libraries
var request = require('request');
const cheerio = require('cheerio');
var fs = require('fs');
var moment = require('moment');

//global variables
var $;
var countries=[];
var institudes=[];
columns=[];

var root = 'http://arr.ust.hk/ust_actoe/';

function GetInnerText(element){
    if(!element) return "ignored";
    var str = '';
    for(var i=0; i<element.children.length; i++){
        if(element.children[i]&&element.children[i].data) str += element.children[i].data
        else str += '|';
    }
    return str;
}

function StrContain(str1, str2){
    return str1.indexOf(str2) !== -1;
}

function WriteFile(file_name,string){
    console.log(`saving ${file_name}...`);
    fs.writeFile(file_name, string, function(err) {
        if(err) {
            return console.log('error',err);
        }
        console.log(`save ${file_name} success`);
    }); 
}

function FetchCountries(){
    request(root+'credit_overseas.php', function (error, response, body) {
        
        $ = cheerio.load(body);
    
        countries = $($('select')[0]).find('option[value!=""]');
        countries = countries.map(function(k,a){return GetInnerText(a)}).splice(0,countries.length);
        
        console.log(countries);

        FetchInstitudes(0);
    });
}

function FetchInstitudes(i=0){
    if(i>=countries.length){
        console.log(institudes);
        WriteFile('countries_and_institudes.json',JSON.stringify(
            {
                countries:countries,
                institudes:institudes
            }
        ), null, '  ');
        return;
    }
    request(root+`sub_result.php?t=${Date.now()}&location=${countries[i]}`, function (error, response, body) {
        var data = body.split('?');
        for(var j=0; j<data.length-1; j+=2){
            institudes.push({
                name:data[j],
                country:countries[i],
                id:data[j+1]
            })
        }
        FetchInstitudes(i+1);
    });
}

function GetCountriesAndInstutudesJSON(){
    request('http://localhost/usthing/exchange/countries_and_institudes.json', function (error, response, body) {
        // console.log(error,response,body)
        institudes = JSON.parse(body).institudes;
        FetchCreditTransfers(institudes[0].id)
    });
    
}

function FetchCreditTransfers(institude_id){
    console.log(institude_id);
    //credit_overseas.php?selCty=Finland&selI=B0525&txtK=&search=y&btn1=+Search+#myform
    request(root+`credit_overseas.php?selCty=&selI=${institude_id}&txtK=&search=y&btn1=+Search+#myform`, function (error, response, body) {
        
        $ = cheerio.load(body);
    
        var tbody = $($('tbody')[5]);

        var Institude = GetInnerText(($(tbody.find('tr')[0]).find('div.brown'))[0])
        columns = ['Institude','Institude_id','country'].concat(BuildAttrs(tbody));     //collumn name of credit transfer table

        console.log(columns)
    });
}

function BuildAttrs(tbody){
    var l = tbody.find('tr.table_title').find('td');
    l=l.splice(0,l.length);
    return l.map(function(element) {
        return GetInnerText(element);
    }, this);
}


// FetchCountries();
GetCountriesAndInstutudesJSON();