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
 $(window).resize(function(){
 	liwu.rightPanel.getToolbarHeight();
 	$(".clr").height(liwu.rightPanel.toolbar_height);
 });
 
 
 
 var liwu = {
	global: {
		init: function(){
			if ( this.checkIsCorrectPanel("发新帖") ){
				liwu.addNewTopic.init();
			} else if ( this.checkIsCorrectPanel("right.css") ){
				liwu.rightPanel.init();
			}
		},
		wysiwygSetting:{
			css: chrome.extension.getURL("css/editor.css"),
				rmUnusedControls: true,
				initialContent: "",
				autoGrow: true, 
				maxHeight: 600,
				iFrameClass: "wysiwyg-input",
				autoSave: true,
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
		},
		checkIsCorrectPanel: function(regright){
			var is_correct = false;
			if( document.body.innerHTML.indexOf(regright) != -1 ){
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
		},
		makeButton: function(type, name, placeholder, default_value, arr_select, size){
			var html = '<li>';
			var is_checked = "";
			switch ( type ){
				case "button":
					html += '<input type="button" value="'+default_value+'" name="'+name+'" />';
					break;
				case "text":
					html += '<input type="text" value="'+default_value+'" name="'+name+'" placeholder="'+placeholder+'" size="'+size+'" />';
					break;
				case "checkbox":
					if ( localStorage.getItem(name) == 1 ){
						is_checked = 'checked="checked"';
					}
					html += '<input type="checkbox" name="'+name+'" id="'+name+'" '+is_checked+' /><label for="'+name+'">'+default_value+'</label>';
					break;
				case "radio":
					
					if ( arr_select ){
						html += '<div class="radio">';
						$.each(arr_select, function(idx, value){
							if ( idx == 0){
								is_checked = 'checked="checked"';
							}else{
								is_checked = '';
							}
							html += '<input type="radio" name="'+name+'" id="'+name+idx+'" '+is_checked+' value="'+value.value+'" /><label for="'+name+idx+'">'+value.name+'</label>';
						});
						html += '</div>';
					}
					break;
				case "select":
					if ( arr_select ){
						html += '<select name="'+name+'">';
						if ( default_value ){
							html += '<option value="0">'+default_value+'</option>';
						}
						$.each(arr_select, function(){
							html += '<option value="'+this.value+'">'+this.name+'</option>';
						});
						html += '</select>';
					}
					break;
			}
			html += '</li>';
			return html;
		},
		dealTime: function(timestr){ //处理时间,参考了油猴脚本
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
	},
	addNewTopic:{
		init: function(){
			$("textarea[name=neirong]").wysiwyg(liwu.global.wysiwygSetting);
		}
	},
	rightPanel: {
		topic: {},
		orgstr: "",
		toolbar_height: 0,
		no_parse: 0,
		init: function(){
			this.orgstr = document.body.innerHTML;
			var start_time = 0;
			console.log("==== Right Panel Loading... ====");
			this.checkDefaultValue();
			start_time = new Date();
			this.parseTopic();
			//console.log(this.topic);
			console.log("==== Data Init "+(( new Date() - start_time)/1000)+" seconds ====");
			// add toolbar div tag before topic title
			$("title").after('<div class="clr">&nbsp;</div>');
			this.addToolBar();
			//get toolbar height for offset the scroll function
			this.getToolbarHeight();
			$(".clr").height(liwu.rightPanel.toolbar_height);
			
			// add action
			this.addButtonAction();
			
			// add wysiwyg
			$("textarea[name=neirong2], textarea[name=neirongy]").wysiwyg(liwu.global.wysiwygSetting);
		},
		getToolbarHeight: function(){
			//check toolbar height
			this.toolbar_height = $("#toolbar").height();
		},
		
		regex: {
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
			reg_misc_reference  : /引用(.+?)楼内容/i,
			reg_is_video		: /<embed.+? type=\"(.+?)\">/i,
			reg_video_link		: /<embed src=\"(.+?)\" allowfullscreen=/i
		},
		checkDefaultValue: function(){
			if ( localStorage.getItem("anonymous_reply") == 1 ){
				$("input[name=nimin]").prop('checked', true);
			}
			liwu.rightPanel.no_parse = localStorage.getItem("restore_html");
		},
		addToolBar: function(){
			$("body").append('<div id="toolbar"></div>');
			var html = '';
			//only show LZ
			//var only_lz = "只看楼主";
			//jump to floor
			// only show author
			
			if ( liwu.rightPanel.no_parse == 0){
				var only_ta = "只看TA";
				var arr_select = this.getAuthorListWithReliesID();
				html += liwu.global.makeButton("select", "only_ta", "", only_ta, arr_select, "");
	
				
				// check total replies
				var total_replies = this.topic.replies.length;
				if ( total_replies > 0){
					total_replies -= 1;
					/*
					html += '<form id="frm_jump_to">';
					html += liwu.global.makeButton("text", "jump_num", total_replies, "", "", "2");
					html += liwu.global.makeButton("button", "jump_to", "", "跳", "", "");
					html += '</form>';
					*/
					//TODO: how to do this
					html += '<li><form id="frm_jump_to"><input type="text" name="jump_num" value="" placeholder="'+total_replies+'" size="2" /><input type="button" name="jump_to" value="跳" /></form></li>';
				}
				//folding topic
				var folding_topic_content = "主楼折叠";
				html += liwu.global.makeButton("button", "folding_topic_content", "", folding_topic_content, "", "");
				
				//show timestamp
				var show_time = "时间标";
				html += liwu.global.makeButton("checkbox", "show_timestamp", "", show_time, "", "");
				
				//Order button
				arr_radio = [{"name": "顺排", "value": "ASC"}, {"name": "逆排", "value": "DESC"}];
				html += liwu.global.makeButton("radio", "replies_order", "", "", arr_radio, "");
			}

			//anonymous 
			var anonymous = "回帖匿名";
			html += liwu.global.makeButton("checkbox", "anonymous_reply", "", anonymous, "", "");
			
			//restore topic html
			var restore_html = "原帖还原";
			html += liwu.global.makeButton("checkbox", "restore_html", "", restore_html, "", "");
			
			$("#toolbar").append('<ul>'+html+'</ul>');
			// add button sytle
			$("#toolbar input[type=button],#toolbar input[type=checkbox]").button();
			$("#toolbar .radio").buttonset();
		},
		addButtonAction: function(){
			// jump
			$("input[name=jump_to]").click(function(){
				liwu.rightPanel.jumpfloor();
			});
			
			// keyboard enter
			$("#frm_jump_to").bind({
				submit: function(){
					liwu.rightPanel.jumpfloor();
					return false;
				}
			});
			// click input box and select all text
			$("input[name=jump_num]").click(function(){
				$(this).select();
			});
			// only show ta
			$("select[name=only_ta]").change(function(){
				var floors = $(this).val().split(",");
				liwu.rightPanel.showFloors(floors);
			});
			
			//folding topic content
			$("input[name=folding_topic_content]").click(function(){
				if ( $("#topic_content").is(":visible") ){
					$("#topic_content").after('<div class="click_show">主楼展开</div>').slideUp("fast");
					$(this).val("主楼展开");
					$(".click_show").on("click", function(){
						$(this).remove();
						$("#topic_content").slideDown("fast");
						$("input[name=folding_topic_content]").val("主楼折叠");
					});
				}else{
					$("#topic_content").slideDown("fast").next().remove();
					$(this).val("主楼折叠");
				}
			});
			
			//anonymous
			$("#anonymous_reply").change(function(){
				if ( $(this).is(":checked")) {
					localStorage.setItem("anonymous_reply", 1);
					$("input[name=nimin]").prop('checked', true);
				}else{
					localStorage.setItem("anonymous_reply", 0);
					$("input[name=nimin]").prop('checked', false);
				}
			});
			
			$("input[name=restore_html]").change(function(){
				if ( $(this).is(":checked")) {
					localStorage.setItem("restore_html", 1);
					
				}else{
					localStorage.setItem("restore_html", 0);
				}
				document.location.reload(true);
			});
			
			//order
			$("input[name=replies_order]").change(function(){
				// need animation
				$(".floor").each(function(idx, value){
					$(this).prependTo($("#jas"));
				});
				
				// animation version
				/*
				var arr_floors = new Array();
				var animate_time = 800;
				var total_floors = $(".floor").length;
				$(".floor").each(function(idx, value){
					arr_floors.push(value);
					$(value).delay( (animate_time / total_floors) * idx ).animate({"margin-left": "-99em"}, animate_time/total_floors );
				});
				$.each(arr_floors, function(){
					$(this).prependTo($("#jas"));
				});
				
				$.each(arr_floors, function(idx, value){
					$(value).delay( (animate_time / total_floors) * idx ).animate({"margin-left": "0px"}, animate_time/total_floors );
				});
				*/
				
				
				
			});
				
			
		},
		jumpfloor: function(){
			var jump_num 	= parseInt( $("input[name=jump_num]").val() );
			var max_num 	= parseInt( $("input[name=jump_num]").attr("placeholder").replace("<=","") );
			if ( jump_num > 0 && jump_num <= max_num ){
				var offsetheight = "-"+(parseInt(this.toolbar_height)+10);
				$.scrollTo( $("#floor_"+jump_num), 800, {"offset": parseInt(offsetheight) } );
			}else{
				alert("Please enter the number greater than 0 and smaller than "+max_num );
			}
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
		
		getAuthorListWithReliesID: function(){
			var authors_replies = new Array();
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
				authors_replies[idx] = {"name": author, "value": floors};
			})
			return authors_replies;
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
			var topic_content = liwu.global.dealReg(this.orgstr, this.regex.reg_topic_content);
			if ( liwu.rightPanel.no_parse == 0 ){
				// move topic content into div tag
				document.body.innerHTML = document.body.innerHTML.replace(topic_content, '<div id="topic_content">'+topic_content+'</div>');
			}
			
			this.topic = {
				"topic_title": $("title").next().text(),
				"topic_author": liwu.global.dealReg(this.orgstr, this.regex.reg_topic_author, 2),
				"topic_content": topic_content,
				"topic_time": liwu.global.dealReg(this.orgstr, this.regex.reg_topic_time),
				"reply_form": $("form[name=revert]").html(),
				"toolbar": liwu.global.dealReg(this.orgstr, this.regex.reg_toolbar, 1),
				"replies": this.parseReplies(),
				};
		},
		parseReplies: function(){
			var replies = new Array();
			var reply_misc = '';
			if ( liwu.rightPanel.no_parse == 0 ){
				$("a:has(span)").first().after('<div id="jas"></div>');
			}
			

			// get replies
			$.each($("p:contains('回复')"), function(){
				var reply_html = $(this).html();
				var reply_floor = liwu.global.dealReg( reply_html, liwu.rightPanel.regex.reg_reply_floor);
				if ( reply_floor > 0){
					// prepay container
					var floor_id = "floor_"+reply_floor;
					if ( liwu.rightPanel.no_parse == 0 ){
						$(this).before('<div class="floor" id="'+floor_id+'"></div>');
					}
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
						if ( liwu.rightPanel.no_parse == 0 ){
							$("#"+floor_id).append( $(this) );
						}
					}
					var reply_link = $(this).find("a").first().attr("href");
					
					var replay = {
						"reply_floor": reply_floor,
						"reply_content": reply_content,
						"reply_author": liwu.global.dealReg( reply_link, liwu.rightPanel.regex.reg_reply_author).replace("<b>", "").replace("</b>", ""),
						"reply_time": reply_time,
						"reply_reference": reply_reference,
						"reply_link": reply_link
					};
					replies[reply_floor] = replay;
					if ( liwu.rightPanel.no_parse == 0 ){
						$("#"+floor_id).appendTo( $("#jas") );
					}
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
					if ( liwu.rightPanel.no_parse == 0 ){
						this.divAroundHTML(floor_id, misc);
					}
					break;
				//reference
				case "FIELDSET":
					misc = $(reply).nextAll().slice(0, 5);
					reply_reference = liwu.global.dealReg( misc.html(), this.regex.reg_misc_reference);
					reply_content = misc.next().html();

					if ( liwu.rightPanel.no_parse == 0 ){
						this.divAroundHTML(floor_id, misc);
					}
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




















