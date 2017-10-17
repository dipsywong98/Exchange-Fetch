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
var countries = [];
var institudes = [];
var columns = [];
var transfer_entries = [];
var institude_index=0;

var root = 'http://arr.ust.hk';

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
    request(root+'/ust_actoe/credit_overseas.php', function (error, response, body) {
        
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
    request(root+`/ust_actoe/sub_result.php?t=${Date.now()}&location=${countries[i]}`, function (error, response, body) {
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
        FetchCreditTransfersByInstitude(institudes[0])
    });
    
}

function ParseCreditTransfers(body, institude_obj){
    $ = cheerio.load(body);
    
    console.log('fetching: ',JSON.stringify(institude_obj));

    var tbody = $($('tbody')[5]);

    var institude = GetInnerText(($(tbody.find('tr')[0]).find('div.brown'))[0])
    columns = BuildAttrs(tbody);     //collumn name of credit transfer table

    var entries = tbody.find('tr');                 //credit transfer entries
    entries = entries.splice(2,entries.length-2);
    for(var i=0;i<entries.length;i++){
        var tds = $(entries[i]).find('td');
        var entry={'Institude':institude_obj.name,'Institude_id':institude_obj.id,'country':institude_obj.country};
        for(var j=0; j<tds.length; j++){
            entry[columns[j]]=GetInnerText(tds[j]);
        }
        transfer_entries.push(entry);
    }
    // console.log(transfer_entries);
    var a = $('a.link1');
    var fetch_next=true;
    a=a.splice(0,a.length);
    for(var i=0; i<a.length; i++){
        if(GetInnerText(a[i])=='Next') {
            fetch_next=false;
            FetchCreditTransfersByURL(root+a[i].attribs.href,institude_obj)
        }
    }
    console.log(fetch_next);
    if(fetch_next){
        if(++institude_index<institudes.length){
            FetchCreditTransfersByInstitude(institudes[institude_index]);
        }
        else{
            WriteFile('transfers.json',JSON.stringify(transfer_entries));
        }
    }
}

function FetchCreditTransfersByInstitude(institude_obj){
    request(root+`/ust_actoe/credit_overseas.php?selCty=&selI=${institude_obj.id}&txtK=&search=y&btn1=+Search+#myform`, function (error, response, body) {
        ParseCreditTransfers(body,institude_obj);
    });
}

function FetchCreditTransfersByURL(url,institude_obj){
    request(url, function (error, response, body) {
        ParseCreditTransfers(body,institude_obj);
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