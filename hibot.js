const scriptName = "Hibot";//BotName
const Context = android.content.Context;
const SQLiteDatabase = android.database.sqlite.SQLiteDatabase;
const DatabaseUtils = android.database.DatabaseUtils;
const PowerManager = android.os.PowerManager;
const Base64 = android.util.Base64;
const ProcessBuilder = java.lang.ProcessBuilder;
const Process = java.lang.Process;
const InputStreamReader = java.io.InputStreamReader;
const OutputStreamReader = java.io.OutputStreamReader;
const BufferedReader = java.io.BufferedReader;
const ArrayList = java.util.ArrayList;
const _Array = java.lang.reflect.Array;
const _Byte = java.lang.Byte;
const _Integer = java.lang.Integer;
const Runtime = java.lang.Runtime;
const _String = java.lang.String;
const Timer = java.util.Timer;
const TimerTask = java.util.TimerTask;
const Cipher = javax.crypto.Cipher;
const IvParameterSpec = javax.crypto.spec.IvParameterSpec;
const System = java.lang.System;
const PBEKeySpec = javax.crypto.spec.PBEKeySpec;
const SecretKeyFactory = javax.crypto.SecretKeyFactory;
const SecretKeySpec = javax.crypto.spec.SecretKeySpec;

const JSONObject = org.json.JSONObject;

const MY_KEY = "298920935";//KakaoTalk2.db->open_profile->user_id

let pm = Api.getContext().getSystemService(Context.POWER_SERVICE);
let wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, scriptName);
wakeLock.acquire();

let db = null;
let db2 = null;

function toByteArray(bytes) {
	let res = _Array.newInstance(_Byte.TYPE, bytes.length);
	for (var i = 0; i < bytes.length; i ++) {
		res[i] = new _Integer(bytes[i]).byteValue();
	}
	return res;
}
function toCharArray(chars) {
	return new _String(chars.map((e) => String.fromCharCode(e)).join("")).toCharArray();
}

function decrypt(userId, enc, text) {
	try {
		let iv = toByteArray([15, 8, 1, 0, 25, 71, 37, -36, 21, -11, 23, -32, -31, 21, 12, 53]);
		let password = toCharArray([22, 8, 9, 111, 2, 23, 43, 8, 33, 33, 10, 16, 3, 3, 7, 6]);
		let prefixes = ["", "", "12", "24", "18", "30", "36", "12", "48", "7", "35", "40", "17", "23", "29", "isabel", "kale", "sulli", "van", "merry", "kyle", "james", "maddux", "tony", "hayden", "paul", "elijah", "dorothy", "sally", "bran"];
		let salt = new _String((prefixes[enc] + userId).slice(0, 16).padEnd(16, "\0")).getBytes("UTF-8");
		let secretKeySpec = new SecretKeySpec(SecretKeyFactory.getInstance("PBEWITHSHAAND256BITAES-CBC-BC").generateSecret(new PBEKeySpec(password, salt, 2, 256)).getEncoded(), "AES");
		let ivParameterSpec = new IvParameterSpec(iv);
		let cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
		cipher.init(2, secretKeySpec, ivParameterSpec);
		return String(new _String(cipher.doFinal(Base64.decode(text, 0)), "UTF-8"));
	} catch (e) {
		Log.error(e.lineNumber+": "+e);
		return null;
	}
}
function requestPermission() {
	try {
		var cmd = new ArrayList();
		cmd.add("msgbot.sh");
		var ps = new ProcessBuilder(cmd);
		ps.redirectErrorStream(true);
		var pr = ps.start();
		var in1 = new BufferedReader(new InputStreamReader(pr.getInputStream()));
		var line;
		while ((line = in1.readLine()) != null) {
			Log.d(line);
		}
		pr.waitFor();
		in1.close();
		return true;
	} catch (e) {
		Log.error(e.lineNumber+": "+e);
		return false;
	}
}
function initializeDB() {
	requestPermission();
	try {
		var kakao1="/storage/emulated/0/KakaoTalk.db", kakao2="/storage/emulated/0/KakaoTalk2.db";
		if (db != null && db2 != null) {
			db.close();
			db2.close();
		}
		if(!FileStream.read(kakao1))
			Log.error(kakao1+":No such file or directory");
		else
			db = SQLiteDatabase.openDatabase(kakao1, null, 0);

		if(!FileStream.read(kakao2))
			Log.error(kakao2+":No such file or directory");
		else
			db2 = SQLiteDatabase.openDatabase(kakao2, null, 0);
		return true;
	} catch (e) {
		Log.error(e.lineNumber+": "+e);
		requestPermission();
		return false;
	}
}
function getRecentChatData(count) {
	try {
		let cursor = db.rawQuery("SELECT * FROM chat_logs", null);
		cursor.moveToLast();
		let data = [];
		while (count --) {
			let obj = {};
			let columns = [
				"_id",
				"id",
				"type",
				"chat_id",
				"user_id",
				"message",
				"attachment",
				"created_at",
				"deleted_at",
				"client_message_id",
				"prev_id",
				"referer",
				"supplement",
				"v"
			];
			for (let i = 0; i < columns.length; i ++) {
				obj[columns[i]] = cursor.getString(i);
				if (columns[i] == "v") {
					obj.v = JSON.parse(obj.v);
				}
			}
			data.push(obj);
			cursor.moveToPrevious();
		}
		cursor.close();
		return data;
	} catch (e) {
		Log.error(e.lineNumber+": "+e);
		return null;
	}
}
function getRoomName(chat_id) {
	try {
		let room = "";
		let cursor = db.rawQuery("SELECT link_id FROM chat_rooms WHERE id=" + chat_id, null);
		cursor.moveToNext();
		let link_id = cursor.getString(0);
		cursor.close();
		if (link_id != null) {
			let cursor2 = db2.rawQuery("SELECT name FROM open_link WHERE id=" + link_id, null);
			cursor2.moveToNext();
			room = cursor2.getString(0);
			cursor2.close();
		} else {
			return null;
		}
		return room;
	} catch (e) {
		Log.error(e.lineNumber+": "+e);
		return null;
	}
}

function getUserInfo(user_id, info) {
	try {
		let cursor = db2.rawQuery("SELECT * FROM friends WHERE id=" + user_id, null);
		cursor.moveToNext();
		let data = {};
		let columns = [
			"_id",
			"contact_id",
			"id",
			"type",
			"uuid",
			"phone_number",
			"raw_phone_number",
			"name",
			"phonetic_name",
			"profle_image_url",
			"full_profile_image_url",
			"original_profile_image_url",
			"status_message",
			"chat_id",
			"brand_new",
			"blocked",
			"favorite",
			"position",
			"v",
			"board_v",
			"ext",
			"nick_name",
			"user_type",
			"story_user_id",
			"accout_id",
			"linked_services",
			"hidden",
			"purged",
			"suspended",
			"member_type",
			"involved_chat_ids",
			"contact_name",
			"enc",
			"created_at",
			"new_badge_updated_at",
			"new_badge_seen_at",
			"status_action_token"
		];
		for (let i = 0; i < columns.length; i ++) {
			data[columns[i]] = cursor.getString(i);
		}
		cursor.close();
		switch(info){
			case "_id": return data._id;
			case "contact_id": return data.contact_id;
			case "id": return data.id;
			case "type": return data.type;
			case "uuid": return data.uuid;
			case "phone_number": return data.phone_number;
			case "raw_phone_number": return data.raw_phone_number;
			case "name": return decrypt(MY_KEY, data.enc, data.name);
			case "phonetic_name": return data.phonetic_name;
			case "profle_image_url": return decrypt(MY_KEY, data.enc, data.profle_image_url);
			case "full_profile_image_url": return decrypt(MY_KEY, data.enc, data.full_profile_image_url);
			case "original_profile_image_url": return decrypt(MY_KEY, data.enc, data.original_profile_image_url);
			case "status_message": return decrypt(MY_KEY, data.enc, data.status_message);
			case "chat_id": return data.chat_id;
			case "brand_new": return data.brand_new;
			case "blocked": return data.blocked;
			case "favorite": return data.favorite;
			case "position": return data.position;
			case "v": return decrypt(MY_KEY, data.enc, data.v);
			case "board_v": return data.board_v;
			case "ext": return data.ext;
			case "nick_name": return data.nick_name;
			case "user_type": return data.user_type;
			case "story_user_id": return data.story_user_id;
			case "accout_id": return data.accout_id;
			case "linked_services": return data.linked_services;
			case "hidden": return data.hidden;
			case "purged": return data.purged;
			case "suspended": return data.suspended;
			case "member_type": return data.member_type;
			case "involved_chat_ids": return data.involved_chat_ids;
			case "contact_name": return decrypt(MY_KEY, data.enc, data.contact_name);
			case "enc": return data.enc;
			case "created_at": return data.created_at;
			case "new_badge_updated_at": return data.new_badge_updated_at;
			case "new_badge_seen_at": return data.new_badge_seen_at;
			case "status_action_token": return data.status_action_token;
			default: throw "requsted Unknown info";
		}
	} catch (e) {
		Log.error(e.lineNumber+": "+e);
		return null;
	}
}
function DatabaseWatcher() {
	this.looper = null;
	this.pre = null;
}
DatabaseWatcher.prototype = {
	start: function () {
		if (this.looper == null) {
			Log.debug("looper is null");
			this.looper = new Timer();
			this.looper.scheduleAtFixedRate(new TimerTask({
				run: function () {
					try {
						if(!Api.isOn(scriptName)){///봇이 안꺼지는 문제 해결
							watcher.stop();
							return;
						}
						if (initializeDB()) {
							let count = DatabaseUtils.queryNumEntries(db, "chat_logs", null);
							if (this.pre == null) {
								Log.d("first execute");
								this.pre = count;
							} else {
								let change = count - this.pre;
								this.pre = count;
								if (change > 0) {//if something changed
									let stack = getRecentChatData(change);
									while (stack.length > 0) {
										let obj = stack.pop();
										obj.message = decrypt(obj.user_id, obj.v.enc, obj.message);
										Log.d(obj.message);
										let room = getRoomName(obj.chat_id);
										let send_username = getUserInfo(obj.user_id, "name");
										/*if(send_username == null) */send_username = "";
										//else if(obj.v.origin == "KICKMEM") send_username = send_username + "님이 ";
										//else send_username = send_username + "님 ";
										if (obj.v.origin == "NEWMEM")
											Api.replyRoom(room, send_username + "안녕하세요! 공지에 있는 규칙 필독해주세요.");
										else if (obj.v.origin == "DELMEM" && JSONObject(obj.message).get("feedType") == 2)
											Api.replyRoom(room, send_username + "안녕히가세요!");
										else if (obj.v.origin == "KICKMEM" || obj.v.origin == "DELMEM"){
											obj.message = new JSONObject(obj.message);
											let by = getUserInfo(obj.message.get("member").getString("userId"), "name");
											/*if(by == null) */by = "";
											//else by = by + "님을 ";
											if(by == "" && send_username == "") Api.replyRoom(room, "다음부턴 착하게 사세요!");
											else Api.replyRoom(room, send_username + by + "강퇴하였습니다. 다음부턴 착하게 사세요!");
										}
										/*else if (obj.type == 26 && obj.message == "who") {
											obj.attachment = new JSONObject(decrypt(obj.user_id, obj.v.enc, obj.attachment));
											let userid = obj.attachment.getString("src_userId");
											Api.replyRoom(room, "이름: "+getUserInfo(userid, "name")
											+"\n프로필 사진: "+getUserInfo(userid, "original_profile_image_url")
											+"\n상태 메시지: "+getUserInfo(userid, "status_message"));
										}*/
										else if (obj.type == 26 && obj.message == "photolink") {
											obj.attachment = new JSONObject(decrypt(obj.user_id, obj.v.enc, obj.attachment));
											/*if(obj.attachment.get("src_type") != 2)
											{
												Api.replyRoom(room, "사진이 아닙니다!");
												return;
											}*/
											let chat_id = obj.attachment.get("src_logId");
											let cursor = db.rawQuery("SELECT * FROM chat_logs WHERE id=" + chat_id, null);
											cursor.moveToNext();
											let userId1=cursor.getString(4), msg1=cursor.getString(6);
											cursor.close();
											let photo = decrypt(userId1, getUserInfo(userId1, "enc"), msg1);
											photo = new JSONObject(photo);
											Api.replyRoom(room, "링크: "+photo.get("url"));
										}
									}
								}
							}
						}
					} catch (e) {
						Log.error(e.lineNumber+": "+e);
					}
				}
			}), 0, 1000);
			return true;
		}
		return false;
	},
	stop: function () {
		if (this.looper != null) {
			this.looper.cancel();
			this.looper = null;
			return true;
		}
		return false;
	}
};
let watcher = new DatabaseWatcher();
watcher.start();

function onStartCompile() {
	watcher.stop();
}
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
	if(msg == "!bot-off")
	{
		replier.reply(scriptName+"을(를) 종료합니다.");
		watcher.stop();
		Api.off(scriptName);
	}
}
function onCreate(savedInstanceState, activity) {
}
function onStart(activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
