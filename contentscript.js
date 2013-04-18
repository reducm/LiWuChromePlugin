var regright="right.css";
var regleft=/刷新<\/a>.+?筛选<\/a>.+?网摘<\/a>/i;
var regname = /<strong>(.+?)加油!/i;
var obj ="";
var lobj ="";
var rport=0;
var lport=0;
var tcount = 0;
var selfname;
$(document).ready(function(){   
  if(document.body.innerHTML.indexOf(regright)>-1){	
    console.log("regrigtht");
    rport = chrome.extension.connect({name: "right"});
    obj = new Article(document.body.innerHTML);
    checkTime();
    checkNiming();
    refresh();
    rport.postMessage(obj);		
    rport.onMessage.addListener(function(msg) {//右边帖子处理
      if(msg.ask == "show"){				
	obj.show(msg.result);				
      }else if(msg.ask == "normal"){
	obj.backToNormal();
      }else if(msg.ask == "suotu"){
	suotu();
      }else if(msg.ask == "yama"){
	yama();
      }else if(msg.ask == "jump"){
	window.location.href="#floor_"+msg.result;
      }else if(msg.ask == "pucker"){
	eval(msg.result);
      }else if(msg.ask == "time"){
      	console.log("msg", msg);
	if(msg.result){
	  showTime();
	}else{noTime();}
      }else if(msg.ask == "niming"){
	if(msg.result){
	  showNiming();
	}else{noNiming();}
      }
    });
    //add wysiwyg support
    $("textarea[name=neirong2], textarea[name=neirongy]").wysiwyg({
    	css: chrome.extension.getURL("wysiwyg/editor.css"),
		rmUnusedControls: true,
		initialContent: "",
		autoGrow: true, 
		maxHeight: 600,
		iFrameClass: "wysiwyg-input",
		autoSave: true,
		rmUnwantedBr: true,
		replaceDivWithP: false,
	    controls: {
	        bold: { visible : true },
	        italic: { visible : true },
	        strikeThrough: { visible : true },
	        underline: { visible : true },
	        subscript: { visible : true },
	        superscript: { visible : true },
	        redo: { visible : true },
	        undo: { visible : true },
	        insertOrderedList: { visible : true },
	        insertUnorderedList: { visible : true },
	        removeFormat: { visible : true },
	        html  : { visible: true }
	    }
    });
  }else if(regleft.test(document.body.innerHTML)){//左边帖子列表处理
    console.log("reg left");
    var selfname = document.body.innerHTML.match(regname)[1];		
    lobj = new List(document.body.innerHTML);		
    lcheckTime();
    lcheckAuthor();
    lport = chrome.extension.connect({name: "left"});
    lport.postMessage({selfname:selfname,result:lobj});
    lport.onMessage.addListener(function(msg) {
      if(msg.ask =="time"){				
	if(msg.result){lshowTime();}else{lnoTime();}
      }else if(msg.ask =="author"){				
	if(msg.result){lshowAuthor();}else{lnoAuthor();}
      }else if(msg.ask =="compositer"){
	eval(msg.result);
      }else if(msg.ask =="normal"){
	lobj.toNormal();
      }
    });
  }
});

chrome.extension.onRequest.addListener(function(request,sender,response){
  if(request.ask=="getResult"){			
    if(obj !="" && (typeof obj) !="undefined"){				
      response({result:obj});
    }
  }
});


/////////////////////////////////逻辑请求////////////////////////////////////////////////
function init() {		//初始化,旧,废弃
  chrome.extension.sendRequest({ask:"show"}, 
			       function(response) {					
			       });
}

function p(yyobj){	
  console.log(yyobj);
  alert(yyobj);
}

function suotu(max){	 //缩图,超过max缩成640
  if(!max) max = 900;
  var imgs = $("img");
  imgs.each(function(){
    if($(this).width() >max){
      $(this).width(640);			
    }
  });	
}

function yama(){ //鸭码
  $("font[face]").each(function(){
    var text = $(this).text();		
    onTransYazi(text,$(this));		
    function onTransYazi(e,element){
      var objxmlHttp = new XMLHttpRequest();
      objxmlHttp.open("post","http://sunyanzi.ruanmeizi.com/?mosaic",true);
      objxmlHttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
      //objxmlHttp.setRequestHeader("Cookie","sunyanzi=630");		    
      objxmlHttp.onreadystatechange = function (){
	if(objxmlHttp.readyState == 4 && (objxmlHttp.status == 200 || objxmlHttp.status == 304)){
	  var result = objxmlHttp.responseText;
	  result = result.split('<li>');
	  result = result[2].split('</li>');    
	  element.attr("face","");
	  element.html(result[0]);
	}
      };		    
      objxmlHttp.send("submit=%CD%E6%C0%DB%C1%CB%A3%AC%BB%D8%BC%D2%A3%A1&text="+escape(e).replace(/\+/g,"%2B").replace(/\@/g,"%40"));		    
    }
  });
}

function showTime(){ //显示帖子时间
  localStorage.setItem("tie_time",1);
  if($(".timestamp")[0]){$(".timestamp").remove();}
  $("#jas").children().each(function(){
    var regtime = /<font.+?title=\"(.+?)\".*?>/i;
    var timestr = $(this).html().match(regtime);
    if(timestr){
      timestr = timestr[1];
      var ts = dealTime(timestr);
      $(this).children().last().append("<span class=\"timestamp\"> ｜ <span style=\"color:#965F00;\">"+ts+"</span></span>");
    }else{
      $(this).children().last().append("<span class=\"timestamp\"> ｜ <span style=\"color:#965F00;\">时间获取失败</span></span>");
    }
  });
}

function noTime(){//不显示帖子时间
  localStorage.setItem("tie_time",0);
  $(".timestamp").remove();
}

function checkTime(){	
  if(localStorage.getItem("tie_time")==1){
    showTime();
    refresh();		
  }
}

function showNiming(){	//匿名
  localStorage.setItem("tie_niming",1);
  $("input[name='nimin']").prop("checked",true);
}

function noNiming(){	
  localStorage.setItem("tie_niming",0);
  $("input[name='nimin']").prop("checked",false);
}

function checkNiming(){
  if(localStorage.getItem("tie_time")==1){
    showNiming();
    refresh();		
  }
}

function lcheckTime(){ //左侧帖子列表时间
  if(localStorage.getItem("ltie_time")==1){
    lshowTime();
    lrefresh();
    return true;
  }else{return false;}
}

function lshowTime(){
  localStorage.setItem("ltie_time",1);
  if($(".timestamp")[0]){$(".timestamp").remove();}
  var ties = lobj.ties;	
  for(var i in ties){
    var tss =$("<span class=\"timestamp\"></span>");		
    var tt = ties[i].time;
    var ts = dealTime(tt);		
    tss.html("　|　"+ts);
    tss.css("color","#965F00");
    $(".tissue[tid='"+ties[i].id+"'] > .info").append(tss);
  }
}

function lnoTime(){
  localStorage.setItem("ltie_time",0);
  $(".timestamp").remove();
}

function lshowAuthor(){ //左侧列表显示作者
  localStorage.setItem("ltie_author",1);
  if($(".author")[0]){$(".author").remove();}
  var ties = lobj.ties;
  var hastime = lcheckTime();
  for(var i in ties){
    var tss =$("<span class=\"author\"></span>");		
    var ta = ties[i].author;		
    tss.html("　|　"+ta);
    tss.html(tss.text());
    tss.css({color:"#965F00","font-weight":"bolder"});
    if(hastime){			
      $(".tissue[tid='"+ties[i].id+"'] > .info").children(".timestamp").before(tss);
    }else{
      $(".tissue[tid='"+ties[i].id+"'] > .info").append(tss);
    }
  }
}

function lnoAuthor(){
  localStorage.setItem("ltie_author",0);
  $(".author").remove();
}

function lcheckAuthor(){
  if(localStorage.getItem("ltie_author")==1){
    lshowAuthor();
    lrefresh();
    return true;
  }else{return false;}
}

function testS(){
  //alert("tests");
}

function zlPucker(){ //折叠主楼
  obj.backToNormal();
  var regreg = /<hr>(.+?)<br><a .+?>---<\/a><a .+?<\/a>/i;
  var str1 = document.body.innerHTML.match(regreg); //拿出主帖的内容	
  var str2 = document.body.innerHTML.replace(str1[1],"<fieldset id=\"zl_f\">主楼已折叠,点击<a href=\"#\" id=\"zl_a\" style=\"font-size:15px;color:orange;\">这里</a>展开</fieldset>");// 去掉他
  document.body.innerHTML = str2;	
  $("#zl_a").bind("click",function(){
    $("#zl_f").remove();
    $("hr").first().after(str1[1]);
  });
}

function yyPucker(){ //折叠引用
  obj.backToNormal();
  $(".silver").children("fieldset").each(function(){
    var str = $(this).html();
    $(this).html("");
    $(this).append("<div class=\"putstr\" style=\"display:none\">"+str+"</div>");
    $(this).append("该引用已折叠,点击<a href=\"javascript:void(0)\" class=\"yy_a\" style=\"font-size:14px;color:orange;\">这里</a>展开");		
  });	
  $(".yy_a").each(function(){
    var parent = $(this).parent();
    $(this).bind("click",function(){
      var str = parent.find(".putstr").html();
      parent.html("");
      parent.html(str);
    });
  });
}

function fromHighToLow(){//按回复数多->少排列
  var ptop = tiesCompositer(lobj.topties,"h");
  var pnormal = tiesCompositer(lobj.normalties,"h");
  lshow(ptop,pnormal);
}

function fromLowToHigh(){//同上调转
  var ptop = tiesCompositer(lobj.topties,"l");
  var pnormal = tiesCompositer(lobj.normalties,"l");
  lshow(ptop,pnormal);
}

function lshow(tarr, narr){ //[id,id,id,id] 左侧显示调用的方法,传入置顶区id 数组和 普通区id数组
  var topdiv = $("#top");	
  var normaldiv = $("#normal");
  topdiv.children("p").html("");
  normaldiv.children("p").html("");
  normaldiv.css("border","1px solid orange");
  topdiv.css("border","1px solid orange");
  for(var i=0; i<tarr.length;i++){
    var idddd = tarr[i];
    var tissue = $("<div class=\"tissue\" tid=\""+idddd+"\"></div>");
    tissue.html(lobj.topties[idddd].orgstr);
    tissue.children("a").after("<span class=\"info\"></span>");
    topdiv.children("p").append(tissue);
  }
  for(var i=0; i<narr.length;i++){
    var idddd = narr[i];
    var tissue = $("<div class=\"tissue\" tid=\""+idddd+"\"></div>");
    tissue.html(lobj.normalties[idddd].orgstr);
    tissue.children("a").after("<span class=\"info\"></span>");
    normaldiv.children("p").append(tissue);
  }	
  lcheckAuthor();
  lcheckTime();
}

function tiesCompositer(tarr,str){//回复数排序,str=h多->少,str=l少->多,传入的[{ccount:12,id:"xxxxx"},{ccount:13,id:"xxxxx"}], 返回[id,id,id,id,id] 
  var temp = [];
  var tt = tarr;
  var forreturn =[];
  for(var i in tt){
    var to = {};
    to['ccount']= tt[i].ccount;
    to['id'] = i;	
    temp[temp.length] = to;		
  }

  if(str=="h"){		
    for(var i=0; i<temp.length; i++){
      for(var j=i+1; j<temp.length;j++){
	if(parseInt(temp[j].ccount)>parseInt(temp[i].ccount)){
	  var to = temp[j];
	  temp[j] = temp[i];
	  temp[i] = to;
	}
      }
    }
  }else if(str=="l"){
    for(var i=0; i<temp.length; i++){
      for(var j=i+1; j<temp.length;j++){
	if(parseInt(temp[j].ccount)<parseInt(temp[i].ccount)){
	  var to = temp[j];
	  temp[j] = temp[i];
	  temp[i] = to;
	}
      }
    }
  }	

  for(var i=0;i<temp.length; i++){
    forreturn[i] = temp[i]['id'];
  }
  return forreturn;
}
////////////////////////////数据结构///////////////////////////////////////////
function Article(domstr){//comments[comment{orgstr: name: time: content: }]  	这个是处理文章类	
  this.orgstr = domstr; //原始html代码
  this.comments ={}; //回复数组,里面装comment对象
  this.title=""; //题目
  this.author = ""; //作者
  this.acontent=""; //主楼内容
  this.time = ""; //时间
  this.nowshow=[]; //目前显示的回复排列
  this.maxfloor=0; //最大楼层数

  var regtitle=/<\/title><a href=\".+?\">(.+?)<\/a>.+?【新窗打开】.+?<\/a>/i;
  var regtime=/<em>\(发帖时间:(.+?)\)<\/em>/i;
  var regauthor=/<span.+?>(<b>)?(.+?)(【.+?】)?(<\/b>)?<\/span>/i;
  var regacontent= /<hr>(.+?<br><a.+?>---<\/a><a.+?><span.*?>.+?<\/span><\/a>)/i;
  var regnotp = /<input .+?提交回复.+?>/i;
  var regp = /---/i;
  var regscript = /<script language=\"JavaScript\".+?<meta http-equiv=\"PRAGMA\" content=\"NO-CACHE\">/i;
  var regftos = /(<font.+?)<script language=\"JavaScript\"/i;
  this.build = function(){
    this.repairDom();			
    this.title = this.dealReg(regtitle);
    //p("title:"+this.title);
    this.time = this.dealReg(regtime);
    //p("time:"+this.time);
    this.author = this.dealReg(regauthor,2);
    //p("author:"+this.author);
    this.acontent=this.dealReg(regacontent);
    //p("acontent:"+this.acontent);
    this.maxfloor = this.buildComments();
    //p("maxfollr:"+this.maxfloor);
    this.orgstr = document.body.innerHTML;
    //p("this.orgstr:"+this.orgstr);		
  };

  this.dealReg = function(reg,num){		
    if(num)
      return regContent(this.orgstr,reg,num);
    else
      return regContent(this.orgstr,reg,1);	
  };

  this.show= function(comarray){
    this.nowshow = comarray;		
    var ts = ""; 
    for(var i in comarray){			
      var tc = this.comments[comarray[i]];
      ts+= tc.orgstr;
    }		
    var jas = document.getElementById("jas");
    jas.innerHTML = ts;
    jas.style.border= "1px solid orange";
  };

  this.backToNormal = function(){
    document.body.innerHTML = this.orgstr;
    $("#jas").css("border","");
  };

  this.buildComments = function(){//这是匹配里屋一些引用 或者鸭码时候的用途,关键是匹配到回复<p>的下一元素不是<p>的时候,把之间的元素放进这个P
    var aspan = $("a:has(span)").first();	
    aspan.after($("<div id=\"jas\" ></div>"));		
    var ps = $("p:contains('回复')");
    //var deal =[]; //[[p段落,[fieldset,br,a,a,div(之类)]]]
    var deal ={};
    var countp = 1;
    ps.each(function(){  //这里是把有引用和鸭码的段落筛选出来,放到数组		    
      if(!($(this).next()[0])){
	return true;
      }else{
	var ln = $(this).next()[0].localName; 
      }
      var pp  = $(this);		    
      if(pp.next()[0].localName != "p"){//如果不等于p,就是之间的东西就是一堆引用或者鸭码		        
	deal[countp] = [];
	deal[countp][0] = pp;
	var tempcount = 1;		        
	pp.nextUntil("p").each(function(){		   
	  if($(this).html().match(/<script/i)){
	    return true;
	  }
	  deal[countp][tempcount] = $(this);
	  tempcount ++;
	});
      }else{
	if(pp.html().match(/<script/i)) {return true;}
	deal[countp] = [];
	deal[countp][0] = pp;		    	
      }
      countp++;
    });		

    var jas = $("#jas");		
    var scount=1; //计算楼数,加id,跳楼的作用
    for(var i in deal) { //这里是吧数组里节点加上p,因为jquery循环不能在循环中改变dom
      var silver = $("<div class=\"silver\" id=\"floor_"+scount+"\"></div>");
      if(deal[i].length>1){//
	for(var j in deal[i]){
	  silver.append(deal[i][j]);
	}				
      }else{
	silver.append(deal[i][0]);				
      }
      scount++;
      jas.append(silver);			
    }				

    var temps = [];
    $(".silver").each(function(){
      var temp = new Comment($(this).html());
      temps[temps.length] = temp;
    });
    for(var i in temps) {
      this.comments[temps[i].floor] = temps[i];
    }
    temps = null;
    return scount-1;
  };	

  this.repairDom = function (){
    var f = $("font:has(p:contains('回复</a>'))");
    if(f[0]){
      //p("repairDom");
      var temp = f.html();			
      var up = f.find("hr").first().prevAll();
      var scriptstr = temp.match(regscript)[0];			
      var ftosstr = temp.match(regftos)[1];
      $("body").children("fieldset").after(ftosstr);
      f.children("font:first").nextUntil("script").remove();			
      f.children("font:first").remove();
    }
  };	
  this.build();	
}

function Comment(commstr){	 //回复类
  this.orgstr=commstr; //原始内容
  this.name=""; //回帖人名
  this.time=0;	//时间
  this.floor=0; //第几楼
  this.content = this.orgstr; //内容
  this.img=0; //有图就=1
  this.yama=0; //有鸭码=1
  //this.fieldset=0;

  var regname=/<span.+?>(<b>)?(.+?)(<\/b>)?(【.+?】)?<\/span>/i;
  var regcontent="";
  var regfloor=/回复<\/a>\((\d+?)\)/i;
  var regimg =/<font.+?(<img.+?>).+?<\/font>/i;
  var regtime = /<font.+?title=\"(.+?)\".*?>/i;
  //var regfieldset = /<fieldset.*?>(.+?)<\/fieldset>/i;
  this.build = function(){		
    this.name = this.dealReg(regname,2);
    //p("name:"+this.name);
    this.time = this.dealReg(regtime);
    //p("time:"+this.time);
    if(regimg.test(this.orgstr)){this.img=1;}
    //p("img:"+this.img);
    if(/<font face=.+?>/.test(this.orgstr)){this.yama=1;}
    //p("yama:"+this.yama);
    this.floor = this.dealReg(regfloor);		
    //p("floor:"+this.floor);
    /*		if(regfieldset.test(this.orgstr)){
		this.fieldset=1;
		p("有引用的楼:"+this.floor+"\n");
		}*/
  };

  this.dealReg = function(reg,num){		
    if(num)
      return regContent(this.orgstr,reg,num);
    else
      return regContent(this.orgstr,reg,1);
  };

  this.build();
}

function List(documentstr){ //左侧列表的数据结构对象
  this.orgstr = documentstr; //原始内容
  this.topties = {}; //置顶区的贴 ,装Tie对象
  this.normalties = {}; //普通区的贴
  this.ties ={};
  this.topp = []; //置顶区贴id 索引
  this.normalp = []; //普通区贴id 索引
  this.topstr = ""; 
  this.normalstr ="";

  var regtie = /◆.+?<a.+?\/a>(<img.+?>)?<br>/ig;
  this.build = function(){
    this.topstr = $("p").first().nextAll("p").first().html();
    var match = this.topstr.match(regtie);		
    for(var i in match){
      var temptie = new Tie(match[i]);
      this.topp[this.topp.length] = temptie.id;
      this.topties[temptie.id] = temptie;
      this.ties[temptie.id]=temptie;
    }
    this.normalstr = $("p").last().html();
    match = this.normalstr.match(regtie);

    for(var i in match){
      var temptie = new Tie(match[i]);
      this.normalp[this.normalp.length] = temptie.id;
      this.normalties[temptie.id] = temptie;
      this.ties[temptie.id]=temptie;			
    }
    this.buildTies();	
  };

  this.buildTies=function(){
    var lp = $("p").last();
    var fp = $("p").first().nextAll("p").first();
    fp.before("<div id=\"top\"></div><div id=\"normal\"></div>");
    fp.remove();
    lp.remove();
    var topdiv = $("#top");	
    var normaldiv = $("#normal");
    buildDom(topdiv, normaldiv,this.topp, this.topties, this.normalp, this.normalties);
    this.orgstr = document.body.innerHTML;
  };

  this.toNormal = function(){		
    buildDom($("#top"), $("#normal"), this.topp, this.topties, this.normalp, this.normalties);
    lcheckAuthor();
    lcheckTime();
  };	

  this.build();
}

function Tie(tiestr){ //左侧每条贴的点击地址数据结构
  this.orgstr = tiestr; 
  this.id = 0; //帖子id 
  this.title =""; //题目
  this.author = ""; // 作者
  this.time = ""; //最后回复时间
  this.ccount=0; //回复数
  this.link = ""; 

  var reglink = /href=\"(.+?)\"/i;
  var regtitle = /<a href.+?>(.+?)( \(\d+\))?<\/a>/i;
  var regtimeauthor = /title=\"【(\d+?-\d+?-\d+? \d+?:\d+?:\d+?) (.+?)(【.+?】)?】\"/i;
  var regccount = /<a.+?>.+?\((\d+)\)<\/a>/i;
  this.build = function(){
    //p("tie orgstr:"+this.orgstr);
    this.link = this.dealReg(reglink);
    //p("tie link:"+this.link);
    var match=this.link.match(/id=(\d+)/i);		
    this.id = match[1];
    //p("tie id:"+this.id);
    this.title =this.dealReg(regtitle);
    //p("tie title:"+this.title);
    this.time = this.dealReg(regtimeauthor);
    //p("tie time:"+this.time);
    this.author = this.dealReg(regtimeauthor, 2);
    //p("tie author:"+this.author);
    this.ccount= this.dealReg(regccount);
    //p("tie ccount:"+this.ccount);
  };

  this.dealReg = function(reg,num){		
    if(num)
      return regContent(this.orgstr,reg,num);
    else
      return regContent(this.orgstr,reg,1);
  };	
  this.build();
}

function buildDom(topdiv,normaldiv,topp,topties,normalp,normalties){	 //这个是左方组织完数据结构后在dom显示的处理,为何要单独出来,因为还原功能里面需要
  topdiv.empty();
  normaldiv.empty();	
  topdiv.html("<p></p>");
  normaldiv.html("<p></p>");
  topdiv.css("border","");
  normaldiv.css("border","");
  for(var i in topp){
    var idddd = topp[i];
    var tissue = $("<div class=\"tissue\" tid=\""+idddd+"\"></div>");
    tissue.html(topties[idddd].orgstr);		
    tissue.children("a").after("<span class=\"info\"></span>");		
    topdiv.children("p").append(tissue);
  }

  for(var i in normalp){
    var idddd = normalp[i];
    var tissue = $("<div class=\"tissue\" tid=\""+idddd+"\"></div>");
    tissue.html(normalties[idddd].orgstr);
    tissue.children("a").after("<span class=\"info\"></span>");
    normaldiv.children("p").append(tissue);
  }		
}


function regContent(str,reg,pos){//方便处理正则
  var i = str.match(reg);	
  if(i){return i[pos];}else{return 0;}	
}

function dealTime(timestr){ //处理时间,参考了油猴脚本
  var nowtime = new Date();
  var d =0;
  try{
    d = new Date(timestr.replace(/-/g, '/')); // 需要先把年-月-日改成年/月/日，否则 Invalid Date
  }catch(err){
    return "时间获取失败";
  }

  var ts = parseInt((nowtime - d) / 1000);    
  if (ts < 60) { // 小于1分钟/60秒
    return (ts + ' 秒前');
  } else if (ts < 3600) { // 小于1小时/60分钟
    return (parseInt(ts / 60) + '分钟前');
  } else if (ts < 86400) { // 小于1天/24小时
    return (parseInt(ts / 3600) + '小时前');
  } else if (ts < 2592000) { // 小于30天
    return (parseInt(ts / 86400) + '天前');
  }else if(ts < 31536000) {
    return (parseInt(ts / 2592000) + '月前');
  }else if(ts < 315360000){
    return (parseInt(ts / 31536000) + '年前');
  }
}

function refresh(){
  obj.orgstr = document.body.innerHTML;
}

function lrefresh(){
  lobj.orgstr = document.body.innerHTML;
}

function log(xxx){
  console.log(xxx);
}

function repairLeft(top, normal){ 
  top.children("p").each(function(){$(this).remove();});
  normal.children("p").each(function(){$(this).remove();});
  p(top.html());
  var tstr = top.html();
  var nstr = normal.html();
  top.html("<p>"+tstr+"</p>");

  normal.html("<p>"+nstr+"</p>");
} 
