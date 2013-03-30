var result="";
var selfname= "";
var rports={};
var lports={};
var bgtabid=0;
var robjs={};
var lobjs ={};
chrome.extension.onConnect.addListener(dealPort);
function dealPort(port) {
  bgtabid = port.sender.tab.id;	
  if(port.name =="left"){		
    lports[bgtabid] = port;		
    port.onMessage.addListener(function(msg){			
      selfname = msg.selfname;
      lobjs[bgtabid] = msg.result;
      showPopup({},port.sender.tab.id);
    });		 
  }else{
    rports[bgtabid] = port;
    port.onMessage.addListener(function(msg){
      robjs[bgtabid] = msg;
      result = msg;
      showPopup({},port.sender.tab.id);
    });
  }
}

function onRequest(request,sender,response){	
  console.log("background", request);
  if(request.ask=="right"){
    rports[bgtabid].postMessage(request.request);
  }else if(request.ask=="left"){		
    for(var i in lports){			
      lports[i].postMessage(request.request);
    }
  }else if(request.ask=="getResult"){		
    var rp = function(rpp){result=rpp.result};
    chrome.tabs.sendRequest(bgtabid,{ask:"getResult"},rp);		
  }else if(request.ask=="rtime"){
    for(var i in rports){			
      rports[i].postMessage(request.request);
    }
  }else if(request.ask=="niming"){
    for(var i in rports){			
      rports[i].postMessage(request.request);
    }
  }
}
chrome.extension.onRequest.addListener(onRequest);

chrome.tabs.onSelectionChanged.addListener(function(id,obj){
  chrome.tabs.sendRequest(id,{ask:"getResult"},function(response){
    bgtabid = id;
    //p(id+":in background");
    result = response.result;
  });
});

function showPopup(re,id){	
  chrome.pageAction.show(id);
}

function p(obj){	
  console.log(obj);
  alert(obj);
}

