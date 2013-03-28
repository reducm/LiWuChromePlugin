/*
 *
 *  liwu right panel content parse
 *  @version: 
 * 	@date: 2013-03-27
 *  Thanks Reducm do the Great work, This code is base on Reducm's work
 *  and it fixes multiple levels of reference issue with uses new data structure.
 *  
 * 
 * 	In the liwu right panel include Topic, Topic Title, Topic Author, Topic Content, Topic Time, 
 *  Topic Links, Topic Images
 * 	Replies: Reply Floor ID, Reply Content, Reply Author, Reply Time, Reply Reference Floor ID, Relpy Link
 * 	Toolbar and Reply form
 * 	In Reply Content has a few elements: image, yama, link
 *  The Structure:
 *
 *	{"topic": {  "topic_title": "",
 *			"topic_author": "",
 *			"topic_content":"",
 *			"topic_time": "",
 *			"topic_links": "",
 *			"topic_images": "",
 *			"replies":[{
 *				"reply_floor": "",
 *				"reply_content": "",
 *				"reply_author": "",
 *				"reply_time": "",
 *				"reply_reference": "",
 *				"reply_link": ""
 *			}],
 *			"reply_form": "",
 *			"toolbar": ""
 *		}
 *  }
 */
 
 var liwu = {
	global: {
		init: function(){
			liwu.rightPanel.init();
		},
		checkIsCorrectPanel: function(regright){
			var is_correct = false;
			if( document.body.innerHTML.indexOf(regright) > -1 ){
				is_correct = true;
			}
			return is_correct;
		},
		dealReg: function( orgstr, reg, num){
			num = typeof num !== 'undefined' ? num : 1;
			return this.regContent(orgstr, reg, num);
		},
		regContent: function ( str, reg, pos){//方便处理正则
			var i = str.match(reg);
			var content = 0;
			if ( i ){
				content = i[pos];
			}
			return content;
		}
	},
	rightPanel: {
		topic: {},
		orgstr: "",
		init: function(){
			this.orgstr = document.body.innerHTML;
			var start_time = 0;
			if ( liwu.global.checkIsCorrectPanel("right.css") ){
				console.log("==== Start Data Init ====");
				start_time = new Date();
				this.parseTopic();
				console.log(this.topic);
				console.log("==== Finish Data Init "+(( new Date() - start_time)/1000)+" seconds ====");
				/*
				console.log("==== Start Rebuild HTML ====");
				start_time = new Date();
				var html = this.rebuildHTML();
				console.log("==== Finish Rebuild HTML "+(( new Date() - start_time)/1000)+" seconds ====");
				*/
			}
		},
		regExp: {
			reg_topic_title 	: /<\/title><a href=\".+?\">(.+?)<\/a>.+?【新窗打开】.+?<\/a>/i,
			reg_topic_author 	: /<span.+?>(<b>)?(.+?)(【.+?】)?(<\/b>)?<\/span>/i,
			reg_topic_content 	: /<hr>(.+?)<br><a .+?>---<\/a><a .+?><\/a>/i,
			reg_topic_time 		: /<em>\(发帖时间:(.+?)\)<\/em>/i,
			reg_notp 			: /<input .+?提交回复.+?>/i,
			reg_p 				: /---/i,
			reg_script 			: /<script language=\"JavaScript\".+?<meta http-equiv=\"PRAGMA\" content=\"NO-CACHE\">/i,
			reg_ftos 			: /(<font.+?)<script language=\"JavaScript\"/i,
			reg_toolbar 		: /<hr>(.+?)<form/i,
			reg_reply_floor 	: />回复<\/a>\((.+?)\):/i,
			reg_reply_author    : /fatieren2=(.+?)(【.+?】)?\&fatieren=/i, // TODO: something not right
			reg_misc_reference  : /引用(.+?)楼内容/i
		},
		rebuildHTML: function(){
			
		},
		parseTopic: function(){
			this.topic = {
				"topic_title": $("title").next().text(),
				"topic_author": liwu.global.dealReg(this.orgstr, this.regExp.reg_topic_author, 2),
				"topic_content": liwu.global.dealReg(this.orgstr, this.regExp.reg_topic_content),
				"topic_time": liwu.global.dealReg(this.orgstr, this.regExp.reg_topic_time),
				"reply_form": $("form[name=revert]").html(),
				"toolbar": liwu.global.dealReg(this.orgstr, this.regExp.reg_toolbar, 1),
				"replies": this.parseReplies()
				};
		},
		parseReplies: function(){
			var replies = new Array();
			var reply_misc = '';

			// get replies
			$.each($("p:contains('回复')"), function(){
				var reply_html = $(this).html();
				var reply_floor = liwu.global.dealReg( reply_html, liwu.rightPanel.regExp.reg_reply_floor);
				if ( reply_floor > 0){
					// get reply content and remove carriage return
					var reply_content = $(this).find("font[title]").text().replace(/[\n\r]/g, '');
					var reply_reference = 0;
					var reply_time = $(this).find("font[title]").attr("title");
					// check, if the reply content is empty, need to check the reference or yama
					if ( !reply_content ){
						var misc = liwu.rightPanel.parseMisc(this, reply_time);
						reply_content = misc.reply_content;
						reply_reference = misc.reply_reference;
					}
					var reply_link = $(this).find("a").first().attr("href");
					
					var replay = {
						"reply_floor": reply_floor,
						"reply_content": reply_content,
						"reply_author": liwu.global.dealReg( reply_link, liwu.rightPanel.regExp.reg_reply_author).replace("<b>", "").replace("</b>", ""),
						"reply_time": reply_time,
						"reply_reference": reply_reference,
						"reply_link": reply_link
					};
					replies[reply_floor] = replay;
				}
			});
			return replies
		},
		parseMisc: function(reply, reply_time){
			// TODO: need working on Yama
			var get_first_tagname = $(reply).next().prop("tagName");
			var reply_reference = 0;
			var reply_content = "";
			switch( get_first_tagname ){
				// include html
				case "DIV":
					$.each( $("font"), function(){
						if ( $(this).attr("title") == reply_time){
							reply_content += $(this).html();
						}
					});
					break;
				//reference
				case "FIELDSET":
					var misc = $(reply).nextAll().slice(0, 5);
					reply_reference = liwu.global.dealReg( misc.html(), this.regExp.reg_misc_reference);
					reply_content = misc.next().html();
					break;
			}
			var reply_misc = {
				"reply_reference": reply_reference,
				"reply_content": reply_content.replace(/[\n\r]/g, ''),
				"reply_yama": ""
			}

			return reply_misc;
		}
	}
}




















