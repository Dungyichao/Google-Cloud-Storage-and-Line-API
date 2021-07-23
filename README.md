# Sending LINE message with Google Cloud Storage and Line API
# 1. What is the Goal <br />

The main goal is to use C# program to send image or text message to LINE app chat room. Firebase and Google Cloud Storage will also be involved to achieve the goal. Some useful official documentary links are listed below
* LINE Developers: https://developers.line.biz/en/reference/messaging-api/
* Google Cloud Storage Client: https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-csharp
* Firebase Function and Firestore: https://firebase.google.com/docs/functions/write-firebase-functions

## 1.1 Program Overview
<p align="center">
<img src="/image/overview1.jpg" height="90%" width="90%">  
  
  System structure
</p>

As you can see from the above image of the structure of our program, there are many elements. Have you ever think why do we need so many parts to achieve such simple goal? The reason are as following
* LINE user ID is not the same one you usually used to add new friend. The ID contains numeric and alphabetic characters such as "U9d70e010e48a1t93634a60cf1a5y9a46". You will need a function running on the cloud to serve as a Webhook for LINE to communicate with and then retrieve the ID. So here comes the ```Firebase function```. It will serve as the API for LINE to call and provide LINE user ID to our function. The LINE user ID then be stored in ```Firestore``` (a database) for later usage.
*  You may use C# program on your local PC to send pure text message to users via LINE API, however, image cannot. You need to upload your image to a cloud and expose it with URL, and then send this URL via LINE API to the users. So here comes the ```Google Cloud Storage``` to server as a online storage for your image and provide the accessability with URL.

## 1.2 Step to the Goal
<p align="center">
<img src="/image/step.jpg" height="90%" width="90%">  
  
  Steps to the goal 
</p>

# 2. LINE Developer Console Configuration
Please follow the steps in the following LINE official link to configure your developer console.
https://developers.line.biz/en/docs/messaging-api/getting-started/


# 3. Firebase Functions and Firestore Database
Firebase functions will serve as Webhook of LINE (LINE explain: When an event occurs, such as when a user adds your LINE Official Account as a friend or sends a message, the LINE Platform sends an HTTPS POST request to the webhook URL).

```javascript
const functions = require("firebase-functions");
const fetch = require("node-fetch");
var admin = require("firebase-admin");

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
    var event = request.body.events[0]
    functions.logger.log(JSON.stringify(event));
    var userId = event.source.userId;
    var timestamp = event.timestamp;
    var replyToken = event.replyToken;
    var userText = ""
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
    "Authorization": "Bearer pb2iNzDae3d8lZotR+dufP5igReOzv8Rpcdsgrahnw0eH2ckKfhLAe4/WLXuvJrgN/fSt881Vfrk6iSrVcOGLAeYacnnaagyedudDiaHL7wPvFfsda35ldsasdfqCaXjs4wjIgJFRDmRWQdB04t89/1O/w1cDnyilFU="
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
    .then(json => functions.logger.log(JSON.stringify(json)))
}
```
Note that in ```"Authorization": "Bearer XXOOXX``` where XXOOXX is Channel access token configured in LINE Developer Console.
