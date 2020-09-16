(function(){
var ChannelBackend=function(user){
this.aq_=new AjaxQueue('/profile_ajax?action_ajax=1&user='+user+'&new=1',window.ajax_session_info);
};
ChannelBackend.prototype.call_box_method=function(box_info,params,method,callback,opt_logging){
var request=box_info;
request.method=method;
request.params=params;
var unpack_callback=function(response){callback(response.data)};
var logging='box_method='+method+'&box_name='+box_info.name+(opt_logging||'');
this.aq_.quick_send(request,'box_method',unpack_callback,logging);
};
ChannelBackend.singleton_=null;
ChannelBackend.get=function(){
if(!ChannelBackend.singleton_){
ChannelBackend.singleton_=new ChannelBackend(window.username);
}
return ChannelBackend.singleton_;
};
function get_box_info(box_id){
return window.boxes[box_id];
}
function get_page(box_id,start,num,view_all_mode,opt_sort,opt_query){
var box_info=get_box_info(box_id);
var backend=ChannelBackend.get();
var el=_gel(box_id+'-body');
draw_loading_div(el);
var params={'start':start,'num':num,'view_all_mode':view_all_mode};
if(opt_sort){
params.sort=opt_sort;
}
if(opt_query){
params.query=opt_query;
}
var callback=function(html){
channel_replace_div(el,html);
};
backend.call_box_method(box_info,params,'draw_page_internal',callback);
}
var subscribeAllTimer;
function subscribe_all(token){
if(isLoggedIn){
window.clearTimeout(subscribeAllTimer);
var callback=function(result){
var subscribeMsgNode=_gel('subscribeMessage');
subscribeMsgNode.innerHTML=yt.net.ajax.getNodeValue(yt.net.ajax.getRootNode(result),'html_content');
subscribeMsgNode.style.display='block';
subscribeAllTimer=window.setTimeout("_hidediv('subscribeMessage')",5000);
};
var usernames='';
var subscribeAllForm=_gel('subscribeAllForm');
for(var i=0;i<subscribeAllForm.length;++i){
if(subscribeAllForm.elements[i].checked){
usernames+=subscribeAllForm.elements[i].value+' ';
}
}
if(usernames.length>0){
var subscribeAllDiv=_gel('subscribeAllDiv');
subscribeAllDiv.style.display='none';
yt.net.ajax.sendRequest('/ajax_subscriptions?subscribe_to_users='+usernames,{postBody:'session_token='+token,onComplete:callback});
}
}else{
subscribeMsgNode=_gel('subscribeLoginInvite');
subscribeMsgNode.style.display='block';
yt.analytics.urchinTracker('/Events/VideoWatch/Subscription/'+username+'/Loggedout');
}
}
function delete_feed_item(box_id,xp,at,pi,tu){
var delete_callback=function(response){
if(response&&response.success){
channel_replace_div(_gel(box_id+'-body'),response.html);
_show_success_or_error_message('feed_success','feed_success_custom',response.message);
}else{
_show_target_and_hide_spinny('feed_table','feed_loading');
_show_success_or_error_message('feed_error','feed_error_custom',response.message);
}
};
return _edit_feed_item(box_id,xp,at,pi,tu,'delete',delete_callback);
}
function undelete_feed_item(box_id,xp,at,pi,tu){
var undelete_callback=function(response){
if(response&&response.success){
channel_replace_div(_gel(box_id+'-body'),response.html);
}else{
_show_target_and_hide_spinny('feed_table','feed_loading');
_show_success_or_error_message('feed_error','feed_error_custom',response.message);
}
};
return _edit_feed_item(box_id,xp,at,pi,tu,'undelete',undelete_callback);
}
function _edit_feed_item(box_id,xp,at,pi,tu,action,callback){
var box_info=get_box_info(box_id);
box_info.x_position=xp;
var backend=ChannelBackend.get();
_hide_target_and_show_spinny('feed_table','feed_loading');
_hidediv('feed_success');
_hidediv('feed_success_custom');
_hidediv('feed_error');
_hidediv('feed_error_custom');
backend.call_box_method(box_info,{'at':at,'pi':pi,'tu':tu,'action':action},
'edit_feed_item',callback);
return false;
}
function post_feed_bulletin_handler(box_id,opt_callback){
if(_gel(box_id)){
return function(response){
if(response&&response.success){
channel_replace_div(_gel(box_id+'-body'),response.html);
_show_success_or_error_message('feed_success','feed_success_custom',response.message);
}else if(response){
_show_target_and_hide_spinny('feed_table','feed_loading');
_show_success_or_error_message('feed_error','feed_error_custom',response.message);
}else{
_show_target_and_hide_spinny('feed_table','feed_loading');
_show_success_or_error_message('feed_error');
}
if(opt_callback){
opt_callback(response);
}
};
}else{
return opt_callback;
}
}
function post_feed_bulletin(box_id,form,opt_callback){
var box_info={'name':box_id,'x_position':0,'do_not_render':true};
if(_gel(box_id)){
box_info=get_box_info(box_id);
_hide_target_and_show_spinny('feed_table','feed_loading');
_hidediv('feed_success');
_hidediv('feed_success_custom');
_hidediv('feed_error');
_hidediv('feed_error_custom');
}
var video_url=form.bulletin_video_input.value;
if(video_url==form.bulletin_video_default.value){
video_url='';
}
var params={
'bulletin':form.bulletin_input.value,
'video_url':video_url
};
ChannelBackend.get().call_box_method(box_info,params,'post_feed_bulletin',
post_feed_bulletin_handler(box_id,opt_callback));
return false;
}
function preview_feed_bulletin(url,opt_callback){
var box_info={'name':'user_recent_activity','x_position':0};
var params={'video_url':url};
ChannelBackend.get().call_box_method(box_info,params,'preview_feed_bulletin',opt_callback);
}
var deactive_bulletin_promo_called=false;
function deactive_bulletin_promo(){
if(!deactive_bulletin_promo_called&&_gel('bulletin_promo_message')){
ChannelBackend.get().aq_.send_message({},'deactive_bulletin_promo',true);
deactive_bulletin_promo_called=true;
}
}
function feed_bulletin_onblur(input_id,default_id,opt_force_reset){
var form=_gel('feed_bulletin').getElementsByTagName('form')[0];
if(form[input_id].value==''||opt_force_reset){
form[input_id].value=form[default_id].value;
}
}
function feed_bulletin_onfocus(input_id,default_id){
var form=_gel('feed_bulletin').getElementsByTagName('form')[0];
if(form[input_id].value==form[default_id].value){
form[input_id].value='';
}
_gel('post_button_input').disabled=false;
_gel('other_post_button_input').disabled=false;
}
function reset_feed_bulletin_attachment(input_id,input_row_id,attach_link_id,default_id){
_showdiv(attach_link_id);
_hidediv(input_row_id);
var form=_gel('feed_bulletin').getElementsByTagName('form')[0];
form[input_id].value=form[default_id].value;
}
var deactivate_some_promo_already_called={};
function dismiss_and_deactivate_promo_simple(promo_name){
if(!(promo_name in deactivate_some_promo_already_called)){
ChannelBackend.get().aq_.send_message({},'deactivate_'+promo_name+'_promo',true);
deactivate_some_promo_already_called[promo_name]=true;
_removeclass(_gel('channel_tab_playnav'),'yt-uix-clickcard-target');
}
}
function init_livestreaming_tou(){
_gel('display_live_streaming').onclick=function(){
if(this.checked){
show_livestreaming_tou();
return false;
}else{
return true;
}
}
};
function show_livestreaming_tou(){
_hidediv('playnav-player');
yt.uix.Overlay.getInstance().showAction(_gel('live-promo-overlay'));
}
function livestreaming_tou_get_started(){
var cb=_gel('display_live_streaming');
if(!cb.checked){
cb.click();
}
}
function tou_checkbox_changed(cb){
goog.array.forEach(
goog.dom.getElementsByTagNameAndClass('button','tou-accept-button'),
function(btn){
if(cb.checked){
btn.removeAttribute('disabled');
}else{
btn.setAttribute('disabled','disabled');
}
});
}
function tou_accepted(){
var ls_checkbox=_gel('display_live_streaming');
ls_checkbox.checked=true;
yt.uix.Overlay.getInstance().hideAction(_gel('live-promo-overlay'));
if(goog.dom.getElementsByTagNameAndClass('div','yt-uix-helpcard-card-visible')){
yt.uix.ClickCard.getInstance().hide(_gel('channel_tab_playnav'));
}
_showdiv('playnav-player');
_gel('livestreaming-tou-accepted').value='True';
save_playnav_settings();
}
function hide_livestreaming_tou(){
yt.uix.Overlay.getInstance().hideAction(_gel('live-promo-overlay'));
_showdiv('playnav-player');
}
function _show_success_or_error_message(div_name,opt_custom_div_name,opt_custom_message){
if(opt_custom_div_name&&opt_custom_message){
var div=_gel(opt_custom_div_name);
div.innerHTML=opt_custom_message;
}else{
var div=_gel(div_name);
}
_showdiv(div);
var ani={
'delay':yt.animations.constants.CHANNEL_FADE_DELAY
};
yt.animations.fadeAndSlideUp(div,ani);
}
function _show_target_and_hide_spinny(target_name,spinny_name){
var target=_gel(target_name);
var spinny=_gel(spinny_name);
_showdiv(target);
target.style.display='';
_hidediv(spinny);
}
function _hide_target_and_show_spinny(target_name,spinny_name){
var target=_gel(target_name);
var spinny=_gel(spinny_name);
var original_height=target.parentNode.offsetHeight;
_showdiv(spinny);
_showdiv(target);
target.style.display='';
spinny.style.paddingTop='0px';
spinny.style.paddingBottom='0px';
var spinny_padding=Math.ceil((original_height-spinny.offsetHeight)/ 2)+'px';
spinny.style.paddingTop=spinny_padding;
spinny.style.paddingBottom=spinny_padding;
_hidediv(target);
}
function draw_loading_div(el){
var loading_div=document.createElement('div');
loading_div.className='box-bg box-fg inner-box loading-div';
loading_div.innerHTML="<table cellspacing=0 cellpadding=0 width='"+el.offsetWidth+"' height='"+el.offsetHeight+"'><tr><td align=center valign=middle><img src='http://s.ytimg.com/yt/img/icn_loading_animated-vflff1Mjj.gif'></td></tr></table>";
if(navigator.userAgent.indexOf('MSIE 6')!=-1){
el.innerHTML="<div style='display:none'>"+el.innerHTML+'</div>';
}
el.appendChild(loading_div);
}
function encode_checkbox_values(form){
var checked_ids=[];
var form_size=form.elements.length;
for(i=0;i<form_size;i++){
element=form[i];
if(element.checked){
checked_ids.push(element.value);
}
}
return{'item_ids':checked_ids};
}
function approve_comments(box_id,form,view_all_mode){
var box_info=get_box_info(box_id);
var backend=ChannelBackend.get();
var callback=function(json_resp){
if(json_resp.success){
channel_replace_div(_gel(box_id),json_resp.html);
}
};
var params=encode_checkbox_values(form);
params['view_all_mode']=view_all_mode;
backend.call_box_method(box_info,params,'approve_comments',callback);
}
function approve_comment(box_id,comment_id){
var box_info=get_box_info(box_id);
var backend=ChannelBackend.get();
var callback=function(json_resp){
if(json_resp.success){
channel_replace_div(_gel(box_id),json_resp.html);
}
};
var params={'item_ids':[comment_id]};
params['view_all_mode']='False';
backend.call_box_method(box_info,params,'approve_comments',callback);
}
function remove_comment(box_id,comment_id){
var box_info=get_box_info(box_id);
var backend=ChannelBackend.get();
var callback=function(json_resp){
if(json_resp.success){
goog.dom.removeNode(goog.dom.getAncestorByTagNameAndClass(_gel('profile-comment-'+comment_id),'TR','commentsTableFull'));
}else if(json_resp.errors){
display_error_alert('user_comments-messages',json_resp['errors']);
}
};
var params={'item_ids':[comment_id]};
params['view_all_mode']='False';
backend.call_box_method(box_info,params,'remove_comments',callback);
}
function add_comment(box_id,comment,view_all_mode,items_per_page,opt_challenge,opt_response){
var comment_entry_submit_button=_gel('comment_entry_submit_button');
var box_info=get_box_info(box_id);
var backend=ChannelBackend.get();
var table=_gel('profile_comments_table');
var div_containing_table=table.parentNode;
var box_div=div_containing_table.parentNode;
var comment_entry_box=_gel('comment_entry_box');
var callback=function(json_response){
if(json_response['success']){
comment_entry_submit_button.disabled=false;
document.body.scrollTop=goog.style.getPageOffsetTop(box_div.parentNode);
_gel('add_comment_link').style.display='block';
comment_entry_box.style.display='none';
no_comments_message=_gel('user-comments-no-comments-message');
if(no_comments_message){
goog.dom.removeNode(no_comments_message);
}
if(!json_response['moderate']&&table.rows.length==items_per_page){
table.deleteRow(table.rows.length-1);
}
var new_row=document.createElement('div');
new_row.innerHTML=json_response['new_row'];
div_containing_table.insertBefore(new_row,table);
var height=new_row.offsetHeight||new_row.clientHeight;
new_row.style.overflow='hidden';
var ani={
'delay':'0.75s',
'duration':'0.5s',
'start':'0',
'end':height+'px'
};
yt.animations.animateStyle(new_row,'height',ani);
}else{
if(json_response['errors']){
display_error_alert('user_comments-messages',json_response['errors']);
}
if(json_response['captcha_required']){
comment_entry_box.innerHTML=json_response['captcha_html'];
_gel('comment').value=comment;
_gel('view_all_mode').value=view_all_mode;
_gel('items_per_page').value=items_per_page;
}else{
get_page(box_id,0,items_per_page,view_all_mode);
}
}
};
if(comment){
comment_entry_submit_button.disabled=true;
comment_entry_submit_button.value=yt.getMsg('POSTING_COMMENT');
var params={'comment':comment,'view_all_mode':view_all_mode};
if(opt_challenge){
params['challenge']=opt_challenge;
params['response']=opt_response;
}
backend.call_box_method(box_info,params,'add_comment',callback);
}
}
function report_spam(box_id,encrypted_comment_id){
var box_info=get_box_info(box_id);
var backend=ChannelBackend.get();
var callback=function(json_response){
if(json_response['success']){
_gel(encrypted_comment_id+'-mark_spam_link').style.display='none';
_gel(encrypted_comment_id+'-marked_as_spam_text').style.display='inline';
}else{
if(json_response['errors']){
alert(json_response['errors']);
}
}
};
if(encrypted_comment_id){
backend.call_box_method(box_info,{'encrypted_comment_id':encrypted_comment_id},'report_spam',callback);
}else{
callback({'success':true});
}
}
function display_alert(id,type,message){
var message_box=goog.dom.getElement(id);
if(!message_box){
message_box=goog.dom.getElement('global-messages');
}
var template=goog.dom.getElement(type+'-template');
if(!template){
template=goog.dom.getElement('info-template');
}
var alert_box=template.cloneNode(true);
alert_box.id='';
var message_container=goog.dom.getElementsByTagNameAndClass('div','yt-alert-content',alert_box)[0];
message_container.innerHTML=message;
message_box.innerHTML='';
message_box.appendChild(alert_box);
message_box.style.display='';
message_box.style.opacity='';
goog.dom.classes.remove(message_box,'hid');
goog.dom.classes.remove(message_box,'yt-ani-fade-zero');
goog.dom.classes.remove(message_box,'yt-ani-slide-zero');
var ani={
'delay':yt.animations.constants.CHANNEL_FADE_DELAY
};
yt.animations.fadeAndSlideUp(message_box,ani);
}
function display_success_alert(id,message){
display_alert(id,'success',message);
}
function display_error_alert(id,message){
display_alert(id,'error',message);
}
function add_friend(username){
var box_info=get_box_info('user_profile');
var backend=ChannelBackend.get();
var callback=function(json_resp){
if(json_resp.requested){
display_success_alert('user_profile-messages',json_resp.message);
_showdiv('aProfileInvitedFriend');
_hidediv('aProfileAddFriend');
}else if(json_resp.success){
display_success_alert('user_profile-messages',json_resp.message);
_showdiv('aProfileRemoveFriend');
_hidediv('aProfileAddFriend');
}else{
display_error_alert('user_profile-messages',json_resp.message||json_resp.errors);
}
};
params={'username':username};
backend.call_box_method(box_info,params,'add_friend',callback);
}
function remove_friend(username){
var box_info=get_box_info('user_profile');
var backend=ChannelBackend.get();
var callback=function(json_resp){
if(json_resp.success){
display_success_alert('user_profile-messages',json_resp.message);
_showdiv('aProfileAddFriend');
_hidediv('aProfileRemoveFriend');
}else{
display_error_alert('user_profile-messages',json_resp.message||json_resp.errors);
}
};
params={'username':username};
backend.call_box_method(box_info,params,'remove_friend',callback);
}
function setup_gadget(box_id,container_url,metadata,width,height,show_title,prefs){
var url=metadata.url
var loader=function(){
var preloadData={};
preloadData[url]=metadata;
window.gadgetContainer.service_.addGadgetMetadatas(preloadData);
window.gadgetContainer.addPreloadGadgets_(preloadData);
var gadgetDiv=_gel(box_id+'-container');
var gadgetSite=window.gadgetContainer.newGadgetSite(gadgetDiv);
var renderP={'width':width,'height':height};
window.gadgetContainer.navigateGadget(gadgetSite,url,{},renderP,function(){
var id=gadgetSite.getActiveGadgetHolder().getIframeId();
window.gadgetContext[id]={
'box_id':box_id,
'url':url,
'prefs':prefs
};
if(goog.userAgent.IE){
document.getElementById(id).setAttribute('allowTransparency','true');
}
gadgetDiv.style.height="";
if(show_title){
_gel(box_id+"-title").innerHTML=gadgets.util.escape(gadgetSite.getActiveGadgetHolder().getGadgetInfo().modulePrefs.title);
}
});
};
if(window.containerJsLoadingCallbacks){
if(window.gadgetContainer){
loader();
}else{
window.containerJsLoadingCallbacks.push(loader);
}
}else{
window.containerJsLoadingCallbacks=[loader];
var rpcs={
'yt.storePrefs':function(new_prefs){
var self=this;
ChannelBackend.get().call_box_method(get_box_info(self.box_id),new_prefs,'set_gadget_prefs',function(json_resp){
if(!json_resp.success){
display_error_alert(self.box_id+'-messages',json_resp.message);
}else{
self.prefs=new_prefs;
}
});
},
'yt.loadPrefs':function(){
var self=this;
return self.prefs;
},
'yt.redirect':function(url){
var self=this;
window.location.href=yt.uri.appendQueryData('/redirect?',{
'q':url,
'event':'channel_gadget',
'gadget':self.url,
'channel':window.username,
'session_token':yt.getConfig('XSRF_REDIRECT_TOKEN')
});
}
};
var rpc_wrapper=function(name){
return function(arg){
var self=this;
var result;
if(gadgetContext[self.f]){
result=rpcs[name].call(gadgetContext[self.f],arg);
if(self.callback){
self.callback(result);
}
}else{
window.setTimeout(function(){
rpc_wrapper(name).call(self,arg);
},200);
}
};
};
var callback=function(){
window.__API_URI=shindig.uri(container_url);
window.__CONTAINER=window.__API_URI.getQP('container');
window.gadgetContainer=new google.container.Container({'apiPath':"/api/gadgets/api/rpc_cs",'renderCajole':true});
window.gadgetContext=new Object();
for(name in rpcs){
gadgets.rpc.register(name,rpc_wrapper(name));
}
while(window.containerJsLoadingCallbacks.length>0){
window.containerJsLoadingCallbacks.pop()();
}
};
yt.net.scriptloader.load(container_url,callback);
}
}
window.get_page=get_page;
window.draw_loading_div=draw_loading_div;
window.approve_comments=approve_comments;
window.approve_comment=approve_comment;
window.remove_comment=remove_comment;
window.add_comment=add_comment;
window.report_spam=report_spam;
window.subscribe_all=subscribe_all;
window.delete_feed_item=delete_feed_item;
window.feed_bulletin_onblur=feed_bulletin_onblur;
window.feed_bulletin_onfocus=feed_bulletin_onfocus;
window.post_feed_bulletin=post_feed_bulletin;
window.preview_feed_bulletin=preview_feed_bulletin;
window.deactive_bulletin_promo=deactive_bulletin_promo;
window.reset_feed_bulletin_attachment=reset_feed_bulletin_attachment;
window.dismiss_and_deactivate_promo_simple=dismiss_and_deactivate_promo_simple;
window.show_livestreaming_tou=show_livestreaming_tou;
window.hide_livestreaming_tou=hide_livestreaming_tou;
window.tou_checkbox_changed=tou_checkbox_changed;
window.tou_accepted=tou_accepted;
window.livestreaming_tou_get_started=livestreaming_tou_get_started;
window.init_livestreaming_tou=init_livestreaming_tou;
window.get_channel_backend=ChannelBackend.get;
window.get_channel_box_info=get_box_info;
window.display_alert=display_alert;
window.display_success_alert=display_success_alert;
window.display_error_alert=display_error_alert;
window.add_friend=add_friend;
window.remove_friend=remove_friend;
window.setup_gadget=setup_gadget;
})();
function replace_div(el,new_html){
if(el.outerHTML){
el.outerHTML=new_html;
return el;
}
var next_sibling=el.nextSibling;
var parent_node=el.parentNode;
parent_node.removeChild(el);
var replacement=document.createElement('div');
replacement.innerHTML=new_html;
var node=null;
if(replacement.firstChild){
node=replacement.firstChild;
if(next_sibling){
parent_node.insertBefore(node,next_sibling);
}else{
parent_node.appendChild(node);
}
}
return node;
}
function channel_replace_div(el,new_html){
if(window.channel_new_ui&&el.id.match(/-body$/)){
el.innerHTML=new_html;
}else{
replace_div(el,new_html);
}
run_scripts_in_el(el.id);
}
function safeGetElementsByTagName(el,name){
name=name.toLowerCase();
if(el.getElementsByTagName){
return el.getElementsByTagName(name);
}
var childNodes=el.childNodes;
output=new Array();
for(var i=0;i<childNodes.length;i++){
var child=childNodes[i];
if(child.tagName&&child.tagName.toLowerCase()==name){
output.push(child);
}else if(child.childNodes){
output=output.concat(safeGetElementsByTagName(child,name));
}
}
return output;
}
function run_scripts_in_el(el){
el=_gel(el);
var scripts=safeGetElementsByTagName(el,'script');
for(var i=0;i<scripts.length;i++){
window.script_executed=false;
var script_content=scripts[i].innerHTML+';\nwindow.script_executed=true;';
var new_script=document.createElement('script');
new_script.type='text/javascript';
new_script.text=script_content;
document.getElementsByTagName('head')[0].appendChild(new_script);
if(!window.script_executed){
eval(script_content);
}
}
var styles=safeGetElementsByTagName(el,'style');
for(var i=0;i<styles.length;i++){
document.getElementsByTagName('head')[0].appendChild(styles[i]);
}
}
function simpleCallback(xhr,callback,domEl){
if(xhr.responseXML==null){
callback(yt.getMsg('ERROR_WHILE_PROCESSING'),domEl);
return;
}
var root_node=yt.net.ajax.getRootNode(xhr);
var return_code=yt.net.ajax.getNodeValue(root_node,'return_code');
if(return_code==0){
var success_message=yt.net.ajax.getNodeValue(root_node,'success_message');
if(success_message!=null){
callback(success_message,domEl);
}
}else{
var error_msg=yt.net.ajax.getNodeValue(root_node,'error_message');
if(error_msg==null||error_msg.length==0){
error_msg=yt.getMsg('UNKOWN_ERROR');
}
callback(error_msg,domEl);
}
redirect_val=yt.net.ajax.getNodeValue(root_node,'redirect_on_success');
if(redirect_val!=null){
window.location=redirect_val;
}
}
function postSimpleXR(url,data,callback,domEl){
yt.net.ajax.sendRequest(url,{
postBody:data,
onComplete:function(xmlHttpReq){
simpleCallback(xmlHttpReq,callback,domEl);
}
});
}
function showConfMsg(msg,domEl){
if(domEl&&domEl.parentNode){
domEl.parentNode.style.backgroundColor='#fff';
domEl.parentNode.innerHTML=msg;
}
}
function displayAndSelectEmbedCode(){
_gel('embed_input_div').style.display='';
_gel('embed_display').style.display='none';
_gel('embed_input').focus();
_gel('embed_input').select();
}
function handleSubscribe(){
var subscribe_buttons=goog.dom.getElementsByTagNameAndClass('div','subscribe-div',_gel('channel-body'));
var unsubscribe_buttons=goog.dom.getElementsByTagNameAndClass('div','unsubscribe-div',_gel('channel-body'));
for(var i=0;i<subscribe_buttons.length;++i){
yt.style.toggle(subscribe_buttons[i]);
}
for(var i=0;i<unsubscribe_buttons.length;++i){
yt.style.toggle(unsubscribe_buttons[i]);
}
}
(function(){
var current_channel_edit_tab=null;
var current_theme_name_backup=null;
var current_tab_modified=false;
function channel_edit_tab(tab_name,opt_cancel){
if(!window.scripts_are_loaded){
return false;
}
var current_tab_contents=_gel('tab_contents_'+current_channel_edit_tab);
if(current_tab_contents){
if(current_tab_modified){
if(!opt_cancel&&!confirm(yt.getMsg('CONFIRM_NAVIGATE_AWAY')+'\n\n'+yt.getMsg('CONFIRM_UNSAVED_CHANGES'))){
return;
}
}
if(current_channel_edit_tab=='colors'){
window.theme_map=copy_object(theme_obj_backups);
if(current_theme_name_backup){
set_theme_obj(current_theme_name_backup);
}
if(current_tab_modified){
current_tab_modified=false;
}
if(current_theme_name_backup)window.current_theme_name=current_theme_name_backup;
}
if(current_tab_modified){
current_tab_contents.innerHTML=current_tab_contents.__backup;
current_tab_modified=false;
}
if(current_channel_edit_tab=='bulletin'){
deactive_bulletin_promo();
}
if(current_channel_edit_tab=='layout'){
var layout_status=get_layout_status(_gel('channel_layout'));
for(var box_name in layout_status){
if(layout_status[box_name]){
if(!_gel(box_name)){
add_box(box_name);
}
}else{
if(_gel(box_name)){
remove_box(box_name);
}
}
}
}
current_subtab_modified=false;
current_tab_contents.style.display='none';
}
if(current_channel_edit_tab){
_removeclass(_gel('channel_tab_'+current_channel_edit_tab),'channel_settings_tab_active');
}
if(current_channel_edit_tab==tab_name||tab_name=='close'){
current_channel_edit_tab=null;
_gel('channel_edit_close').style.display='none';
return;
}
var tab_contents=_gel('tab_contents_'+tab_name);
if(tab_contents){
tab_contents.style.display='';
tab_contents.__backup=tab_contents.innerHTML;
}
if(tab_name){
_addclass(_gel('channel_tab_'+tab_name),'channel_settings_tab_active');
if(tab_name=='branding_options'){
branding_options_subtab('banners');
}
}
force_IE_redraw();
current_channel_edit_tab=tab_name;
_gel('channel_edit_close').style.display='';
return true;
}
window.channel_edit_tab=channel_edit_tab;
var current_subtab_name;
var current_subtab_modified=false;
function branding_options_subtab(subtab_name,opt_cancel){
if(!window.scripts_are_loaded){
return false;
}
var current_subtab_contents=_gel('subtab_contents_'+current_subtab_name);
if(current_subtab_contents){
if(current_subtab_modified){
if(!opt_cancel&&!confirm(yt.getMsg('CONFIRM_NAVIGATE_AWAY')+'\n\n'+yt.getMsg('CONFIRM_UNSAVED_CHANGES'))){
return;
}
}
current_subtab_contents.style.display='none';
_removeclass(_gel('branding_options_subtab_'+current_subtab_name),'branding_options_subtab_active');
current_tab_modified=false;
current_subtab_modified=false;
}
var subtab_contents=_gel('subtab_contents_'+subtab_name);
if(subtab_contents){
subtab_contents.style.display='';
_addclass(_gel('branding_options_subtab_'+subtab_name),'branding_options_subtab_active');
}
current_subtab_name=subtab_name;
}
window.branding_options_subtab=branding_options_subtab;
function force_IE_redraw(){
window.setTimeout(function(){
_addclass(_gel('channel-body'),'dummy');
_removeclass(_gel('channel-body'),'dummy');
},0);
}
var stylesheet=null;
function update_theme_css(name,value,opt_prefix){
current_tab_modified=true;
get_theme_css();
}
function hide_all_children(el){
var child_nodes=el.childNodes;
for(var i=0;i<child_nodes.length;i++){
var node=child_nodes[i];
if(node&&node.style){
node.style.display='none';
}
}
}
var last_option_div=null;
function set_theme_obj(theme_name,opt_first_time){
if(window.deleting_theme){return;}
if(window.current_theme_name){
var t=[_gel('delete_'+window.current_theme_name),_gel('delete_'+theme_name)];
if(t[0]){t[0].style.display='inline';}
if(t[1]){t[1].style.display='none';}
}
var theme_obj=window.theme_map[theme_name];
window.current_theme_obj=theme_obj;
if(window.current_theme_name&&_gel(window.current_theme_name)){
_removeclass(_gel(window.current_theme_name),'theme_selected');
}
_addclass(_gel(theme_name),'theme_selected');
window.current_theme_name=theme_name;
update_theme_inputs(theme_obj);
current_palette=theme_obj.palettes['default'];
_gel('theme_display_name').innerHTML=htmlEscape(theme_obj.display_name||theme_name);
_gel('theme_edit_name').value=theme_obj.display_name||theme_name;
if(theme_obj.builtin){
_gel('theme_display_name').style.display='inline';
_gel('theme_edit_name').style.display='none';
}else{
_gel('theme_display_name').style.display='none';
_gel('theme_edit_name').style.display='inline';
try{
_gel('theme_edit_name').focus();
}catch(e){
}
}
if(!opt_first_time){
update_theme_css();
}
}
window.set_theme_obj=set_theme_obj;
function setDropdownTo(dropdownId,value,isLowerCaseCompare){
var dropdownEl=_gel(dropdownId);
if(isLowerCaseCompare){
value=value.toLowerCase();
}
for(var i=0,len=dropdownEl.length;i<len;i++){
var optionValue=dropdownEl.options[i].value;
if(isLowerCaseCompare)optionValue=optionValue.toLowerCase();
if(optionValue&&value==optionValue){
dropdownEl.selectedIndex=i;
break;
}
}
}
function update_theme_inputs(theme_obj){
setDropdownTo('font',theme_obj.font,true);
setDropdownTo('wrapper_opacity',theme_obj.wrapper_opacity);
var colors=['background_color','wrapper_color','wrapper_text_color','wrapper_link_color'];
for(var i=0;i<colors.length;i++){
var color=colors[i];
var value=theme_obj[color];
_gel(color+'-preview').style.backgroundColor=value;
_gel(color).value=value;
}
_gel('background_image').value=theme_obj['background_image'];
try{
if(theme_obj['background_image']){
window.frames['background_frame'].hide_file_picker();
}else{
window.frames['background_frame'].show_file_picker();
}
}catch(e){
}
_gel('background_repeat').value=theme_obj['background_repeat'];
_gel('background_repeat_check').checked=theme_obj['background_repeat']=='repeat';
set_palette('default',false);
}
function set_palette(name,opt_set_css){
var palette=window.current_theme_obj.palettes[name];
current_palette=palette;
setDropdownTo('box_opacity',palette.box_opacity);
var colors=['box_background_color','link_color','title_text_color','body_text_color'];
for(var i=0;i<colors.length;i++){
var color=colors[i];
_gel(color+'-preview').style.backgroundColor=palette[color];
_gel(color).value=palette[color];
if(opt_set_css){
update_theme_css(color,palette[color]);
}
}
}
window.set_palette=set_palette;
function open_theme_editor(){
_showdiv('theme_advanced_editor');
_showdiv('theme_edit_link_hide');
_hidediv('theme_edit_link');
force_IE_redraw();
}
window.open_theme_editor=open_theme_editor;
function delete_theme(theme_name){
if(window.current_theme_name==theme_name){
return;
}
var textdiv=_gel('are_you_sure_you_want_to_delete_text');
if(textdiv){
if(!confirm(textdiv.innerHTML)){
return;
}
window.deleting_theme=true;
request=[theme_name];
var backend=get_channel_backend();
_addclass(_gel('tab_contents_colors'),'saving');
backend.aq_.quick_send(request,'delete_theme',delete_theme_handler);
}
}
window.delete_theme=delete_theme;
window.deleting_theme=false;
function delete_theme_handler(response){
var theme_name=null;
var tdiv=null;
if(response&&response.success){
for(var i=0;i<response.deleted.length;i++){
theme_name=response.deleted[i];
delete window.theme_map[theme_name];
tdiv=_gel(theme_name);
tdiv.parentNode.removeChild(tdiv);
}
}
window.deleting_theme=false;
_removeclass(_gel('tab_contents_colors'),'saving');
}
window.delete_theme_handler=delete_theme_handler;
function hide_theme_editor(){
_hidediv('theme_advanced_editor');
_hidediv('theme_edit_link_hide');
_showdiv('theme_edit_link');
force_IE_redraw();
}
window.hide_theme_editor=hide_theme_editor;
var THEME_DIV_HTML="<div id=\"^theme_name^\" class='theme_selector_div' "+
'style=\"font-family:^font^\"'+
'onclick=\"set_theme_obj(this.id);\"'+
' ^delete_stuff^ '+
'><div style=\"background-color: ^background_color^;'+
'color:^body_text_color^;padding: 3px;line-height:120%\"'+
'><div style=\"background-color: ^wrapper_color^;color: ^wrapper_text_color^;padding:3px;font-size:10px\">'+
'<div class=\"floatR\" style=\"width:4em;background-color:^box_background_color^;font-size:9px;padding-left:1px;color:^body_text_color^\">'+
'<span style=\"color:^title_text_color^;font-size:120%\">'+
'A'+
'</span>'+
' &nbsp;<span style=\"color:^link_color^;text-decoration:underline\">url</span><br>'+
'abc</div>'+
'<span style=\"color:^wrapper_link_color^;text-decoration:underline\">url</span><br>'+
'abc'+
'</div></div>'+
'<div style=\"text-align:center;\"><span class=\"theme_title\" style=\"padding:2px;height:2em;overflow:hidden\">^theme_display_name^</span><br>'+
"<a href=\"#\" class=\"hLink\" onclick=\"delete_theme('^theme_name^');return false;\""+
'style=\"font-size:75%;visibility:hidden\" id=\"delete_^theme_name^\">^delete_text^</a></div>'+
'</div>\n';
var THEME_DIV_DELETE="onmouseover=\"_gel('delete_^theme_name^').style.visibility='visible';\" "+
"onmouseout=\"_gel('delete_^theme_name^').style.visibility='hidden';\"";
function get_default_palette(theme_obj){
var default_palette=theme_obj.palettes['default'];
default_palette.name='default';
return default_palette;
}
function generate_theme_box_html(theme_name,theme_obj){
if(!theme_obj||!theme_obj.palettes){
return;
}
var output_html=THEME_DIV_HTML;
if(theme_obj.builtin){
output_html=output_html.replace(/\^delete_stuff\^/g,'');
}else{
output_html=output_html.replace(/\^delete_stuff\^/g,THEME_DIV_DELETE);
}
output_html=output_html.replace(/\^theme_name\^/g,theme_name);
output_html=output_html.replace(/\^background_color\^/g,theme_obj.background_color);
output_html=output_html.replace(/\^wrapper_color\^/g,theme_obj.wrapper_color);
output_html=output_html.replace(/\^wrapper_text_color\^/g,theme_obj.wrapper_text_color);
output_html=output_html.replace(/\^wrapper_link_color\^/g,theme_obj.wrapper_link_color);
output_html=output_html.replace(/\^theme_display_name\^/g,htmlEscape(theme_obj.display_name));
output_html=output_html.replace(/\^font\^/g,theme_obj.font);
var default_palette=get_default_palette(theme_obj);
output_html=output_html.replace(/\^box_background_color\^/g,default_palette.box_background_color);
output_html=output_html.replace(/\^title_text_color\^/g,default_palette.title_text_color);
output_html=output_html.replace(/\^link_color\^/g,default_palette.link_color);
output_html=output_html.replace(/\^body_text_color\^/g,default_palette.body_text_color);
output_html=output_html.replace(/\^delete_text\^/g,_gel('delete_link_text').innerHTML);
return output_html;
}
function add_theme_div(theme_name,theme_obj){
var output_html=generate_theme_box_html(theme_name,theme_obj);
var temp_div=document.createElement('div');
temp_div.innerHTML=output_html;
_gel('theme_container').appendChild(temp_div.firstChild);
}
window.add_theme_div=add_theme_div;
var current_palette;
function edit_main_theme(name,value,opt_skip_css){
var theme_name=window.current_theme_name;
var theme_obj=window.current_theme_obj;
if(theme_obj.builtin){
create_new_theme();
return edit_main_theme(name,value);
}
if(typeof theme_obj[name]!='undefined'){
theme_obj[name]=value;
if(!opt_skip_css){
update_theme_css(name,value);
}
}else{
current_palette[name]=value;
var prefix=current_palette.name=='default'?null:'.palette-'+current_palette.name;
if(!opt_skip_css){
update_theme_css(name,value,prefix);
}
}
replace_div(_gel(theme_name),generate_theme_box_html(theme_name,theme_obj,true));
_addclass(_gel(theme_name),'theme_selected');
}
window.edit_main_theme=edit_main_theme;
var theme_obj_backups={};
function add_theme_selectors(default_theme_name,theme_ordering){
for(var i in theme_ordering){
var theme_name=theme_ordering[i];
var theme_obj=window.theme_map[theme_name];
if(theme_obj){
add_theme_div(theme_name,theme_obj);
theme_obj_backups[theme_name]=copy_object(theme_obj);
}
}
current_theme_name_backup=default_theme_name;
set_theme_obj(default_theme_name,true);
}
window.add_theme_selectors=add_theme_selectors;
function generate_theme_name(old_name){
var numeric_suffix=old_name.match('[0-9]+$');
if(numeric_suffix){
return old_name.substr(0,old_name.length-numeric_suffix[0].length)+(parseInt(numeric_suffix[0])+1);
}
return old_name+' 2';
};
function create_new_theme(){
if(window.theme_map.length>=20){
display_error_alert('colors-messages',yt.getMsg('THEME_LIMIT'));
return;
}
var new_theme_obj=copy_object(window.current_theme_obj);
new_theme_obj.builtin=false;
new_theme_obj.display_name=generate_theme_name(new_theme_obj.display_name);
var suffix=window.current_theme_name.match('[0-9]+$');
var new_theme_name=window.current_theme_name.slice(0,suffix?-suffix[0].length:window.current_theme_name.length);
suffix=(suffix!=null)?parseInt(suffix[0])+1:2;
while(window.theme_map[new_theme_name+suffix]){
suffix++;
}
new_theme_name+=suffix;
window.theme_map[new_theme_name]=new_theme_obj;
add_theme_div(new_theme_name,new_theme_obj);
set_theme_obj(new_theme_name,true);
open_theme_editor();
}
window.create_new_theme=create_new_theme;
function redraw_moderator_box(){
if(_gel('moderator')){
redraw_box('moderator');
}
}
function save_theme_handler(response){
if(response&&response.success){
current_tab_modified=false;
theme_obj_backups=copy_object(window.theme_map);
current_theme_name_backup=window.current_theme_name;
var tab_contents=_gel('tab_contents_'+current_channel_edit_tab);
tab_contents.__backup=tab_contents.innerHTML;
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
channel_edit_tab('close');
redraw_moderator_box();
}else if(response&&response.errors){
display_error_alert('colors-messages',response.errors.join('<br>'));
}
_removeclass(_gel('tab_contents_colors'),'saving');
}
function save_themes(){
var backend=get_channel_backend();
update_display_name();
var request={'themes':copy_object(window.theme_map)};
request.theme_name=window.current_theme_name;
request.background_image_counter=window.background_image_counter;
backend.aq_.quick_send(request,'save_theme',save_theme_handler);
_addclass(_gel('tab_contents_colors'),'saving');
}
window.save_themes=save_themes;
function replace_stylesheet(cssId,cssText){
var cssEl=_gel(cssId);
if(!cssEl)return;
try{
cssEl.innerHTML=cssText;
}catch(e){
try{
cssEl.innerText=cssText;
}catch(e){
var css=document.styleSheets[cssId];
css.cssText=cssText;
}
}
}
function get_theme_css_handler(data){
replace_stylesheet('channel-theme-css',data.html);
}
function get_theme_css(){
var backend=get_channel_backend();
var theme_obj=window.theme_map[window.current_theme_name];
var request={'theme':theme_obj};
backend.aq_.quick_send(request,'get_theme_css',get_theme_css_handler);
}
function update_display_name(){
var display_name=_gel('theme_edit_name').value;
var display_max_length=15;
if(display_name.length>display_max_length){
display_name=display_name.slice(0,display_max_length);
}
window.current_theme_obj.display_name=display_name;
_gel('theme_display_name').innerHTML=htmlEscape(display_name);
var current_theme_div=_gel(window.current_theme_name);
var title_div=goog.dom.getElementsByTagNameAndClass('SPAN','theme_title',current_theme_div)[0];
title_div.innerHTML=htmlEscape(display_name);
}
function update_theme_name(obj,evt){
var e=evt?evt:window.event;
if(e.keyCode==13||e.keyCode==27){
obj.blur();
return false;
}
length_check(e,obj,15);
window.setTimeout(update_display_name,0);
}
window.update_theme_name=update_theme_name;
function length_check(evt,obj,max_length){
var old_value=obj.value;
window.setTimeout(function(){
if(obj.value.length>max_length){
var old_scroll_top=obj.scrollTop;
obj.value=old_value.substr(0,max_length);
obj.scrollTop=old_scroll_top;
}
},0);
var e=evt?evt:window.event;
if(obj.value.length>=max_length&&e.keyCode>46){
return false;
}
return true;
}
window.length_check=length_check;
var popup_prop_name=null;
function popup_color_grid(name){
document.onclick=null;
var grid=_gel('popup_color_grid');
if(popup_prop_name){
grid.style.display='none';
popup_prop_name=null;
return;
}
var pos=goog.style.getPosition(_gel(name));
grid.style.top=(pos.y+20)+'px';
grid.style.left=(pos.x-20)+'px';
grid.style.display='';
document.body.appendChild(grid);
popup_prop_name=name;
window.setTimeout(function(){
document.onclick=function(opt_evt){
var e=opt_evt?opt_evt:window.event;
var t=e.target?e.target:e.srcElement;
if(t.nodeType==3)t=t.parentNode;
grid.style.display='none';
document.onclick=null;
popup_prop_name=null;
var preview_node=_gel(name+'_option');
if(t==preview_node||yt.dom.hasAncestor(t,preview_node)){
yt.events.stopPropagation(e);
return false;
}
};
},1);
}
window.popup_color_grid=popup_color_grid;
function select_popup_color(color){
if(popup_prop_name){
edit_main_theme(popup_prop_name,color);
_gel(popup_prop_name+'-preview').style.backgroundColor=color;
_gel(popup_prop_name).value=color;
}
}
window.select_popup_color=select_popup_color;
var VALID_COLOR_REGEX=new RegExp('^(#[0-9a-f]{3,6}|white|black|blue|red|green|yellow|cyan|purple|violet|pink|salmon|orange|navy|gray|lightgrey|darkgray|brown)$','i');
function blur_color_picker(el){
if(el.value.match(VALID_COLOR_REGEX)){
edit_main_theme(el.id,el.value);
_gel(el.id+'-preview').style.backgroundColor=el.value;
el.value=el.value.toUpperCase();
}else{
el.value=el.__old_value||'';
}
}
window.blur_color_picker=blur_color_picker;
function color_picker_keypress(input,evt){
if(evt.keyCode==13){
this.blur();
if(this.onblur)this.onblur();
return false;
}else if(evt.keyCode==27){
this.value=this.__old_value;
this.blur();
if(this.onblur)this.onblur();
return false;
}
}
window.color_picker_keypress=color_picker_keypress;
function draw_box_handler(response){
if(response&&response.data){
var old_node=_gel(response.data.box_info.name);
if(old_node){
window.setTimeout(function(){goog.dom.removeNode(old_node);draw_box_handler(response);},200);
return;
}
var box_info=response.data.box_info;
window.boxes[box_info.name]=box_info;
var temp_div=document.createElement('div');
temp_div.innerHTML=response.data.html;
var node=temp_div.firstChild;
insert_box(box_info,node);
}else{
}
}
function insert_box(box_info,node){
box_status[box_info.name]=true;
var parent_div;
if(box_info.y_position<0){
parent_div=_gel('channel-base-div');
}else if(box_info.x_position==1){
parent_div=_gel('main-channel-right');
}else{
parent_div=_gel('main-channel-left');
}
var next_box=get_box_after(box_info);
if(next_box){
var next_box_div=_gel(next_box);
next_box_div.parentNode.insertBefore(node,next_box_div);
}else if(box_info.y_position<0){
parent_div.insertBefore(node,_gel('main-channel-content'));
}else{
parent_div.appendChild(node);
}
if(box_info.name=='user_events'){
run_scripts_in_el(node);
}
fix_box_arrows();
var ani={
'fadeDuration':'0.4s',
'slideDuration':'0.25s'
};
yt.animations.slideDownAndFadeIn(node,ani);
}
function polarity(num){
return num>=0;
}
function get_box_after(box_info){
var next_box=null;
for(var name in window.boxes){
var box=window.boxes[name];
if(polarity(box.y_position)!=polarity(box_info.y_position)){
continue;
}
if(box.y_position>box_info.y_position&&x_pos_matches(box,box_info)&&box.name!=box_info.name&&box_status[box.name]&&(!next_box||box.y_position<next_box.y_position)){
next_box=box;
}
}
return next_box?next_box.name:null;
}
function x_pos_matches(box1,box2){
if(box1.y_position<0&&box2.y_position<0){
return true;
}
return box1.x_position==box2.x_position;
}
function get_box_before(box_info){
var previous_box=null;
for(var name in window.boxes){
var box=window.boxes[name];
if(box.x_position==box_info.x_position&&
box.name!=box_info.name&&
box_status[box.name]&&
box.y_position<box_info.y_position&&
(!previous_box||box.y_position>previous_box.y_position)){
previous_box=box;
}
}
return previous_box?previous_box.name:null;
}
function add_box(name,opt_save){
var backend=get_channel_backend();
var request={'name':name};
if(window.boxes[name]){
request.x_position=window.boxes[name].x_position;
request.y_position=window.boxes[name].y_position;
}
request.theme_name=window.current_theme_name;
request.save=opt_save?true:false;
backend.aq_.quick_send(request,'draw_box',draw_box_handler);
}
function redraw_box(name){
var backend=get_channel_backend();
var request={'name':name};
request.theme_name=window.current_theme_name;
backend.aq_.quick_send(request,'draw_box',draw_box_handler);
}
function remove_box(name){
var node=_gel(name);
var ani={
'fadeDuration':'0.3s',
'slideDuration':'0.4s'
};
yt.animations.fadeAndSlideUp(node,ani);
yt.setTimeout(function(){goog.dom.removeNode(node)},700);
box_status[name]=false;
fix_box_arrows();
}
function add_or_remove_box(input){
window.setTimeout(function(){
if(input.checked){
add_box(input.value);
}else{
_gel('box_removed_message').style.display='';
remove_box(input.value);
}
if(input.value=='user_playlist_navigator'){
_gel('channel_tab_playnav').style.display=input.checked?'block':'none';
}
},0);
current_tab_modified=true;
}
window.add_or_remove_box=add_or_remove_box;
function hide_if_there(id){
var el=_gel(id);
if(el)_addclass(el,'disabled');
}
function show_if_there(id){
var el=_gel(id);
if(el)_removeclass(el,'disabled');
}
function fix_box_arrows(){
var top_left=null;
var top_right=null;
var bottom_left=null;
var bottom_right=null;
var top_top=null;
var bottom_top=null;
for(var name in window.boxes){
var box=window.boxes[name];
show_if_there(name+'-up-arrow');
show_if_there(name+'-down-arrow');
if(box&&box_status[name]&&!IMMOVABLE_BOX[name]){
if(box.y_position>=0){
if(box.x_position==1){
if(!top_right||top_right.y_position>box.y_position){
top_right=box;
}
if(!bottom_right||bottom_right.y_position<box.y_position){
bottom_right=box;
}
}else{
if(!top_left||top_left.y_position>box.y_position){
top_left=box;
}
if(!bottom_left||bottom_left.y_position<box.y_position){
bottom_left=box;
}
}
}else{
if(box.x_position>0){
if(!top_top||top_top.y_position>box.y_position){
top_top=box;
}
if(!bottom_top||bottom_top.y_position<box.y_position){
bottom_top=box;
}
}
}
}
}
if(top_right)hide_if_there(top_right.name+'-up-arrow');
if(top_left)hide_if_there(top_left.name+'-up-arrow');
if(bottom_right)hide_if_there(bottom_right.name+'-down-arrow');
if(bottom_left)hide_if_there(bottom_left.name+'-down-arrow');
if(top_top)hide_if_there(top_top.name+'-up-arrow');
if(bottom_top)hide_if_there(bottom_top.name+'-down-arrow');
}
window.fix_box_arrows=fix_box_arrows;
function move_up(name){
if(_hasclass(_gel(name+'-up-arrow'),'disabled')){
return;
}
swap_boxes(name,get_box_before(window.boxes[name]));
}
window.move_up=move_up;
function move_down(name){
if(_hasclass(_gel(name+'-down-arrow'),'disabled')){
return;
}
swap_boxes(name,get_box_after(window.boxes[name]));
}
window.move_down=move_down;
function swap_boxes(name1,name2){
var el1=_gel(name1);
var el2=_gel(name2);
var tmp=window.boxes[name1].y_position;
window.boxes[name1].y_position=window.boxes[name2].y_position;
window.boxes[name2].y_position=tmp;
fix_box_arrows();
var ani={
'duration':'0.7s'
};
yt.animations.swapVertical(el1,el2,ani);
var backend=get_channel_backend();
backend.aq_.send_message({'boxes':[name1,name2]},'swap_boxes',true);
}
function move_left(name){
if(_hasclass(_gel(name+'-left-arrow'),'disabled')){
return;
}
window.boxes[name].x_position=0;
remove_box(name);
add_box(name,true);
}
window.move_left=move_left;
function move_right(name){
if(_hasclass(_gel(name+'-right-arrow'),'disabled')){
return;
}
window.boxes[name].x_position=1;
remove_box(name);
add_box(name,true);
}
window.move_right=move_right;
var IMMOVABLE_BOX={'user_profile':true};
var box_status={};
yt.pubsub.subscribe('init',function(){
for(var name in window.boxes){
var box=window.boxes[name];
if(box&&box.name&&_gel(name)){
box_status[name]=true;
}
}
if(window.channel_new_ui){
_addclass(_gel('channel-body'),'jsloaded');
fix_box_arrows();
}
});
function save_boxes_handler(response){
if(response&&response.data&&response.data.success){
current_tab_modified=false;
var tab_contents=_gel('tab_contents_'+current_channel_edit_tab);
tab_contents.__backup=tab_contents.innerHTML;
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
channel_edit_tab('close');
}else if(response&&response.errors){
display_error_alert('layout-messages',response.errors.join('<br>'));
}
_removeclass(_gel('tab_contents_layout'),'saving');
}
function get_layout_status(form){
var statusRequest={};
for(var i=0;i<form.elements.length;i++){
var input=form.elements[i];
if(input.type=='checkbox'){
statusRequest[input.value]=input.checked;
}
}
return statusRequest;
}
function save_boxes(){
var backend=get_channel_backend();
backend.aq_.register_handler('save_boxes',save_boxes_handler);
backend.aq_.send_message({'boxes':get_layout_status(_gel('channel_layout'))},'save_boxes',true);
_addclass(_gel('tab_contents_layout'),'saving');
}
window.save_boxes=save_boxes;
function save_watch_header_handler(response){
if(response&&response.data&&response.data.success){
current_tab_modified=false;
current_subtab_modified=false;
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
}else if(response&&response.errors){
display_error_alert('video-messages',response.errors.join('<br>'));
}
_removeclass(_gel('subtab_contents_videopage'),'saving');
}
function save_watch_header(){
var form=_gel('watch_header_form');
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.register_handler('save_watch_header',save_watch_header_handler);
backend.aq_.send_message(request,'save_watch_header',true);
_addclass(_gel('subtab_contents_videopage'),'saving');
}
window.save_watch_header=save_watch_header;
function save_banners_handler(response){
if(response&&response.data&&response.data.success){
current_tab_modified=false;
current_subtab_modified=false;
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
}else if(response&&response.errors){
display_error_alert('banners-messages',response.errors.join('<br>'));
}
_removeclass(_gel('subtab_contents_banners'),'saving');
}
function save_banners(){
var form=_gel('banners_form');
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.register_handler('save_banners',save_banners_handler);
backend.aq_.send_message(request,'save_banners',true);
_addclass(_gel('subtab_contents_banners'),'saving');
}
window.save_banners=save_banners;
function save_tracking_handler(response){
if(response&&response.data&&response.data.success){
current_tab_modified=false;
current_subtab_modified=false;
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
}else if(response&&response.errors){
display_error_alert('tracking-messages',response.errors.join('<br>'));
}
_removeclass(_gel('subtab_contents_tracking'),'saving');
}
function save_tracking(){
var form=_gel('tracking_form');
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.register_handler('save_tracking',save_tracking_handler);
backend.aq_.send_message(request,'save_tracking',true);
_addclass(_gel('subtab_contents_tracking'),'saving');
}
window.save_tracking=save_tracking;
function close_edit_mode(box_id){
var box=_gel(box_id);
if(_hasclass(box,'edit_mode')){
_removeclass(box,'edit_mode');
}
}
function cancel_edit_mode(box_id){
close_edit_mode(box_id);
var box=_gel(box_id);
box.innerHTML=box.__backup;
}
window.cancel_edit_mode=cancel_edit_mode;
function toggle_edit_mode(box_id){
var box=_gel(box_id);
if(!_hasclass(box,'edit_mode')){
box.__backup=box.innerHTML;
}
if(_hasclass(box,'edit_mode')){
_removeclass(box,'edit_mode');
}else{
_addclass(box,'edit_mode');
}
}
window.toggle_edit_mode=toggle_edit_mode;
function save_box_settings(box_id){
var box_info=get_channel_box_info(box_id);
var backend=get_channel_backend();
_addclass(_gel(box_id),'saving');
var callback=function(response){
_removeclass(_gel(box_id),'saving');
if(response.success){
close_edit_mode(box_id);
if(response.html){
channel_replace_div(_gel(box_id),response.html);
fix_box_arrows();
}
if(response.js_exec){
eval(response.js_exec);
}
display_success_alert(box_id+'-messages',yt.getMsg('SUCCESS'));
}else if(response.errors){
display_error_alert(box_id+'-messages',response.errors.join('<br>'));
}
};
var params=form_to_dict(_gel('edit_form_'+box_id));
backend.call_box_method(box_info,params,'save',callback);
}
window.save_box_settings=save_box_settings;
function save_playnav_settings(){
var box_id='user_playlist_navigator';
var box_info=get_channel_box_info(box_id);
var backend=get_channel_backend();
_addclass(_gel('tab_contents_playnav'),'saving');
var callback=function(response){
if(response.success){
current_tab_modified=false;
var tab_contents=_gel('tab_contents_'+current_channel_edit_tab);
if(tab_contents){
tab_contents.__backup=tab_contents.innerHTML;
}
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
channel_edit_tab('close');
if(_gel(box_id)){
if(response.html){
channel_replace_div(_gel(box_id),response.html);
fix_box_arrows();
}
if(response.js_exec){
eval(response.js_exec);
}
}
}else if(response&&response.errors){
display_error_alert('playnav-messages',response.errors.join('<br>'));
}
_removeclass(_gel('tab_contents_playnav'),'saving');
};
var params=form_to_dict(_gel('edit_form_'+box_id));
backend.call_box_method(box_info,params,'save',callback);
}
window.save_playnav_settings=save_playnav_settings;
function save_mobile_settings(){
var backend=get_channel_backend();
var params=form_to_dict(_gel('edit_form_mobile'));
backend.aq_.quick_send(params,'save_mobile_settings',function(response){
if(response.data&&response.data.success){
current_tab_modified=false;
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
channel_edit_tab('close');
}
else if(response&&response.errors){
display_error_alert('mobile-messages',response.errors.join('<br>'));
}
_removeclass(_gel('tab_contents_mobile'),'saving');
});
_addclass(_gel('tab_contents_mobile'),'saving');
}
window.save_mobile_settings=save_mobile_settings;
function swap_with_input(id,focus,opt_update_height){
yt.style.toggle('profile_temp_'+id,'profile_edit_'+id);
if(focus){
_gel('profile_edit_'+id).focus();
if(opt_update_height){
_gel('profile_edit_'+id).style.height=Math.max(_gel('profile_temp_'+id).offsetHeight,45)+'px';
}
}else{
var new_value=_gel('profile_edit_'+id).value;
if(new_value){
var view_toggle=_gel('hide_'+id);
if(view_toggle){
view_toggle.checked=false;
}
}
_gel('profile_temp_'+id).innerHTML=new_value?htmlEscape(new_value).replace(/\n/g,'<br>'):'&nbsp;';
}
}
window.swap_with_input=swap_with_input;
function reload_profile_box(request_save){
var box_id='user_profile';
var box_info=get_channel_box_info(box_id);
var backend=get_channel_backend();
if(request_save){
_addclass(_gel(box_id),'saving');
}
var callback=function(response){
if(request_save){
_removeclass(_gel(box_id),'saving');
}
if(response.success){
close_edit_mode(box_id);
_gel(box_id).innerHTML=response.html;
if(request_save){
display_success_alert(box_id+'-messages',yt.getMsg('SUCCESS'));
}
}else if(response.error_fields){
for(var field_name in response.error_fields){
var bad_field=_gel('profile_edit_'+field_name);
if(bad_field){
bad_field.focus();
var error_field=_gel('profile_errors_'+field_name);
error_field.style.display='';
error_field.innerHTML=escapeHTML(response.error_fields[field_name]);
}
}
}else if(request_save&&response.errors){
display_error_alert(box_id+'-messages',response.errors.join('<br>'));
}
};
var params=form_to_dict(_gel('edit_form_'+box_id));
backend.call_box_method(box_info,params,'save',callback);
}
function save_profile_box(){
reload_profile_box(true);
}
window.save_profile_box=save_profile_box;
function set_channel_title(title){
var title_div=_gel('channel_title');
var title_base_div=_gel('channel_base_title');
title_div.innerHTML=htmlEscape(title);
if(title){
title_base_div.style.fontSize='11px';
title_base_div.style.paddingTop='0';
title_div.style.display='';
}else{
title_base_div.style.fontSize='16px';
title_base_div.style.paddingTop='9px';
title_div.style.display='none';
}
}
function save_channel_settings_handler(response){
if(response&&response.data&&response.data.success){
set_channel_title(_gel('channel_title_input').value);
reload_profile_box(false);
current_tab_modified=false;
var tab_contents=_gel('tab_contents_'+current_channel_edit_tab);
tab_contents.__backup=tab_contents.innerHTML;
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
channel_edit_tab('close');
}else if(response&&response.errors){
display_error_alert('info-messages',response.errors.join('<br>'));
}
_removeclass(_gel('tab_contents_info'),'saving');
}
function settings_tab_keypress(){
current_tab_modified=true;
if(yt.www.livestreammodule){
yt.www.livestreammodule.disableForbiddenSecondaryItags();
}
}
window.settings_tab_keypress=settings_tab_keypress;
function save_channel_settings(){
var form=_gel('channel_settings');
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.register_handler('save_channel_settings',save_channel_settings_handler);
backend.aq_.send_message(request,'save_channel_settings',true);
_addclass(_gel('tab_contents_info'),'saving');
}
window.save_channel_settings=save_channel_settings;
function feed_bulletin_input_onfocus(input){
var def_input=_gel(input.id+'_placeholder');
if(input.value==def_input.value){
input.value='';
}
input.hasFocus__=true;
}
function feed_bulletin_preview_onblur(input){
if(input.value==''){
var def_input=_gel(input.id+'_placeholder');
input.value=def_input.value;
}
input.hasFocus__=false;
}
window.feed_bulletin_preview_onblur=feed_bulletin_preview_onblur;
function feed_bulletin_preview_onfocus(input){
var def_input=_gel(input.id+'_placeholder');
feed_bulletin_input_onfocus(input);
feed_bulleting_preview_periodic(input,def_input,_gel('preview_bulletin_message'));
}
window.feed_bulletin_preview_onfocus=feed_bulletin_preview_onfocus;
function feed_bulleting_preview_periodic(input,def_input,previewMessage){
previewMessage.innerHTML='';
if(input.value!=def_input.value){
feed_bulletin_maxlength(input);
previewMessage.appendChild(document.createTextNode(input.value));
}
if(input.hasFocus__){
window.setTimeout(function(){
feed_bulleting_preview_periodic(input,def_input,previewMessage);
},500);
}
}
function feed_bulletin_maxlength(input){
var MAX_LENGTH=500;
if(input.value.length>MAX_LENGTH){
input.value=input.value.substr(0,MAX_LENGTH);
}
}
window.feed_bulletin_maxlength=feed_bulletin_maxlength;
function feed_bulletin_preview_video_onfocus(input){
feed_bulletin_input_onfocus(input);
feed_bulletin_preview_video_periodic(input);
}
window.feed_bulletin_preview_video_onfocus=feed_bulletin_preview_video_onfocus;
function feed_bulletin_preview_video_periodic(input){
if(input.style.display!='none'&&input.value!=input.value__){
input.value__=input.value;
feed_bulletin_preview_video(input);
}
if(input.hasFocus__){
window.setTimeout(function(){
feed_bulletin_preview_video_periodic(input);
},500);
}
}
function feed_bulletin_preview_video(input){
var previewLoading=_gel('preview_bulletin_loading');
var previewVideo=_gel('preview_bulletin_video');
var videoUrl=input.value;
previewLoading.style.display='none';
previewVideo.innerHTML='';
if(input.style.display!='none'&&is_valid_feed_bulletin_url(videoUrl)){
var callback=function(response){
if(input.requestUrl__==videoUrl){
previewLoading.style.display='none';
if(response&&response.success&&response.html){
previewVideo.innerHTML=response.html;
}
}
};
input.requestUrl__=videoUrl;
previewLoading.style.display='';
preview_feed_bulletin(videoUrl,callback);
}
}
function is_valid_feed_bulletin_url(url){
var urlPrefix='^(https?:/)?/[-\\w./&?+=~:;!%()@#,*]*';
var videoIdPrefix='(v=|/v/|/vi/|video_id=|youtu\\.be/|/cp/|#p(lay)?/.*/)';
var encryptedId='[A-Za-z0-9-_]{11}';
var docId='\\?docid=([-0-9]+)';
var pattern=new RegExp(urlPrefix+
'('+videoIdPrefix+encryptedId+'|'+docId+')');
return pattern.test(url);
}
function reset_feed_bulletin_fields(){
_gel('bulletin_text').value=_gel('bulletin_text_placeholder').value;
_gel('bulletin_video').value=_gel('bulletin_video_placeholder').value;
_gel('preview_bulletin_message').innerHTML='';
_gel('preview_bulletin_video').innerHTML='';
_gel('preview_bulletin_loading').style.display='none';
}
function post_feed_bulletin_from_tab_handler(response){
if(response&&response.success){
display_success_alert('edit-save-messages',response.message);
reset_feed_bulletin_fields();
channel_edit_tab('close');
}else if(response){
display_error_alert('bulletin-messages',response.message);
}
}
function post_feed_bulletin_from_tab(){
var form=_gel('post_feed_bulletin_tab');
var bulletin_input=_gel('bulletin_text');
var bulletin_video_input=_gel('bulletin_video');
if(bulletin_input.style.display=='none'){
bulletin_input.value='';
}
if(bulletin_video_input.style.display=='none'){
bulletin_video_input.value='';
}
post_feed_bulletin('user_recent_activity',form,post_feed_bulletin_from_tab_handler);
}
window.post_feed_bulletin_from_tab=post_feed_bulletin_from_tab;
function cancel_feed_bulletin_from_tab(){
reset_feed_bulletin_fields();
channel_edit_tab('close',true);
}
window.cancel_feed_bulletin_from_tab=cancel_feed_bulletin_from_tab;
function save_watch_branding_handler(response){
if(response&&response.data&&response.data.success){
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
current_tab_modified=false;
var tab_contents=_gel('tab_contents_'+current_channel_edit_tab);
tab_contents.__backup=tab_contents.innerHTML;
}else if(response&&response.errors){
display_error_alert('watch_branding-messages',response.errors.join('<br>'));
}
_removeclass(_gel('tab_contents_watch_branding'),'saving');
}
function save_watch_branding(){
var form=_gel('watch_branding');
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.quick_send(request,'save_watch_branding',save_watch_branding_handler);
_addclass(_gel('tab_contents_watch_branding'),'saving');
}
window.save_watch_branding=save_watch_branding;
function save_live_stream_handler(response){
if(response&&response.data&&response.data.success){
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
current_tab_modified=false;
yt.www.livestreammodule.parseMetadata(response.data.metadata);
}else if(response&&response.errors){
display_error_alert('live_stream-messages',response.errors.join('<br>'));
}
_removeclass(_gel('tab_contents_live_stream'),'saving');
}
function save_live_stream(){
var form=_gel('live-stream');
yt.www.livestreammodule.collectSourceParams(form);
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.quick_send(request,'save_live_stream',save_live_stream_handler);
_addclass(_gel('tab_contents_live_stream'),'saving');
}
window.save_live_stream=save_live_stream;
function gen_new_live_stream_id(){
yt.www.livestreammodule.newLiveStreamId();
save_live_stream();
}
window.gen_new_live_stream_id=gen_new_live_stream_id;
function channel_hierarchy_response_handler(response){
if(response&&response.data&&response.data.success){
display_success_alert('edit-save-messages',yt.getMsg('SUCCESS'));
current_tab_modified=false;
var tab_contents=_gel('tab_contents_'+current_channel_edit_tab);
tab_contents.__backup=tab_contents.innerHTML;
}else if(response&&response.errors){
display_error_alert('channel_hierarchy-messages',response.errors.join('<br>'));
}
}
function change_hierarchy_passcode(){
var form=_gel('hierarchy_passcode');
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.quick_send(request,'change_hierarchy_passcode',channel_hierarchy_response_handler);
}
window.change_hierarchy_passcode=change_hierarchy_passcode;
function modify_child_channel_handler(response){
if(response.data&&response.data.html)
_gel('children_list').innerHTML=response.data.html;
channel_hierarchy_response_handler(response);
}
function add_child_channel(){
var form=_gel('add_child');
var request=form_to_dict(form);
var backend=get_channel_backend();
backend.aq_.quick_send(request,'add_child_channel',modify_child_channel_handler);
}
window.add_child_channel=add_child_channel;
function remove_child_channel(childname){
var request={'childname':childname};
var backend=get_channel_backend();
backend.aq_.quick_send(request,'remove_child_channel',modify_child_channel_handler);
}
window.remove_child_channel=remove_child_channel;
function remove_parent_channel_handler(response){
if(response.data&&response.data.success){
goog.dom.removeNode(_gel('remove_parent_channel'));
goog.dom.removeNode(_gel('remove_parent_channel_separator'));
}
channel_hierarchy_response_handler(response);
}
function remove_parent_channel(){
var backend=get_channel_backend();
backend.aq_.quick_send({},'remove_parent_channel',remove_parent_channel_handler);
}
window.remove_parent_channel=remove_parent_channel;
function changeCommentPermissions(friend_only,moderation){
_gel('profile_comment_friend_only').value=friend_only;
_gel('profile_comment_moderation').value=moderation;
}
window.changeCommentPermissions=changeCommentPermissions;
function uploaded_background_image(upload_response_variables){
if(upload_response_variables.upload_type=='channel_background'){
if(upload_response_variables.success){
_gel('background_image').value=upload_response_variables.image_url;
edit_main_theme('background_image',upload_response_variables.image_url,true);
update_theme_css('background_image',upload_response_variables.preview_url);
}else{
display_error_alert('colors-messages',upload_response_variables.error_msg);
}
window.frames['background_frame'].document.getElementById('channel_background_counter').value=++window.background_image_counter;
}else if(upload_response_variables.upload_type=='watch_background'){
if(!upload_response_variables.success){
display_error_alert('watch_branding-messages',upload_response_variables.error_msg);
}
_gel('delete_watch_background').value='False';
}else if(upload_response_variables.upload_type=='watch_header'){
if(!upload_response_variables.success){
display_error_alert('video-messages',upload_response_variables.error_msg);
}else{
_gel('delete_watch_header').value='False';
}
}else if(upload_response_variables.upload_type=='watch_icon'){
if(!upload_response_variables.success){
display_error_alert('video-messages',upload_response_variables.error_msg);
}else{
_gel('delete_watch_icon').value='False';
_gel('delete_new_watch_icon').value='False';
}
}else if(upload_response_variables.upload_type=='profile_header'){
if(upload_response_variables.success){
_gel('branding_image_visible').value='True';
}else{
display_error_alert('banners-messages',upload_response_variables.error_msg);
}
}else if(upload_response_variables.upload_type=='side_column'){
if(upload_response_variables.success){
_gel('side_column_image_visible').value='True';
}else{
display_error_alert('banners-messages',upload_response_variables.error_msg);
}
}
}
window.uploaded_background_image=uploaded_background_image;
function undelete_background_upload(upload_type){
switch(upload_type){
case 'watch_background':
case 'mobile_watch_banner':
case 'new_watch_background':
case 'new_watch_small_banner':
case 'new_watch_large_banner':
case 'watch_header':
_gel('delete_'+upload_type).value='False';
break;
}
}
window.undelete_background_upload=undelete_background_upload;
function delete_background_upload(upload_type){
switch(upload_type){
case 'channel_background':
_gel('background_image').value='';
edit_main_theme('background_image','');
break;
case 'mobile_watch_banner':
_gel('delete_mobile_watch_banner').value='True';
current_subtab_modified=true;
break;
case 'watch_background':
_gel('delete_watch_background').value='True';
current_subtab_modified=true;
break;
case 'new_watch_background':
_gel('delete_new_watch_background').value='True';
current_subtab_modified=true;
break;
case 'new_watch_small_banner':
_gel('delete_new_watch_small_banner').value='True';
current_subtab_modified=true;
break;
case 'new_watch_large_banner':
_gel('delete_new_watch_large_banner').value='True';
current_subtab_modified=true;
break;
case 'watch_header':
_gel('delete_watch_header').value='True';
current_subtab_modified=true;
break;
case 'watch_icon':
_gel('delete_watch_icon').value='True';
_gel('delete_new_watch_icon').value='True';
current_subtab_modified=true;
break;
case 'profile_header':
_gel('branding_image_visible').value='False';
current_subtab_modified=true;
break;
case 'mobile_profile_banner_portrait':
_gel('delete_mobile_banner_portrait').value='True';
current_tab_modified=true;
break;
case 'mobile_profile_banner_landscape':
_gel('delete_mobile_banner_landscape').value='True';
current_tab_modified=true;
break;
case 'side_column':
_gel('side_column_image_visible').value='False';
current_subtab_modified=true;
break;
case 'album_cover_0':
case 'album_cover_1':
case 'album_cover_2':
var imgPreview=_gel('img_url_'+upload_type);
imgPreview.style.display='none';
var imgUrlInput=_gel('img_url__'+upload_type);
imgUrlInput.value='';
break;
}
current_tab_modified=true;
}
window.delete_background_upload=delete_background_upload;
function update_hidden_field(name){
window.setTimeout(function(){
var displayed=_gel('show_'+name).checked;
_gel('hide_'+name).checked=!displayed;
if(!displayed){
_addclass(_gel('edit_info_'+name),'opacity40');
}else{
_removeclass(_gel('edit_info_'+name),'opacity40');
}
},1);
}
window.update_hidden_field=update_hidden_field;
function update_merged_date(name){
var year=_gel(name+'_yr').value;
var month=_gel(name+'_mon').value;
if(month.length<2){
month='0'+month;
}
var day=_gel(name+'_day').value;
if(day.length<2){
day='0'+day;
}
_gel(name+'_merged').value=year+month+day;
}
window.update_merged_date=update_merged_date;
function toggle_playnav_edit_mode(){
_gel('playnav_edit_info').__backup=_gel('playnav_edit_info').innerHTML;
toggle_edit_mode('user_playlist_navigator');
}
window.toggle_playnav_edit_mode=toggle_playnav_edit_mode;
function profile_remove_user(username,box){
if(!confirm(yt.getMsg('SRSLY_GTFO'))){
return;
}
var backend=get_channel_backend();
var request={'username':username,'box':box};
backend.aq_.quick_send(request,'profile_remove_user',profile_remove_user_handler);
}
window.profile_remove_user=profile_remove_user;
function profile_remove_user_handler(response){
window.location.reload(true);
}
function toggle_remover(el_name,show){
var name='rm-user-'+el_name;
if(show){
_showdiv(name);
}else{
_hidediv(name);
}
}
window.toggle_remover=toggle_remover;
function gather_form_data(form){
var formdata={};
var form_elements=form.elements;
var input_names=[];
for(var i=0;i<form_elements.length;i++){
var input=form_elements[i];
input_names.push(input.name);
if((input.type=='checkbox'||input.type=='radio')&&input.checked==false){
continue;
}
var value=input.value;
if(input.type=='select-multiple'){
value=[];
var options=input.options;
for(var j=0;j<options.length;j++){
var option=options[j];
value.push(option.value);
}
}
formdata[input.name]=value;
}
return formdata;
}
function copy_object(obj){
var temp={};
if(typeof(obj)=='object'){
for(var prop in obj){
if(typeof(obj[prop])=='object'){
if(obj[prop].__isArray){
temp[prop]=copy_array(obj[prop]);
}else{
temp[prop]=copy_object(obj[prop]);
}
}else{
temp[prop]=obj[prop];
}
}
return temp;
}
return obj;
}
function copy_array(arr){
return arr.slice(0);
}
function form_to_dict(form){
var form_vars={};
for(var i=0;i<form.elements.length;i++){
var input=form.elements[i];
var name=input.name;
if(input.type=='checkbox'){
if(input.checked){
if(!form_vars[name]){
form_vars[name]=new Array;
}
form_vars[name].push(input.value);
}
}else if(input.type!='radio'||input.checked){
var value=input.value;
if(input.type=='select-multiple'){
value=[];
var options=input.options;
for(var j=0;j<options.length;j++){
var option=options[j];
value.push(option.value);
}
}
form_vars[name]=value;
}
}
return form_vars;
}
window.form_to_dict=form_to_dict;
})();
var playnav=function(){};
playnav.onPlayerLoadedFunctions=[];
playnav.onDomLoaded=[];
(function(){
var OVERSCROLL=500;
var AUTOSKIP_ERROR_TIMEOUT=3000;
var ARRANGER_WAIT_DELAY=100;
var PlayState={
UNSTARTED:-1,
ENDED:0,
PLAYING:1,
PAUSED:2,
BUFFERING:3,
CUED:5
};
var isAutoskip_=false;
var isAutoplay_=true;
var boxId_='user_playlist_navigator';
var backend_;
var boxInfo_={'name':boxId_,'x_position':0};
var player_;
var livePlayer_;
var currentPlayState_=PlayState.UNSTARTED;
var playerUpgradeId='profile-noplayer-div';
var isWritePlayerPending_=false;
var pendingPlayerConfig=null;
var initialLocationHash_;
var curViewName_='';
var gridViewTitle_='';
var curPlaylistName_;
var curPlaylistId_;
var curSearchQuery_;
var curSortName_='date';
var curSortDirection_='desc';
var invalidatedPlaylists_={};
var curSelection_;
var curVideoId_;
var curVideoIndex_;
var curPanelName_='info';
var curLiveStreamingPanelName_='ls_info';
var isSkipping_=false;
var isDomLoaded_=false;
var initTab_='';
var passedTroughInitTab_=false;
var isViewUpdateRequested_=false;
var isViewUpdatePending_=false;
var arrangerOpenRequested_=null;
var arrangerRestoreParams_=null;
var ageVerificationRequired_=false;
var scrollableItemSetupCallback_=null;
var arranger_=null;
function setupScrollableItems(callback){
scrollableItemSetupCallback_=callback;
if(callback){
var currentScrollbox=goog.dom.getElement(getCurrentScrollboxId());
callback(currentScrollbox);
}
}
function getCurrentScrollboxId(){
return['playnav',curViewName_,curPlaylistId_,'scrollbox'].join('-');
}
function setBoxInfo(boxId){
boxId_=boxId;
boxInfo_={'name':boxId_,'x_position':0};
}
function handlePendingFunction(fname){
if(playnav[fname]){
playnav[fname]();
playnav[fname]=null;
}
}
function executeAll(callbacks){
while(callbacks.length>0){
callbacks.shift()();
}
}
function setViewElementStyle(id,param,value){
var element=goog.dom.getElement(id);
if(element){
element.style[param]=value;
}
}
function removeLoadingClasses(elementName){
var element=goog.dom.getElement(elementName);
if(!element){
return;
}
_removeclass(element,'playnav-visible');
_removeclass(element,'playnav-hidden');
_removeclass(element,'playnav-show');
_removeclass(element,'playnav-hide');
}
function stripLocationHash(locationHash){
if(locationHash.charAt(0)=='#'){
locationHash=locationHash.substr(1);
}
return locationHash.split('&')[0];
}
function getLocationHash(){
return stripLocationHash(window.location.hash);
}
function parseLocationHash(opt_hash){
var hash=opt_hash||getLocationHash();
var locationHash={
length:1,
view:'',
playlistName:'',
playlistId:'',
videoIndex:0,
videoId:''
};
if(hash&&hash!=''){
var parts=hash.split('/');
parts=Iter(parts).collect(function(str){
return decodeURIComponent(str);
});
var view=parts[0];
if(view=='v'){
locationHash.videoId=parts[1]||'';
return locationHash;
}
view=attemptToMap(viewNameMap,'+',view);
locationHash='';
var locHash={
length:1,
view:'',
playlistName:'',
playlistId:'',
videoIndex:0,
videoId:''
};
if(view!='grid'&&view!='play'){
view='';
parts.unshift(view);
}
locHash.view=view;
locHash.length=parts.length;
if(locHash.length>1){
locHash.playlistName=attemptToMap(tabNameMap,'+',parts[1]);
}
if(locHash.playlistName=='live_streaming'){
var liveTabName=playlistNameToTabName('live_streaming');
var liveTab=_gel('playnav-navbar-tab-'+liveTabName);
if(!liveTab){
locHash.playlistName=initTab_;
}
}
switch(locHash.length){
case 2:
var playlistName=parts[1];
if(playlistName.length>1){
locHash='';
}
break;
case 3:
locHash.playlistId=attemptToMap(playlistIdMap,'+',parts[2]);
break;
case 4:
locHash.videoIndex=parts[2];
locHash.videoId=parts[3];
break;
case 5:
locHash.playlistId=parts[2];
if(locHash.playlistName=='all'){
if(locHash.playlistId.indexOf('-all')<0){
locHash.playlistId+='-all';
}
locHash.playlistId=attemptToMap(playlistIdMap,'+',locHash.playlistId);
}
if(locHash.playlistName=='live_streaming'){
if(locHash.playlistId.indexOf('-live_streaming')<0){
locHash.playlistId+='-live_streaming';
}
locHash.playlistId=attemptToMap(playlistIdMap,'+',locHash.playlistId);
}
locHash.videoIndex=parts[3];
locHash.videoId=parts[4];
break;
default:
locHash='';
break;
}
locationHash=locHash;
}
return locationHash;
}
function handleLocationHash(locationHash,opt_isInitialLocationHash){
var wasVideoRequested=false;
if(!locationHash){
return false;
}
if(locationHash.view!=''&&locationHash.view!=curViewName_){
playnav.selectView(locationHash.view);
}
var playlistId=locationHash.playlistName;
if(locationHash.playlistId!=''){
if(locationHash.playlistId!=curPlaylistId_){
playlistId=locationHash.playlistId;
playnav.selectPlaylist(locationHash.playlistName,playlistId,null);
}
}else if(locationHash.playlistName!=''){
playnav.selectPlaylist(locationHash.playlistName,null,null);
}
if(locationHash.videoId!=''){
if(locationHash.playlistName=='live_streaming'){
playnav.playEvent(playlistId,locationHash.videoIndex,
locationHash.videoId);
}else{
playnav.playVideo(playlistId,
locationHash.videoIndex,locationHash.videoId,
null,null,opt_isInitialLocationHash);
wasVideoRequested=true;
}
}
return wasVideoRequested;
}
function handleLocationHashUpdate(windowLocationHash){
var locationHash=stripLocationHash(windowLocationHash);
handleLocationHash(parseLocationHash(locationHash),true);
}
var viewNameMap={
'-grid':'g',
'-play':'p',
'+p':'play',
'+g':'grid'
};
var tabNameMap={
'-all':'a',
'+a':'all',
'-favorites':'f',
'+f':'favorites',
'-uploads':'u',
'+u':'uploads',
'-playlists':'p',
'+p':'playlists',
'-user':'c',
'+c':'user',
'-topics':'t',
'+t':'topics',
'-recent':'r',
'+r':'recent',
'-live_streaming':'l',
'+l':'live_streaming',
'-upcoming':'s',
'+s':'upcoming',
'-previous':'d',
'+d':'previous'
};
var playlistIdMap={
'-uploads-all':'u-all',
'-favorites-all':'f-all',
'-upcoming-live_streaming':'s-live_streaming',
'-previous-live_streaming':'d-live_streaming',
'+u-all':'uploads-all',
'+f-all':'favorites-all',
'+s-live_streaming':'upcoming-live_streaming',
'+d-live_streaming':'previous-live_streaming'
};
function attemptToMap(map,prefix,key){
var tmp=map[prefix+key];
if(tmp)return tmp;
return key;
}
function updateHistory(viewName,tabName,playlistId,opt_videoIndex,opt_videoId){
viewName=attemptToMap(viewNameMap,'-',viewName);
tabName=attemptToMap(tabNameMap,'-',tabName);
playlistId=attemptToMap(tabNameMap,'-',playlistId);
parts=[viewName,tabName];
if(playlistId!=tabName){
playlistId=attemptToMap(playlistIdMap,'-',playlistId);
if(tabName=='a'){
playlistId=playlistId.replace('-all','');
}
if(tabName=='l'){
playlistId=playlistId.replace('-live_streaming','');
}
parts.push(playlistId);
}
if(opt_videoIndex&&opt_videoId){
parts.push(opt_videoIndex);
parts.push(opt_videoId);
}
var windowLocationHash=getLocationHash();
var locationHash=parts.join('/');
if(windowLocationHash.indexOf(locationHash)!=0){
yt.history.add(locationHash,null,true);
}
}
function navigatorNotReady(){
if(!isDomLoaded_){
return true;
}
return false;
}
function setInitialView(viewName){
curViewName_=viewName;
}
function setInitialTab(tabName){
curPlaylistName_=tabName;
initTab_=tabName;
}
function initDom(){
if(isDomLoaded_){
return;
}
isDomLoaded_=true;
backend_=get_channel_backend();
boxInfo_=get_channel_box_info(boxId_);
removeLoadingClasses('playnav-player');
removeLoadingClasses('playnav-playview');
removeLoadingClasses('playnav-gridview');
removeLoadingClasses('playnav-live-streaming-playview');
initTab(curPlaylistName_);
initView(curViewName_);
updateViewOnly();
resizeView();
showProperPlayerArea(curPlaylistName_);
executeAll(playnav.onDomLoaded);
handlePendingFunction('mostRecentSelectViewFunction');
handlePendingFunction('mostRecentSelectTabFunction');
}
function initPlayer(playerId,tabName){
player_.addEventListener('onStateChange','playnav.onPlayerStateChange');
player_.addEventListener('onError','playnav.onPlayerError');
if(curViewName_=='play'){
executeAll(playnav.onPlayerLoadedFunctions);
handlePendingFunction('mostRecentStopFunction');
}else{
handlePendingFunction('mostRecentStopFunction');
}
}
var infoPanelData={'html':'<div></div>'};
function setVideoPlayerConfigVars(data){
var swfArgs=data['swf_args'];
var swfUrl=data['swf_url'];
swfArgs&&yt.setConfig('SWF_ARGS',swfArgs);
swfUrl&&yt.setConfig('SWF_URL',swfUrl);
}
function disableAutoplaySwfArg(){
var swfArgs=yt.getConfig('SWF_ARGS');
swfArgs&&(swfArgs['autoplay']='0');
yt.setConfig('SWF_ARGS',swfArgs);
}
function handleVideoMetadata(videoId,data,opt_embeddedVideo){
var okToWritePlayer=true;
if(opt_embeddedVideo){
goog.dom.getElement(playerUpgradeId).style.display='none';
initialLocationHash_=parseLocationHash();
if(handleLocationHash(initialLocationHash_,true)||
initialLocationHash_.view=='grid'||
initialLocationHash_.playlistName=='live_streaming'
){
okToWritePlayer=false;
}
if(curViewName_=='grid'){
okToWritePlayer=false;
}
}
var error=data['error'];
if(error){
display_error_alert('user_playlist_navigator-messages',error);
}
else if(data['play_response_error']||data['play_response_check']){
playnav.verifyAge(data['play_response_id'],
data['play_response_title'],
data['redirect_url'],
data['play_response_error_message']);
onPlayerError();
}
else if(curVideoId_){
playnav.verifyNotRequired();
setVideoPlayerConfigVars(data);
if(okToWritePlayer){
writePlayer(data);
}else{
isWritePlayerPending_=true;
pendingPlayerConfig=data;
}
infoPanelData={'html':data['info_panel_html'],'js_exec':data['js_exec']};
playnav.selectPanel('info');
}
}
function writePlayer(data){
isWritePlayerPending_=false;
pendingPlayerConfig=null;
var div=goog.dom.getElement(playerUpgradeId);
if(div){
div.style.display='';
}
var swfConfig=data.swfcfg;
swfConfig.args.jsapicallback='onChannelPlayerReady';
yt.flash.write('playnav-player',swfConfig.url,swfConfig);
player_=getPlayer();
}
function getPlayer(){
var player=goog.dom.getFirstElementChild(goog.dom.getElement('playnav-player'));
if(!player||player.id==playerUpgradeId){
return null;
}
return player;
}
function deletePlayer(){
if(player_){
goog.dom.removeNode(player_);
player_=null;
}
}
function requestPlayback(videoId,opt_isFirstplayVideo){
var params={
'video_id':videoId,
'playlist_name':curPlaylistName_,
'is_firstplay':!!opt_isFirstplayVideo
};
if(curPlaylistId_){
params['encrypted_playlist_id']=curPlaylistId_;
}
if(opt_isFirstplayVideo){
params['request_uri']=yt.getConfig('request_uri');
params['http_referer']=yt.getConfig('http_referer');
}
backend_.call_box_method(boxInfo_,params,'get_video_metadata_ajax',
handleVideoMetadata.bind(null,videoId));
}
function pausePlayerVideo(){
if(!player_){
player_=getPlayer();
}
if(player_&&player_.pauseVideo){
player_.pauseVideo();
}
}
function stopPlayerVideo(){
if(player_){
player_.stopVideo();
}
}
function highlightViewButton(buttonName,isHighlighted){
var button=goog.dom.getElement(buttonName);
if(!button){
return;
}
if(isHighlighted){
_addclass(button,'view-button-selected');
}else{
_removeclass(button,'view-button-selected');
}
}
function highlightViewButtons(viewName){
highlightViewButton('playview-icon',viewName=='play');
highlightViewButton('gridview-icon',viewName=='grid');
}
function initView(viewName){
curViewName_=viewName;
highlightViewButtons(viewName);
}
function selectView(viewName){
if(!isDomLoaded_){
highlightViewButtons(viewName);
playnav.mostRecentSelectViewFunction=selectView.bind(null,viewName);
return;
}
if(curPlaylistName_=='live_streaming'&&viewName=='grid'){
return;
}
if(curViewName_!=viewName){
if(!destructArranger()){
return;
}
initView(viewName);
if(viewName!='play'){
pausePlayerVideo();
}else{
if(isWritePlayerPending_){
disableAutoplaySwfArg();
writePlayer(pendingPlayerConfig);
}
}
if(!isViewUpdateRequested_){
isViewUpdateRequested_=true;
requestViewUpdate();
}
}
}
var playlistNameToTabNameMap={
'user':'playlists',
'search':'uploads',
'season_episodes':'shows',
'season_clips':'shows',
'show':'shows'
};
function playlistNameToTabName(name){
return attemptToMap(playlistNameToTabNameMap,'',name);
}
function highlightTab(name){
var tabBar=goog.dom.getElement('playnav-navbar');
if(tabBar){
var tabs=goog.dom.getElementsByTagNameAndClass('a','navbar-tab',tabBar);
var numberOfTabs=tabs.length;
for(var i=0;i<numberOfTabs;i++){
_removeclass(tabs[i],'navbar-tab-selected');
}
}
var className=playlistNameToTabName(name);
var tab=goog.dom.getElement('playnav-navbar-tab-'+className);
if(tab){
_addclass(tab,'navbar-tab-selected');
}
var arrangeLinkContainer=goog.dom.getElement('playnav-arrange-links');
if(arrangeLinkContainer){
var arrangeLinks=goog.dom.getElementsByTagNameAndClass('a','channel-cmd',arrangeLinkContainer);
var numberOfArrangeLinks=arrangeLinks.length;
for(var j=0;j<numberOfArrangeLinks;j++){
_addclass(arrangeLinks[j],'hide-link');
}
}
var arrangeLink=goog.dom.getElement('arrange-link-'+className);
if(arrangeLink){
_removeclass(arrangeLink,'hide-link');
}
}
function enableGridView(){
var gridView=goog.dom.getElement('gridview-icon');
if(!gridView){
return;
}
_removeclass(gridView,'yt-www-ls-disabled-gridview');
if(gridViewTitle_==''){
gridViewTitle_=gridView.title;
}
gridView.title=gridViewTitle_;
}
function disableGridView(){
var gridView=goog.dom.getElement('gridview-icon');
if(!gridView){
return;
}
_addclass(gridView,'yt-www-ls-disabled-gridview');
gridView.title='';
}
function initTab(name){
if(curPlaylistName_=='live_streaming'&&name!='live_streaming'){
if(isWritePlayerPending_){
disableAutoplaySwfArg();
writePlayer(pendingPlayerConfig);
}
}
curPlaylistName_=name;
highlightTab(curPlaylistName_);
enableGridView();
switch(name){
case 'uploads':
case 'favorites':
case 'all':
curPlaylistId_=null;
break;
case 'live_streaming':
curPlaylistId_=null;
disableGridView();
break;
}
}
function selectTab(tabName,opt_suppressUpdate,opt_preserveArranger){
if(!isDomLoaded_){
highlightTab(tabName);
if(!opt_suppressUpdate){
playnav.mostRecentSelectTabFunction=selectTab.bind(null,tabName,opt_suppressUpdate);
}
return;
}
if(yt.www.livestreaming&&!yt.www.livestreaming.canNavigateAway()){
if(!confirm(yt.getMsg('CONFIRM_LEAVE_BROADCAST')+'\n\n'
+yt.getMsg('CONFIRM_NAVIGATE_AWAY'))){
return;
}else{
yt.www.livestreaming.leaveLiveEvent();
}
}
if(opt_preserveArranger&&
tabName==playlistNameToTabName(curPlaylistId_)&&
arranger_){
arrangerRestoreParams_=arranger_.save(true);
arrangerOpenRequested_=tabName;
destructArranger(true);
}else{
if(!destructArranger()){
return;
}
}
initTab(tabName);
if(!opt_suppressUpdate&&!isViewUpdateRequested_){
isViewUpdateRequested_=true;
requestViewUpdate();
}
if(opt_suppressUpdate){
showProperPlayerArea(curPlaylistName_);
}
}
function selectPlaylist(playlistName,opt_playlistId,opt_searchQuery){
curPlaylistId_=opt_playlistId;
curSearchQuery_=opt_searchQuery;
selectTab(playlistName);
}
function showProperPlayerArea(playlistName){
if(goog.dom.getElement('playnav-live-streaming-body')){
if(curPlaylistName_=='live_streaming'&&playlistName!='previous-live_streaming'){
setViewElementStyle('playnav-live-streaming-body','display','block');
setViewElementStyle('playnav-body','display','none');
pausePlayerVideo();
}else{
setViewElementStyle('playnav-body','display','block');
setViewElementStyle('playnav-live-streaming-body','display','none');
}
}
}
function runPanelScriptsLater(name){
return function(){run_scripts_in_el('playnav-panel-'+name);};
}
function handlePanelLoaded(name,panel){
return function(data){
var html=data.html?data.html:data;
panel.innerHTML=html;
var scrollable=_hasclass(panel,'scrollable');
goog.dom.getElement('playnav-video-panel-inner').style.overflow=(scrollable?'auto':'hidden');
if(data.css){
var styleElement=document.createElement('style');
styleElement.setAttribute('type','text/css');
if(styleElement.styleSheet){
styleElement.styleSheet.cssText=data.css;
}else{
styleElement.appendChild(document.createTextNode(data.css));
}
document.getElementsByTagName('head')[0].appendChild(styleElement);
}
if(data.js){
var scriptElement=document.createElement('script');
scriptElement.text=data.js;
document.getElementsByTagName('head')[0].appendChild(scriptElement);
}
if(data.js_exec){
eval(data.js_exec);
}
window.setTimeout(runPanelScriptsLater(name),0);
};
}
function selectPanel(name,opt_params,opt_dont_hide){
if(name.search(/^ls_/)>=0){
selectLiveStreamingPanel(name,opt_params,opt_dont_hide);
return;
}
isAutoplay_=(name.search(/^info|^favorite/)>=0);
var panel=goog.dom.getElement('playnav-panel-'+name);
var panelTab=goog.dom.getElement('playnav-panel-tab-'+name);
if(!panel||!panelTab)return;
_removeclass(goog.dom.getElement('playnav-panel-tab-'+curPanelName_),'panel-tab-selected');
_addclass(panelTab,'panel-tab-selected');
if(!opt_dont_hide){
goog.dom.getElement('playnav-panel-'+curPanelName_).style.display='none';
}
removePoppedElements();
panel.style.display='block';
curPanelName_=name;
if(name=='info'){
handlePanelLoaded(name,panel)(infoPanelData);
return;
}
if(!opt_dont_hide){
panel.innerHTML=goog.dom.getElement('playnav-spinny-graphic').innerHTML;
}
var params={
'video_id':curVideoId_,
'playlist_id':curPlaylistId_,
'playlist_name':curPlaylistName_
};
if(name=='info'){
params['video_index']=curVideoIndex_;
}
if(curSelection_){
var _tmp=goog.dom.getElement('ID2POST-'+curSelection_.id);
if(_tmp){
params['comment']=_tmp.attributes['name'].value;
}
}
if(opt_params){
for(n in opt_params){
params[n]=opt_params[n];
}
}
backend_.call_box_method(boxInfo_,params,'load_popup_'+name,
handlePanelLoaded(name,panel));
}
function selectLiveStreamingPanel(name,opt_params,opt_dont_hide){
var panel=goog.dom.getElement('playnav-panel-'+name);
var panelTab=goog.dom.getElement('playnav-panel-tab-'+name);
if(!panel||!panelTab)return;
_removeclass(goog.dom.getElement('playnav-panel-tab-'+curLiveStreamingPanelName_),'panel-tab-selected');
_addclass(panelTab,'panel-tab-selected');
if(!opt_dont_hide){
goog.dom.getElement('playnav-panel-'+curLiveStreamingPanelName_).style.display='none';
}
removePoppedElements();
panel.style.display='block';
curLiveStreamingPanelName_=name;
var videoId=yt.www.livestreaming.getVideoId();
if(!opt_dont_hide){
panel.innerHTML=goog.dom.getElement('playnav-spinny-graphic').innerHTML;
}
var params={
'video_id':videoId
};
if(opt_params){
for(n in opt_params){
params[n]=opt_params[n];
}
}
backend_.call_box_method(boxInfo_,params,'load_popup_'+name,handlePanelLoaded(name,panel));
}
function updateViewOnly(){
isViewUpdateRequested_=false;
var playnavPlayer=goog.dom.getElement('playnav-player');
if(playnavPlayer){
if(curViewName_=='play'){
setViewElementStyle('playnav-playview','display','block');
setViewElementStyle('playnav-gridview','display','none');
hideCachedPages('grid');
var verifyCoverDiv=goog.dom.getElement('playnav-player-restricted');
var isVerifyCoverVisible=verifyCoverDiv&&verifyCoverDiv.style.display!='none';
playnavPlayer.style.visibility=isVerifyCoverVisible?'hidden':'visible';
playnavPlayer.style.left=isVerifyCoverVisible?'960px':'0';
}else{
playnavPlayer.style.visibility='hidden';
playnavPlayer.style.left='960px';
setViewElementStyle('playnav-playview','display','none');
setViewElementStyle('playnav-gridview','display','block');
hideCachedPages('play');
}
}
}
function updateTab(){
if(window.location.hash==''&&!passedTroughInitTab_){
var initViewName=attemptToMap(viewNameMap,'-',curViewName_);
var initTabName=attemptToMap(tabNameMap,'-',initTab_);
var locationHash=initViewName+'/'+initTabName;
yt.history.add(locationHash,null,true);
passedTroughInitTab_=true;
}
switch(curPlaylistName_){
case 'user':case 'show':case 'season_clips':case 'season_episodes':
loadPlaylist(curPlaylistName_,curPlaylistId_);
break;
case 'search':
loadPlaylist(curPlaylistName_,null,curSearchQuery_);
break;
case 'uploads':
clearSearchQueryFields();
loadPlaylist(curPlaylistName_);
break;
case 'favorites':case 'all':case 'recent':case 'playlists':case 'topics':case 'shows':case 'live_streaming':
loadPlaylist(curPlaylistName_);
break;
}
}
function updateView(){
if(isViewUpdateRequested_){
updateViewOnly();
}
updateTab();
if(isViewUpdateRequested_){
isViewUpdateRequested_=false;
isViewUpdatePending_=true;
setTimeout(updateViewLater(),100);
}else{
isViewUpdatePending_=false;
}
}
function updateViewLater(){
return function(){updateView();};
}
function requestViewUpdate(){
if(!isViewUpdatePending_){
isViewUpdatePending_=true;
setTimeout(updateViewLater(),100);
}else{
isViewUpdateRequested_=true;
}
}
function clearSearchQueryFields(){
var base='upload_search_query-';
Iter(['grid','play']).each(function(post){
try{
goog.dom.getElement(base+post).value='';
}catch(e){}
});
}
var updateScrollbox=function(id,totalPages){
var box=goog.dom.getElement(id);
if(!box){
return;
}
if(!_hasclass(box,'outer-scrollbox')){
box=goog.dom.getElementsByTagNameAndClass('div','outer-scrollbox',box)[0];
if(!box){
return;
}
}
var curPlaylist=curPlaylistId_;
if(curPlaylist==null){
curPlaylist=curPlaylistName_;
}
goog.dom.removeNode(goog.dom.getElement(curPlaylist+'-cb'));
var moreVideosButtonElement=goog.dom.getElement(
'channels-'+curViewName_+
'-more-videos-button-'+curPlaylist);
var moreVideosLoadingElement=goog.dom.getElement(
'channels-'+curViewName_+
'-more-videos-loading-'+curPlaylist);
_addclass(moreVideosButtonElement,'hid');
var pages=goog.dom.getElementsByTagNameAndClass('div','loaded',box);
var nextIndex=pages.length;
var newPage=document.createElement('div');
newPage.id=['playnav',curViewName_,curPlaylist,'page',nextIndex].join('-');
newPage.className='scrollbox-page';
var scrollboxPage=goog.dom.getElement(
['playnav',curViewName_,curPlaylist,'items'].join('-'));
scrollboxPage.appendChild(newPage);
_removeclass(moreVideosLoadingElement,'hid');
pages=goog.dom.getElementsByTagNameAndClass('div','scrollbox-page',box);
var page=pages[nextIndex];
queuePlaylistPageLoad(page);
if(nextIndex+1>=totalPages){
goog.dom.removeNode(moreVideosButtonElement);
_addclass(moreVideosLoadingElement,'hid');
}
};
var userAgent=navigator.userAgent.toLowerCase();
var isIE6=userAgent.indexOf('msie 6')!=-1&&userAgent.indexOf('opera')==-1;
var isIE7=userAgent.indexOf('msie 7')!=-1;
var forceLayoutLater=function(el){
return function(){el.style.zoom='1';};
}
var resizeScrollbox=function(content,height){
if(!content)return;
var body=goog.dom.getElementsByTagNameAndClass('div','scrollbox-body',content)[0];
if(body){
if(isIE6){
content.style.zoom='0';
}
var padding=5;
var outerScrollbox=goog.dom.getElementsByTagNameAndClass('div','outer-scrollbox',body)[0];
var scrollHeight=height-outerScrollbox.offsetTop-padding;
body.style.height=scrollHeight+'px';
body.style.zoom='1';
if(isIE6){
content.style.height=scrollHeight+'px';
setTimeout(forceLayoutLater(content),0);
}
}
};
var resizeScrollboxes=function(node){
var scrollboxes=goog.dom.getElementsByTagNameAndClass('div','scrollbox-content',node);
var scrollboxLen=scrollboxes.length;
for(var i=0;i<scrollboxLen;i++){
resizeScrollbox(scrollboxes[i],595);
}
}
var resizePlayviewWrapper=function(){
setTimeout(resizePlayview,0);
}
var resizePlayview=function(){
var container=goog.dom.getElement('playnav-play-panel');
var content=goog.dom.getElement('playnav-play-content');
if(container.style.display=='none'||content.style.display=='none'){
return;
}
content.style.height=(container.offsetHeight-content.offsetTop)+'px';
resizeScrollboxes(content);
}
var resizeView=function(){
if(curViewName_=='play'){
resizePlayview();
}else{
resizeScrollboxes(goog.dom.getElement('playnav-grid-content'));
}
}
resizeScrollboxes=Thread.bind(resizeScrollboxes,'resizePlaynavScrollbox');
var getPlaylistBox=function(view,name,id){
var playlistId=(name=='user')?id:name;
return goog.dom.getElement(['playnav',view,playlistId,'scrollbox'].join('-'));
};
var playlistQueueHandler=function(page,view,name,id,query,sort,sortDirection){
return function(){
if(!_hasclass(page,'loaded')&&!_hasclass(page,'loading')){
_addclass(page,'loading');
var box=getPlaylistBox(view,name,id);
if(box){
box.__pageRequested=true;
}
var pageNum=parseInt(page.id.split('-').pop());
loadPlaylistPage(pageNum,view,name,id,query,sort,sortDirection);
return true;
}
return false;
};
};
var queuePlaylistPageLoad=function(page){
var box=getPlaylistBox(curViewName_,curPlaylistName_,curPlaylistId_);
if(!box.__queue){
box.__queue=[];
}
box.__queue.push(playlistQueueHandler(page,curViewName_,
curPlaylistName_,curPlaylistId_,curSearchQuery_,curSortName_,curSortDirection_));
if(!box.__pageRequested){
loadNextPlaylistPage(box);
}
};
var loadNextPlaylistPage=function(box){
box.__pageRequested=false;
if(box.__queue){
var loadPlaylist=box.__queue.pop();
while(loadPlaylist&&!loadPlaylist()){
loadPlaylist=box.__queue.pop();
}
}
};
function loadPlaylistPage(pageNum,viewName,playlistName,
opt_playlistId,opt_searchQuery,opt_sortName,opt_sortDirection){
if(navigatorNotReady()){
return;
}
var method='load_playlist_page';
var playlistId=(playlistName=='user')?opt_playlistId:playlistName;
var params={
'playlist_name':playlistName,
'encrypted_playlist_id':playlistId||'',
'query':opt_searchQuery||'',
'encrypted_shmoovie_id':playlistId==null?'':playlistId.substring(0,11),
'page_num':pageNum,
'view':viewName,
'playlist_sort':opt_sortName,
'playlist_sort_direction':opt_sortDirection
};
var sortEl=goog.dom.getElement([playlistId,'sort'].join('-'));
var sort=sortEl&&sortEl.innerHTML||'';
backend_.call_box_method(boxInfo_,params,method,
onPlaylistPageLoaded.bind(this,viewName,playlistId,pageNum)
);
}
function onPlaylistPageLoaded(viewName,playlistId,pageNum,html){
var boxId=['playnav',viewName,playlistId,'scrollbox'].join('-');
var pageId=['playnav',viewName,playlistId,'page',pageNum].join('-');
var page=goog.dom.getElement(pageId);
if(page){
page.innerHTML=html;
updateEllipses(page);
_removeclass(page,'loading');
_addclass(page,'loaded');
selectCurrentVideo();
if(scrollableItemSetupCallback_){
scrollableItemSetupCallback_(page);
}
var curPlaylist=curPlaylistId_;
if(curPlaylist==null){
curPlaylist=curPlaylistName_;
}
var moreVideosButtonElement=goog.dom.getElement(
'channels-'+curViewName_+
'-more-videos-button-'+curPlaylist);
var moreVideosLoadingElement=goog.dom.getElement(
'channels-'+curViewName_+
'-more-videos-loading-'+curPlaylist);
if(moreVideosButtonElement!=null){
_addclass(moreVideosLoadingElement,'hid');
_removeclass(moreVideosButtonElement,'hid');
}
loadNextPlaylistPage(goog.dom.getElement(boxId));
}
}
function hideCachedPages(opt_viewName){
if(!opt_viewName){
opt_viewName=curViewName_;
}
var viewNode=goog.dom.getElement('playnav-'+opt_viewName+'-content');
if(!viewNode){
return;
}
var otherEls=goog.dom.getElementsByTagNameAndClass('div','playnav-playlist-holder',viewNode);
var len=otherEls.length;
for(var i=0;i<len;i++){
var el=otherEls[i];
try{
el.style.display='none';
}catch(e){}
}
}
function invalidateTab(tabName){
invalidatedPlaylists_[tabName]={'play':true,'grid':true};
}
var elementsToDelete=[];
function loadPlaylist(playlistName,opt_playlistId,opt_searchQuery,opt_forceReload){
if(navigatorNotReady()){
return;
}
var playlistNameOrId=opt_playlistId||playlistName;
if(opt_playlistId){
curPlaylistId_=opt_playlistId;
}
selectTab(playlistName,true);
updateHistory(curViewName_,curPlaylistName_,playlistNameOrId);
var cachedEl=goog.dom.getElement(['playnav',curViewName_,'playlist',playlistNameOrId,'holder'].join('-'));
var isInvalidated=invalidatedPlaylists_[playlistName]&&invalidatedPlaylists_[playlistName][curViewName_];
if(opt_forceReload||isInvalidated){
if(isInvalidated){
delete invalidatedPlaylists_[playlistName][curViewName_];
}
if(cachedEl){
elementsToDelete.push(cachedEl);
cachedEl=null;
}
}
if(cachedEl){
hideCachedPages();
cachedEl.style.display='block';
resizeView();
var scrollArea=goog.dom.getElementsByTagNameAndClass('div','outer-scrollbox',cachedEl)[0];
if(scrollArea){
scrollArea.scrollTop=0;
}
updateEllipses(cachedEl);
selectCurrentVideo();
showArrangerIfRequested();
}else{
var method='load_playlist';
var params={};
var logging='&playlistName='+playlistName;
switch(playlistName){
case 'uploads':
logging+='&sort='+curSortName_;
logging+='&sortDirection='+curSortDirection_;
break;
case 'favorites':
case 'playlists':
case 'topics':
break;
case 'all':
case 'recent':
method='load_playlist_videos_multi';
break;
case 'user':
params['encrypted_playlist_id']=opt_playlistId;
break;
case 'show':case 'season_episodes':case 'season_clips':
params['encrypted_shmoovie_id']=opt_playlistId.substring(0,11);
break;
case 'search':
params['query']=opt_searchQuery||'';
curSearchQuery_=opt_searchQuery;
break;
}
params['playlist_name']=playlistName;
params['view']=curViewName_;
params['playlist_sort']=curSortName_;
params['playlist_sort_direction']=curSortDirection_;
var view=curViewName_;
backend_.call_box_method(boxInfo_,params,method,
playlistLoadedResponse.bind(this,view,playlistNameOrId),logging);
setViewLoading(curViewName_,true);
}
}
function playlistLoadedResponse(viewName,playlistNameOrId,html){
hideCachedPages();
Iter(elementsToDelete).each(function(el){
goog.dom.removeNode(el);
});
elementsToDelete=[];
var viewNode=goog.dom.getElement(['playnav',viewName,'content'].join('-'));
if(viewNode){
var node=document.createElement('div');
node.className='playnav-playlist-holder';
node.id=['playnav',viewName,'playlist',playlistNameOrId,'holder'].join('-');
var old=goog.dom.getElement(node.id);
if(old){
goog.dom.removeNode(old);
}
node.innerHTML=html;
viewNode.appendChild(node);
resizeView();
selectCurrentVideo();
setViewLoading(viewName,false);
showArrangerIfRequested();
}
}
function selectCurrentVideo(){
selectVideo(curSelection_);
}
function setViewLoading(view,isLoading){
var loadingEl=goog.dom.getElement('playnav-'+view+'-loading');
if(loadingEl){
loadingEl.style.display=isLoading?'block':'none';
}
}
function setVideoId(videoId){
curVideoId_=videoId;
}
function setPlaylistId(playlistId){
curPlaylistId_=playlistId;
selectTab('user',true);
}
function goToWatchPage(){
window.location.href='/watch?v='+curVideoId_;
}
function selectionTargets(){
return[
['playnav-video-play',curSelection_.p,curSelection_.i,curSelection_.v].join('-'),
['playnav-video-grid',curSelection_.p,curSelection_.i,curSelection_.v].join('-'),
['playnav-video-play',curSelection_.p+'-all',curSelection_.i,curSelection_.v].join('-'),
['playnav-video-grid',curSelection_.p+'-all',curSelection_.i,curSelection_.v].join('-'),
['playnav-video-play',curSelection_.p+'-live_streaming',curSelection_.i,curSelection_.v].join('-')
];
}
function selectVideoClass(classFunction){
return function(id){
var element=goog.dom.getElement(id);
if(element){
classFunction(element,'playnav-item-selected');
}
};
}
function selectVideo(selection){
if(curSelection_){
Iter(selectionTargets()).each(selectVideoClass(_removeclass));
}
curSelection_=selection;
if(curSelection_){
Iter(selectionTargets()).each(selectVideoClass(_addclass));
}
}
function playVideo(playlistNameOrId,videoIndex,videoId,opt_startSecs,opt_postId,opt_isFirstplayVideo){
isWritePlayerPending_=false;
pendingPlayerConfig=null;
var id=null;
if(!videoIndex&&opt_postId){
var _tmp=goog.dom.getElement('POST2ID-'+opt_postId);
if(_tmp){
id=_tmp.attributes['name'].value;
}
}
if(!id){
id=[curViewName_,playlistNameOrId,videoIndex,videoId].join('-');
}
if(!isSkipping_){
updateHistory('play',curPlaylistName_,playlistNameOrId,videoIndex,videoId);
}
closePopup();
if(curViewName_=='grid'&&!isSkipping_){
selectView('play');
}
var sanitizedPlaylistNameOrId=playlistNameOrId.replace('-all','').replace('-live_streaming','');
selectVideo({p:sanitizedPlaylistNameOrId,i:videoIndex,v:videoId,id:id});
curVideoIndex_=videoIndex;
curVideoId_=videoId;
currentPlayState_=PlayState.UNSTARTED;
hideAds();
resizePlayview();
requestPlayback(videoId,opt_isFirstplayVideo);
selectPanel('info');
if(videoIndex!=null){
try{
goog.dom.getElement('playnav-curplaylist-count').innerHTML=goog.dom.getElement('playnav-playlist-'+playlistNameOrId+'-count').value;
goog.dom.getElement('playnav-curplaylist-title').innerHTML=goog.dom.getElement('playnav-playlist-'+playlistNameOrId+'-title').innerHTML;
}catch(e){}
}
if(videoIndex==null){
if(goog.dom.getElement('playnav-curvideo-controls')){
goog.dom.getElement('playnav-curvideo-controls').style.visibility='hidden';
}
}else if(curSelection_){
}
if(window.event){
yt.events.stopPropagation();
}
}
function hideAds(){
function clearAndUnhide(id){
var el=goog.dom.getElement(id);
if(el){
el.innerHTML='';
_showdiv(id);
}
}
_hidediv('watch-channel-brand-div');
_hidediv('watch-longform-ad');
clearAndUnhide('ad300x250');
clearAndUnhide('google_companion_ad_div');
clearAndUnhide('instream_google_companion_ad_div');
clearAndUnhide('watch-longform-ad-placeholder');
}
function getNext(id){
var ind=id.lastIndexOf('-');
var ind2=id.lastIndexOf('-',ind-1);
return id.slice(0,ind2+1)+(parseInt(id.slice(ind2+1,ind))+1);
}
function getPrev(id){
var ind=id.lastIndexOf('-');
var ind2=id.lastIndexOf('-',ind-1);
return id.slice(0,ind2+1)+Math.max(parseInt(id.slice(ind2+1,ind))-1,0);
}
function skip(increment){
isSkipping_=true;
var currentIndex=parseInt(curSelection_.i);
var newIndex=currentIndex+increment;
if(newIndex<0)return;
var el=goog.dom.getElement('playnav-video-play-'+curSelection_.p+'-'+newIndex);
if(!el)return;
var videoId=el.innerHTML;
playVideo(curSelection_.p,newIndex,videoId);
isSkipping_=false;
}
function skipNext(){
skip(1);
}
function skipPrev(){
skip(-1);
}
function playAll(playlistId,firstVideoId){
playVideo(playlistId,0,firstVideoId,0,true);
selectPlaylist('user',playlistId);
}
var currentBottomPopup=null;
var currentPopupArrow=null;
function openBottomPopup(name,opt_params){
if(navigatorNotReady()){
return;
}
var popup=goog.dom.getElement(name+'-popup');
popup.style.display='';
arrow.style.display='';
goog.dom.getElement(name+'-popup-inner').innerHTML=goog.dom.getElement('playnav-spinny-graphic').innerHTML;
var callback=function(html){
goog.dom.getElement(name+'-popup-inner').innerHTML=html;
window.setTimeout(function(){run_scripts_in_el('playnav-panel-'+name)},0);
};
var params={'video_id':curVideoId_};
if(opt_params){
for(n in opt_params){
params[n]=opt_params[n];
}
}
backend_.call_box_method(boxInfo_,params,'load_popup_'+name,callback);
currentBottomPopup=popup;
}
function closePopup(){
if(currentBottomPopup){
currentBottomPopup.style.display='none';
currentPopupArrow.style.display='none';
var flag_floatie=goog.dom.getElement('popup_flagging_menu');
if(flag_floatie){
goog.dom.removeNode(flag_floatie);
}
}
}
function searchChannel(elementId){
var el=goog.dom.getElement(elementId);
var query=el.value;
if(query){
if(arranger_){
arrangerRestoreParams_=arranger_.save(true);
arrangerOpenRequested_='search';
arranger_.destruct(false);
}
invalidateTab('search');
selectPlaylist('search',null,query);
}
}
function clearFirstTime(inp){
if(!inp.__touched){
inp.__stored_value=inp.value;
inp.__stored_color=inp.style.color;
inp.value='';
inp.style.color='#333';
inp.__touched=true;
if(!inp.onblur){
inp.onblur=function(){
if(!inp.value){
inp.value=inp.__stored_value;
inp.style.color=inp.__stored_color;
inp.__touched=false;
}
};
}
}
}
function onPlayerStateChange(newState){
switch(newState){
case PlayState.ENDED:
if(currentPlayState_==PlayState.PLAYING&&isAutoplay_){
currentPlayState_=PlayState.UNSTARTED;
if(curSelection_.p&&curSelection_.p.search(/uploads|favorites|search/)<0){
isAutoskip_=true;
skipNext();
}
}
break;
case PlayState.PLAYING:
currentPlayState_=newState;
break;
}
}
function onPlayerError(){
if(isAutoskip_){
setTimeout(function(){
if(isAutoskip_){
skipNext();
}
},AUTOSKIP_ERROR_TIMEOUT);
}
currentPlayState_=PlayState.UNSTARTED;
}
function toggleFullVideoDescription(state){
var display=state?'block':'none';
var displayNot=state?'none':'block';
goog.dom.getElement('playnav-curvideo-description-more-holder').style.display=(state?'none':'block');
goog.dom.getElement('playnav-curvideo-description-less').style.display=(state?'inline':'none');
goog.dom.getElement('playnav-curvideo-description-container').style.height=state?'auto':'56px';
if(isIE7||isIE6){
goog.dom.getElement('playnav-video-panel-inner').style.height=state?'138px':'auto';
}
}
function toggleFullLiveStreamingEventDescription(state){
var display=state?'block':'none';
var displayNot=state?'none':'block';
goog.dom.getElement('playnav-curlivestream-description-more-holder').style.display=(state?'none':'block');
goog.dom.getElement('playnav-curlivestream-description-less').style.display=(state?'inline':'none');
goog.dom.getElement('playnav-curlivestream-description-container').style.height=state?'auto':'56px';
}
function verifyNotRequired(){
ageVerificationRequired_=false;
if(curViewName_=='play'){
goog.dom.getElement('playnav-player').style.visibility='visible';
goog.dom.getElement('playnav-player').style.left='0';
}
goog.dom.getElement('playnav-left-panel').style.display='block';
goog.dom.getElement('playnav-player-restricted').style.display='none';
}
function verifyAge(id,title,opt_url,opt_message){
ageVerificationRequired_=true;
var nextUrl=encodeURIComponent(document.location.href.toString());
var redirectUrl='';
if(opt_url){
redirectUrl=opt_url.replace('url_placeholder',nextUrl);
redirectUrl=redirectUrl.replace('url_encode2',encodeURIComponent(nextUrl));
}
deletePlayer();
goog.dom.getElement('playnav-left-panel').style.display='none';
goog.dom.getElement('playnav-player').style.visibility='hidden';
goog.dom.getElement('playnav-player').style.left='960px';
goog.dom.getElement('playnav-restricted-title').innerHTML=title;
if(opt_message){
goog.dom.getElement('playnav-custom-error-message').innerHTML=opt_message;
}
var overlayDiv=goog.dom.getElement('playnav-player-restricted');
var textDivs=goog.dom.getElementsByTagNameAndClass('div','playnav-restricted-msg',overlayDiv);
for(var i=0;i<textDivs.length;i++){
textDivs[i].style.display='none';
}
var anchorDivs=goog.dom.getElementsByTagNameAndClass('a','playnav-restricted-link',overlayDiv);
for(var i=0;i<anchorDivs.length;i++){
anchorDivs[i].href=redirectUrl;
}
goog.dom.getElement('playnav-'+id).style.display='block';
overlayDiv.style.display='block';
}
function makeUserAction(fref){
return function(){
isAutoskip_=false;
isAutoplay_=true;
fref.apply(this,arguments);
};
}
function requireDomLoadedDecorator(callback){
return function(){
var args=arguments;
if(!isDomLoaded_){
playnav.onDomLoaded.push(function(){
callback.apply(this,args);
});
}else{
callback.apply(this,args);
}
};
}
function destructArranger(opt_doNotShowConfirmation){
if(arranger_){
return arranger_.destruct(!opt_doNotShowConfirmation);
}
return true;
}
function saveArranger(){
arranger_.save();
}
function cancelArranger(){
arranger_.cancel();
}
function updateArrangerItemCount(count){
arranger_.updateItemCount(count);
}
function arrangerReady(playlistName){
return playlistName==curPlaylistName_&&
curViewName_=='grid'&&
goog.dom.getElement('playnav-arranger-'+playlistName);
}
function showArranger(playlistName){
if(!arranger_){
arranger_=new Arranger(playlistName,function(){
arranger_=null;
},arrangerRestoreParams_);
}
arrangerOpenRequested_=null;
arrangerRestoreParams_=null;
}
function showArrangerIfRequested(){
if(arrangerOpenRequested_&&arrangerReady(arrangerOpenRequested_)){
showArranger(arrangerOpenRequested_);
}
}
function toggleArranger(playlistName){
if(arranger_){
destructArranger(true);
}else if(arrangerReady(playlistName)){
showArranger(playlistName);
}else{
arrangerOpenRequested_=playlistName;
selectTab(playlistName);
selectView('grid');
}
}
function sort(sortName,opt_sortDirection){
if(arranger_){
arrangerRestoreParams_=arranger_.save(true);
arrangerOpenRequested_=curPlaylistId_;
arranger_.destruct(false);
}
curSortName_=sortName;
curSortDirection_=opt_sortDirection||'desc';
invalidateTab(curPlaylistName_);
selectPlaylist(curPlaylistName_);
}
function like(){
goog.dom.classes.remove(goog.dom.getElement('watch-unlike'),'active');
goog.dom.classes.add(goog.dom.getElement('watch-like'),'active');
var loggedOut=goog.dom.getElement('channel-like-logged-out');
if(loggedOut){
goog.dom.classes.remove(loggedOut,'hid');
return;
}
goog.dom.getElement('watch-actions-area').innerHTML=
goog.dom.getElement('channel-like-loading').innerHTML;
goog.dom.classes.remove(goog.dom.getElement('channel-like-result'),'hid');
var form=document.forms['likeForm'];
var options={
'postBody':goog.dom.forms.getFormDataString(form),
'onComplete':function(){
goog.dom.getElement('watch-actions-area').innerHTML=
goog.dom.getElement('channel-like-close').innerHTML+
goog.dom.getElement('watch-actions-area').innerHTML;
goog.dom.classes.remove(goog.dom.getElement('channel-like-result'),'hid');
},
'update':'watch-actions-area',
'method':'POST'
};
var url=form.action+'?log_action_like_video=1';
yt.net.ajax.sendRequest(url,options);
};
function unlike(){
goog.dom.classes.remove(goog.dom.getElement('watch-like'),'active');
goog.dom.classes.add(goog.dom.getElement('watch-unlike'),'active');
var loggedOut=goog.dom.getElement('channel-like-logged-out');
if(loggedOut){
goog.dom.classes.remove(loggedOut,'hid');
return;
}
goog.dom.getElement('watch-actions-area').innerHTML=
goog.dom.getElement('channel-like-loading').innerHTML;
goog.dom.classes.remove(goog.dom.getElement('channel-like-result'),'hid');
var form=document.forms['unlikeForm'];
var options={
'postBody':goog.dom.forms.getFormDataString(form),
'onComplete':function(){
goog.dom.getElement('watch-actions-area').innerHTML=
goog.dom.getElement('channel-like-close').innerHTML+
goog.dom.getElement('watch-actions-area').innerHTML;
goog.dom.classes.remove(goog.dom.getElement('channel-like-result'),'hid');
},
'update':'watch-actions-area',
'method':'POST'
};
var url=form.action+'?log_action_unlike_video=1';
yt.net.ajax.sendRequest(url,options);
};
function hideLike(){
goog.dom.classes.add(goog.dom.getElement('channel-like-result'),'hid');
}
function submitFormDictAjax(formDict,method,callback){
backend_.call_box_method(boxInfo_,formDict,method,callback);
}
function submitFormAjax(form,method,callback){
submitFormDictAjax(form_to_dict(form),method,callback);
}
function playEvent(playlistId,eventIndex,eventId){
if(playlistId=='previous-live_streaming'){
updateTab();
showProperPlayerArea(playlistId);
playVideo(playlistId,eventIndex,eventId);
}else if(yt.www.livestreaming.selectEvent(eventId)){
id=[curViewName_,playlistId,eventIndex,eventId].join('-');
updateHistory('play',curPlaylistName_,playlistId,eventIndex,eventId);
selectVideo({p:playlistId,i:eventIndex,v:eventId,id:id});
if(yt.www.livestreaming.getVideoId()){
playnav.selectPanel('ls_info');
}
}
}
playnav['getPlayer']=function(){return player_;};
playnav['getPlaylistId']=function(){return curPlaylistId_;};
playnav['setInitialView']=setInitialView;
playnav['setInitialTab']=setInitialTab;
playnav['initDom']=initDom;
playnav['initPlayer']=initPlayer;
playnav['isInitted']=function(){return player_?true:false;};
playnav['invalidateTab']=invalidateTab;
playnav['setBoxInfo']=setBoxInfo;
playnav['selectTab']=requireDomLoadedDecorator(selectTab);
playnav['selectView']=requireDomLoadedDecorator(selectView);
playnav['openBottomPopup']=requireDomLoadedDecorator(openBottomPopup);
playnav['closePopup']=closePopup;
playnav['setVideoId']=setVideoId;
playnav['setPlaylistId']=setPlaylistId;
playnav['searchChannel']=searchChannel;
playnav['goToWatchPage']=goToWatchPage;
playnav['updateScrollbox']=updateScrollbox;
playnav['clearFirstTime']=clearFirstTime;
playnav['resizePlayview']=requireDomLoadedDecorator(resizePlayviewWrapper);
playnav['verifyNotRequired']=requireDomLoadedDecorator(verifyNotRequired);
playnav['verifyAge']=requireDomLoadedDecorator(verifyAge);
playnav['onPlayerStateChange']=onPlayerStateChange;
playnav['onPlayerError']=onPlayerError;
playnav['handleLocationHashUpdate']=handleLocationHashUpdate;
playnav['handlePanelLoaded']=handlePanelLoaded;
playnav['toggleFullVideoDescription']=toggleFullVideoDescription;
playnav['toggleFullLiveStreamingEventDescription']=toggleFullLiveStreamingEventDescription;
playnav['hideCachedPages']=hideCachedPages;
playnav['playVideo']=requireDomLoadedDecorator(playVideo);
playnav['loadPlaylist']=requireDomLoadedDecorator(loadPlaylist);
playnav['selectPlaylist']=requireDomLoadedDecorator(loadPlaylist);
playnav['selectPanel']=requireDomLoadedDecorator(selectPanel);
playnav['selectVideo']=requireDomLoadedDecorator(selectVideo);
playnav['playEvent']=requireDomLoadedDecorator(playEvent);
playnav['playAll']=playAll;
playnav['skipNext']=makeUserAction(skipNext);
playnav['skipPrev']=makeUserAction(skipPrev);
playnav['sort']=makeUserAction(sort);
playnav['setupScrollableItems']=setupScrollableItems;
playnav['resizeScrollbox']=resizeScrollboxes;
playnav['getBoxInfo']=function(){
return boxInfo_;
};
playnav['getCurPlaylistName']=function(){return playlistNameToTabName(curPlaylistName_);};
playnav['getCurrentScrollboxId']=getCurrentScrollboxId;
playnav['saveArranger']=saveArranger;
playnav['cancelArranger']=cancelArranger;
playnav['updateArrangerItemCount']=updateArrangerItemCount;
playnav['toggleArranger']=toggleArranger;
playnav['handleVideoMetadata']=handleVideoMetadata;
playnav['like']=like;
playnav['unlike']=unlike;
playnav['hideLike']=hideLike;
playnav['submitFormDictAjax']=submitFormDictAjax;
playnav['submitFormAjax']=submitFormAjax;
})();
function removeElementById(id){
var el=goog.dom.getElement(id);
if(el){
removeElement(el);
}
}
function removeElement(el){
el.parentNode.removeChild(el);
}
window.poppedElements=[];
function removePoppedElements(){
Iter(window.poppedElements).each(function(el){
el.parentNode.removeChild(el);
});
window.poppedElements=[];
}
function popDivToTop(el){
el=goog.dom.getElement(el);
if(!el.__popped){
poppedElements.push(el);
var pos=goog.style.getPosition(el);
el.style.position='absolute';
el.style.top=pos.y+'px';
el.style.left=pos.x+'px';
document.body.appendChild(el);
el.__popped=true;
}
}
function onChannelPlayerReady(){
playnav.initPlayer('movie_player',window.defaultPlaylistName);
}
function submitToPlaylist(form){
var successCallback=function(xhr){
playnav.selectPanel('playlists',{'success':true});
};
yt.net.ajax.sendRequest(form.action,{
postBody:goog.dom.forms.getFormDataString(form),
onComplete:successCallback
});
}
function update_featured(input){
goog.dom.getElement('featured_content').style.visibility='visible';
var feature_option=goog.dom.getElement('feature_'+input.value);
if(input.checked){
feature_option.style.display='';
feature_option.disabled=false;
}else{
feature_option.style.display='none';
feature_option.disabled=true;
if(feature_option.selected||has_selected_child(feature_option)){
var select=feature_option.parentNode;
if(select.tagName.toLowerCase()!='select')select=select.parentNode;
if(!pick_first_option(select)){
goog.dom.getElement('featured_content').style.visibility='hidden';
}
}
}
if(input.value=='playlists'){
goog.dom.getElement('arrange_playlists').style.display=input.checked?'':'none';
}
var playlists_available=0;
var feature_playlists=goog.dom.getElement('feature_playlists');
feature_playlists.style.display='none';
feature_playlists.disabled=true;
var all_playlists_option=null;
for(var i=1;i<feature_playlists.childNodes.length;i++){
if(feature_playlists.childNodes[i].value=='playlists'){
all_playlists_option=feature_playlists.childNodes[i];
}else if(feature_playlists.childNodes[i].style&&feature_playlists.childNodes[i].style.display==''){
playlists_available++;
}
}
if(playlists_available>0){
feature_playlists.style.display='';
feature_playlists.disabled=false;
if(all_playlists_option){
all_playlists_option.style.display=(playlists_available>1)?'':'none';
all_playlists_option.disabled=(playlists_available<2);
}
}
var num_displayed=0;
if(goog.dom.getElement('display_uploads').checked)num_displayed++;
if(goog.dom.getElement('display_favorites').checked)num_displayed++;
if(goog.dom.getElement('display_playlists').checked&&playlists_available>0)num_displayed++;
if(num_displayed>1){
goog.dom.getElement('display_all').disabled=false;
_removeclass(goog.dom.getElement('display_all_container'),'opacity50');
}else{
goog.dom.getElement('display_all').disabled=true;
_addclass(goog.dom.getElement('display_all_container'),'opacity50');
}
}
window.update_featured=Thread.bind(update_featured);
function pick_first_option(select){
for(var i=0;i<select.options.length;i++){
var option=select.options[i];
if(option.style.display==''&&option.parentNode.style.display==''){
option.selected=true;
return true;
}
}
return false;
}
function has_selected_child(optgroup){
if(optgroup.tagName.toLowerCase()!='optgroup'){
return false;
}
for(var i=0;i<optgroup.childNodes.length;i++){
if(optgroup.childNodes[i].selected){
return true;
}
}
return false;
}
function handleAdLoaded(){
playnav.resizePlayview();
}
yt.www.watch.ads.handleAdLoaded=handleAdLoaded;
function checkCurrentVideo(){
}
yt.www.watch.player.checkCurrentVideo=checkCurrentVideo;
window.checkCurrentVideo=checkCurrentVideo;