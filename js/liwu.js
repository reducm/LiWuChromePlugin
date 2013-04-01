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
 $(document).ready(function(){
 	liwu.global.init();
 });
 
 
 
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
		},
		unique_array: function(arr_itm){
			var unique_arr = arr_itm.filter(function(itm,i,arr_itm){
    			return i == arr_itm.indexOf(itm);
			});
			return unique_arr;
		}
	},
	rightPanel: {
		topic: {},
		orgstr: "",
		init: function(){
			this.orgstr = document.body.innerHTML;
			var start_time = 0;
			if ( liwu.global.checkIsCorrectPanel("right.css") ){
				start_time = new Date();
				this.parseTopic();
				console.log(this.topic);
				console.log("==== Data Init "+(( new Date() - start_time)/1000)+" seconds ====");
				// add toolbar div tag before topic title
				$("title").after('<div class="clr">&nbsp;</div>');
				this.addToolBar();
				// add action
				this.addButtonAction();
			}
		},
		regExp: {
			reg_topic			: /<\/title>(.+?)<hr><script/i,
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
		addButtonAction: function(){
			// jump
			$("input[name=jump_to]").click(function(){
				var jump_num = $("input[name=jump_num]").val();
				if ( jump_num > 0 ){
					$.scrollTo( $("#floor_"+jump_num), 800, {offset:-30} );
				}
			});
			// only show ta
			$("select[name=only_ta]").change(function(){
				var floors = $(this).val().split(",");
				liwu.rightPanel.showFloors(floors);
			});
		},
		showFloors: function(floors){
			console.log("==== 只看 ====");

			// init floor class
			$(".floor").addClass("hide_floor");
			
			$.each(floors, function(){
				if ( this > 0 ){
					$("#floor_"+this).removeClass("hide_floor");
				}else{
					$(".floor").removeClass("hide_floor");
				}
			});
			$(".floor").each(function(){
				if ( $(this).hasClass("hide_floor") ){
					$(this).slideUp("fast");
				}else{
					$(this).slideDown("fast");
				}
			});
		},
		addToolBar: function(){
			$("body").append('<div id="toolbar"></div>');
			var html = '';
			//only show LZ
			//var only_lz = "只看楼主";
			//jump to floor
			var jump_to = "跳楼";
			// only show author
			var only_ta = "只看TA";
			
			//var html = '<li><input type="button" name="only_lz" value="'+only_lz+'" /></li>';
			
			html += '<li><select name="only_ta">';
			html += '<option value="0">'+only_ta+'</option>';
			html += this.getAuthorListHtml();
			html += '</select></li>';
			
			html += '<li><input type="text" name="jump_num" value="" placeholder="'+jump_to+'" size="2" /><input type="button" name="jump_to" value="跳" /></li>';
			$("#toolbar").append('<ul>'+html+'</ul>');
			// add button sytle
			$("#toolbar input[type=button]").button();
		},
		getAuthorListHtml: function(){
			var list_html = "";
			var authors = this.getAuthorList();
			var replies = this.topic.replies;
			$.each(authors, function(idx,author){
				var floors = new Array();
				$.each(replies, function(){
					if ( this.reply_author == author ){
						floors.push(this.reply_floor);
					}
				})
				if ( idx == 0 ){
					author += " (楼主)";
				}
				list_html += '<option value="'+floors+'">'+author+'</option>';
			})
			return list_html;
		},
		getAuthorList: function(){
			var authors = new Array();
			var replies = this.topic.replies;
			authors.push(this.topic.topic_author);
			$.each(replies, function(){
				if ( this.reply_author){
					authors.push(this.reply_author);
				}
			});
			authors = liwu.global.unique_array(authors);
			return authors;
		},
		parseTopic: function(){
			this.topic = {
				"topic_title": $("title").next().text(),
				"topic_author": liwu.global.dealReg(this.orgstr, this.regExp.reg_topic_author, 2),
				"topic_content": liwu.global.dealReg(this.orgstr, this.regExp.reg_topic_content),
				"topic_time": liwu.global.dealReg(this.orgstr, this.regExp.reg_topic_time),
				"reply_form": $("form[name=revert]").html(),
				"toolbar": liwu.global.dealReg(this.orgstr, this.regExp.reg_toolbar, 1),
				"replies": this.parseReplies(),
				};
		},
		parseReplies: function(){
			var replies = new Array();
			var reply_misc = '';
			var jas = $();
			$("a:has(span)").first().after('<div id="jas"></div>');

			// get replies
			$.each($("p:contains('回复')"), function(){
				var reply_html = $(this).html();
				var reply_floor = liwu.global.dealReg( reply_html, liwu.rightPanel.regExp.reg_reply_floor);
				if ( reply_floor > 0){
					// prepay container
					var floor_id = "floor_"+reply_floor;
					$(this).before('<div class="floor" id="'+floor_id+'"></div>');
					
					// get reply content and remove carriage return
					var reply_content = $(this).find("font[title]").text().replace(/[\n\r]/g, '');
					var reply_reference = 0;
					var reply_time = $(this).find("font[title]").attr("title");
					
					// deleted reply
					if (!reply_content){
						reply_content = $(this).find("font[color=#C0C0C0]").text().replace(/[\n\r]/g, '');
					}
					// check, if the reply content is empty, need to check the reference or yama
					if ( !reply_content ){
						var misc = liwu.rightPanel.parseMisc(this, reply_time, floor_id);
						reply_content = misc.reply_content;
						reply_reference = misc.reply_reference;
					}else{
						$("#"+floor_id).append( $(this) );
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
					$("#"+floor_id).appendTo( $("#jas") );
				}
			});
			return replies
		},
		parseMisc: function(reply, reply_time, floor_id){
			// TODO: need working on Yama
			var get_first_tagname = $(reply).next().prop("tagName");
			var reply_reference = 0;
			var reply_content = "";
			var misc = '';
			switch( get_first_tagname ){
				// include html
				case "DIV":
					$.each( $("font"), function(){
						if ( $(this).attr("title") == reply_time){
							reply_content += $(this).html();
						}
					});
					misc = $(reply).nextAll().slice(0, 6);
					this.divAroundHTML(floor_id, misc);
					break;
				//reference
				case "FIELDSET":
					misc = $(reply).nextAll().slice(0, 5);
					reply_reference = liwu.global.dealReg( misc.html(), this.regExp.reg_misc_reference);
					reply_content = misc.next().html();
					this.divAroundHTML(floor_id, misc);
					break;
			}
			var reply_misc = {
				"reply_reference": reply_reference,
				"reply_content": reply_content.replace(/[\n\r]/g, ''),
				"reply_yama": ""
			}

			return reply_misc;
		},
		divAroundHTML: function(floor_id, misc){
			$("#"+floor_id).append(misc.prev());
			$("#"+floor_id).append(misc);
		}
	}
}




















