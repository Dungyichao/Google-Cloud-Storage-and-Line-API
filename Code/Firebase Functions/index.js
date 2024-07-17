/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


const functions = require("firebase-functions");
const fetch = require("node-fetch");
var admin = require("firebase-admin");

const {
    log,
    info,
    debug,
    warn,
    error,
    write,
  } = require("firebase-functions/logger");

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
//var serviceAccount = require("path/to/serviceAccountKey.json");
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

 exports.helloWorld = functions.https.onRequest((request, response) => {
   functions.logger.info("Hello logs!", {structuredData: true});
   response.send("Hello from Firebase Line!");
 });

 exports.LineMessAPI = functions.https.onRequest((request, respond) => {
    //var event = request.body.events[0]
    var event = request.body.events[0];
    functions.logger.log(JSON.stringify(event));
    var userId = event.source.userId;
    var timestamp = event.timestamp;
    var replyToken = event.replyToken;
    var userText = event.message.text;
    if (event.type === "message" && event.message.type === "text"){
        userText = event.message.text
    } else {
        userText = "(Message type is not text)";
    }
    db.collection("chat-history").doc(timestamp.toString()).set({
        "userId": userId,
        "Message": userText,
        "timestamp": timestamp
    })

    db.collection("Customer").doc(userId).get().then( returnData =>{
        if (returnData.exists){
          var name = returnData.data().name
          var surname = returnData.data().surname
          var nickname = returnData.data().nickname
          reply_message(replyToken, `Hello ${nickname}(${name} ${surname})`)
        } else {
          reply_message(replyToken, "You are not the customer, Register?")
        }
        return null
    }).catch(err => {
        console.log(err)
    })

    return respond.status(200).send(request.method);
});

const LINE_HEADER = {
    "Content-Type": "application/json",
    "Authorization": "Bearer pdfdfdskiwskgUyeKlgq65fg8h1JwdB04t89/1O/w1sdfdwefbdwefbthxddfsdfs89465dsgN/fsdfsasdrewahhRsfsdsdfasdweeg8465pdfdfdskiwskgUyeKlgq65fg8hg8h1JwdB04t89/1O/w1sdfdwefbthxddfsdfs89465dsdFU="
  }

function reply_message(replytoken,textfrom){
    fetch("https://api.line.me/v2/bot/message/reply",{
        method: "post",
        body:    JSON.stringify({
            replyToken: replytoken,
            messages: [
              {
                type: "text",
                text: textfrom
              }
            ]
          }),
        headers: LINE_HEADER,
    }).then(res => res.json())
    .then((json) =>{
        functions.logger.log(JSON.stringify(json));
    } );
}

function push_message(to_person,textfrom){
    fetch("https://api.line.me/v2/bot/message/push",{
        method: "post",
        body:    JSON.stringify({
            to: to_person,
            messages: [
              {
                type: "text",
                text: textfrom
              }
            ]
          }),
        headers: LINE_HEADER,
    }).then(res => res.json())
    .then((json) =>{
        functions.logger.log(JSON.stringify(json));
    } );
}

function multicast_message(to_person_arr,textfrom){
    fetch("https://api.line.me/v2/bot/message/multicast",{
        method: "post",
        body:    JSON.stringify({
            to: to_person_arr,
            messages: [
              {
                type: "text",
                text: textfrom
              }
            ]
          }),
        headers: LINE_HEADER,
    }).then(res => res.json())
    .then((json) =>{
        functions.logger.log(JSON.stringify(json));
    } );
}

exports.ITLineMessAPI = functions.https.onRequest(async (request, respond) => {
    //var event = request.body.events[0]
    var event = request.body.events[0];
    //functions.logger.log(JSON.stringify(event));
    var userId = event.source.userId;
    var timestamp = event.timestamp;
    var replyToken = event.replyToken;
    var userText = event.message.text;
    if (event.type === "message" && event.message.type === "text"){
        userText = event.message.text
    } else {
        userText = "(Message type is not text)";
    }
    // db.collection("chat-history").doc(timestamp.toString()).set({
    //     "userId": userId,
    //     "Message": userText,
    //     "timestamp": timestamp
    // })

    functions.logger.log(timestamp + "," + userId + "," + userText);

    var temp_data = await Get_Department_Info("IT");
    var all_userID = temp_data[0];
    var all_keyword = temp_data[1];
    var text_mentioned_keywords = "";

    //functions.logger.log(all_userID);
    //functions.logger.log(all_keyword);
    //functions.logger.log(userText);

    if(!all_userID.includes(userId)){
        var keyword_match_count = 0;
        all_keyword.forEach((keyword) => {
            if(userText.includes(keyword)){
                text_mentioned_keywords += keyword + ",";
                keyword_match_count++;               
            }
        })
        if(keyword_match_count > 0){
            //reply_message(replyToken, "IT Please Help");
            multicast_message(all_userID, "IT Help: "+ text_mentioned_keywords + ", --Original Text: " + userText);      
        }
    }
    else{
        //reply_message(replyToken, "Inside Department User Message");
        var keyword_match_count = 0;
        all_keyword.forEach((keyword) => {
            if(userText.toLowerCase().includes(keyword)){
                text_mentioned_keywords += keyword + ",";
                keyword_match_count++;               
            }
        })
        if(keyword_match_count > 0){
            //reply_message(replyToken, "IT Please Help");
            multicast_message(all_userID, "IT Replied: " + text_mentioned_keywords + ", --Original Text: " + userText);        
        }
    }
    return respond.status(200).send(request.method);
});


async function Get_Department_Info(department){
    var all_data = [];
    var all_userID = [];
    var all_keyword = [];

    await db.collection("KeyWord").doc(department).get().then( returnData =>{

        if (returnData.exists){
          
          var keywords = returnData.data().keywords
          var UserID = returnData.data().UserID

          var split_user_string = UserID.split(",");
          split_user_string.forEach((data)=>{
            all_userID.push(data.trim());
          })

          var split_keyword_string = keywords.split(",");
          split_keyword_string.forEach((data)=>{
            all_keyword.push(data.trim().toLowerCase());
          })

        } 
        return null
    }).catch(err => {
        console.log(err)
    })

    all_data.push(all_userID);
    all_data.push(all_keyword);

    return  await all_data;
}

