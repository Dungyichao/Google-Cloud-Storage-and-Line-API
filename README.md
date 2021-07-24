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

I would set the Auto-response messages status (In Response settings) to Off. 

# 3. Firebase Functions and Firestore Database
Firebase functions will serve as Webhook of LINE (LINE explain: When an event occurs, such as when a user adds your LINE Official Account as a friend or sends a message, the LINE Platform sends an HTTPS POST request to the webhook URL). Notice that using ```Firestore``` database is free while ```Functions``` requires your project to be upgraded to ```Blaze``` plan (pay by your usage)

Please go through following two link

1. How to start Firebase Function project: https://firebase.google.com/docs/functions/get-started
2. How to make Firebase Functions work with LINE [PDF](https://github.com/Dungyichao/Google-Cloud-Storage-and-Line-API/blob/main/reference/%E2%80%9CLINE%20Messaging%20API%E2%80%9D%20x%20%E2%80%9CFirebase%20(Cloud...%2B%20Firestore)%E2%80%9D%20_%20by%20Siratee%20K.pdf)

## 3.1 Firestore Database
<p align="center">
<img src="/image/firestore.jpg" height="90%" width="90%">  
  
  Firestore database
</p>

## 3.2 Firebase Functions

Use the following command to create Functions folder and related documents
```cmd
$npm install firebase-functions@latest firebase-admin@latest --save
$npm install -g firebase-tools
$firebase init functions
```
Some sample code would look like the following
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
exports.addMessage = functions.https.onRequest(async (req, res) => {
  const original = req.query.text;
  const writeResult = await admin.firestore().collection('messages').add({original: original});
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});
```
In ```.eslintrc.js``` which check your code rule, we need some modification to save our life.
https://www.programmersought.com/article/46885832344/
```json
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    quotes: ["error", "double"],
    "no-unused-vars":"off",
  },
};
```
Now you can deploy your function onto Firebase
```cmd
$firebase deploy --only functions
```
or
```
$firebase deploy --only "functions:addMessage"
```
Where addMessage is your function name. You can then find the function trigger URL in your Firebase Console (in tab Functions. URL would look like https://us-central1-projectname-3f2d0.cloudfunctions.net/addMessage)

However, after you deploy, you might encounter error: Forbidden....when you try to call the URL of your functions in the browser. Please follow the following link to solve the problem
https://lukestoolkit.blogspot.com/2020/06/google-cloud-functions-error-forbidden.html
Go to the following link: https://console.cloud.google.com/functions/list . Select your project. Check the check box of the function which you encounter error. Click on ```ADD MEMBER```. In the new members field, type in "allUsers" and select the "allUsers" option. In the "Select a role" dropdown, select Cloud Functions then Cloud Functions Invoker.

If you get everything right with above addMessage function, you can then deploy the following code onto Firebase Function. 
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
    "Authorization": "Bearer pb2iNzDae3dfP5igReOzv8Rpcdsgrahnw0eH2LAe4/WLXuvJrgN/VcOGLAe69wDiaHL7wPvFfsda35ldsasdfqCaXjs4wB04t89/1O/w1cDnyilFU="
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
Note that in ```"Authorization": "Bearer XXOOXX``` where XXOOXX is Channel access token configured in LINE Developer Console mentioned in previous section. You should keep the Channel access token secure.

Make sure that the above function ```LineMessAPI``` be accessible to public (we did'nt put much effort on the security here, so make sure you know how to configure rule when deploy in real business). Put the LineMessAPI URL into ```Webhook URL``` in LINE Developer Console under the channel you just created.
<p align="center">
<img src="/image/webhook_setting.jpg" height="90%" width="90%">  
  
  Webhook settings in LINE Developer Console
</p>

# 4. LINE Chat and Postman Testing
After you complete above section, use your LINE app on your cellphone and add (Home --> Add Friend --> QR code --> Scan the channel QR code) the newly created channel. You will then receive a auto reply message from the channel. At the same time, LINE also trigger the Webhook URL, so our function ```LineMessAPI```  should be recording the LINE user ID (for example: U4d709010e49a0f83634p70cf1a0e0a76)who just add the channel to friend.

In LINE Developers documents about Message API --> Message --> Send push message ([link](https://developers.line.biz/en/reference/messaging-api/#send-push-message)). A example request looks like the following
```Shell
curl -v -X POST https://api.line.me/v2/bot/message/push \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer {channel access token}' \
-d '{
    "to": "U4d709010e49a0f83634p70cf1a0e0a76",
    "messages":[
        {
            "type":"text",
            "text":"Hello, world1"
        },
        {
            "type":"text",
            "text":"Hello, world2"
        }
    ]
}'
```
We will use [Postman](https://www.postman.com/) to send the above request for testing if everything working great. LINE user should receive ```Hello, world1``` from the channel.
<p align="center">
<img src="/image/postman.jpg" height="100%" width="100%">  
  
  Postman send http request
</p>

Sending text message is simple, however, sending image should go through image URL. The request looks like following ([doc](https://developers.line.biz/en/reference/messaging-api/#image-message)). 
```json
{
    "type": "image",
    "originalContentUrl": "https://example.com/original.jpg",
    "previewImageUrl": "https://example.com/preview.jpg"
}
```
Our next task is to upload some image to the cloud and generate an URL of the image so that we can send the URL to LINE user.

# 5. Google Cloud Storage

Please go through the following link first to setup the Google Cloud Storage. ([Document link](https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-csharp))

## 5.1 Service Account
You are required to create a Service account in ```Google Cloud Platform --> IAM & Admin --> Service Accounts``` (Google explain: A service account represents a Google Cloud service identity, such as code running on Compute Engine VMs, App Engine apps, or systems running outside Google). In the DETAILS of the service account, click on ```SHOW DOMAIN-WIDE DELEGATION``` --> check the ```Enable Google Workspace Domain-wide Delegation``` and SAVE. You will be assigned with a email for this service account like ```some_service_account_name@gteshwa-3d9870.iam.gserviceaccount.com```.

Then, create a service account key, a JSON key file will be downloaded to your computer. Put that JSON key file into your C# project solution folder. Put the following code in your c# program (at the place after InitializeComponent). I didn't use PowerShell nor Command Prompt because they are not working for my case. 
```C#
Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", @"C:\Users\admin\Desktop\SomeProjectSolutionFolder\JsonkeyName-3d9f0-8b3859shyd480.json");
// this means the json key will represent its identity to access the Google Cloud Storage bucket
```

## 5.2 Bucket
On the left panel of Google Cloud Platform, you can find ```Cloud Storage``` in the Storage section. Then click ```CREATE BUCKET``` to create a bucket which will be the place to store objects which you uploaded. In the Location type, I would choose ```Region``` because my target LINE user are near me. Then choose ```Standard``` for default storage class. After you create a bucket, now comes the permssions part. 

### 5.2.1  Permission for Service Account
First, Remove public access prevention. Second, add the service account you created (use service account email address ```some_service_account_name@gteshwa-3d9870.iam.gserviceaccount.com```) to this bucket permission new Member (so that your C# program can access and upload to this bucket) and make the role to ```Storage Object Admin```. 

### 5.2.2 Permission for Public Viewer
Add ```allUsers``` as new member and make the role to ```Storage Object Viewer``` so that every LINE user can see the image you send via URL. 

# 6. C# Program Send Image and Text Message to LINE App
We will now demonstrate how to upload image to Google cloud storage and send text and image message to LINE app.

## 6.1 Upload Object to Google Cloud Storage Bucket
The following C# function will upload object to the new created bucket
```C#
// Call the function to upload image in local PC C:\Users\admin\Desktop\LINE\ATT00001.JPG, name the object ATT00001.JPG
UploadGoogleDrive("some_service_account_name", @"C:\Users\admin\Desktop\LINE\ATT00001.JPG", "ATT00001.JPG");

//Functions which upload object to bucket
public void UploadGoogleDrive(string bucketName, string localPath, string objectName)
{
     var storage = StorageClient.Create();
     using (var fileStream = File.OpenRead(localPath))
     {
        storage.UploadObject(bucketName, objectName, null, fileStream);
     }
     Console.WriteLine($"Uploaded {objectName}.");
}
```
After you successfully uploaded the object, the URL for this object for public to access will look like ```https://storage.googleapis.com/your_bucket_name/ATT00001.JPG ```

## 6.2 Send Text Message in LINE App
```C#
public void LINE_Send_Text()
{
   string send_string = "Some string";
   var client = new RestClient("https://api.line.me/v2/bot/message/multicast");
   client.Timeout = -1;
   var request = new RestRequest(Method.POST);
   request.AddHeader("Content-Type", "application/json");
   request.AddHeader("Authorization", "Bearer pb2iNzDae3dfP5igReOzv8Rpcdsgrahnw0eH2LAe4/WLXuvJrgN/VcOGLAe69wDiaHL7wPvFfsda35ldsasdfqCaXjs4wB04t89/1O/w1cDnyilFU=");
   string body2 = String.Format("{{\"to\": [\"U4d709010e49a0f83634p70cf1a0e0a76\"], \"messages\":[{{\"type\":\"text\",\"text\":\"{0}\"}}]}}", send_string);
   request.AddParameter("application/json", body2, ParameterType.RequestBody);
   IRestResponse response = client.Execute(request);
   Console.WriteLine(response.Content);
}
```

## 6.3 Send Image Message in LINE App
```C#
public void Postman_img()
        {
            string send_string = "https://storage.googleapis.com/your_bucket_name/ATT00001.JPG";
            var client = new RestClient("https://api.line.me/v2/bot/message/multicast");
            client.Timeout = -1;
            var request = new RestRequest(Method.POST);
            request.AddHeader("Content-Type", "application/json");
            request.AddHeader("Authorization", "Bearer pb2iNzDae3dfP5igReOzv8Rpcdsgrahnw0eH2LAe4/WLXuvJrgN/VcOGLAe69wDiaHL7wPvFfsda35ldsasdfqCaXjs4wB04t89/1O/w1cDnyilFU=");           
            string body2 = String.Format("{{\"to\": [\"U4d709010e49a0f83634p70cf1a0e0a76\"], \"messages\":[{{\"type\":\"image\",\"originalContentUrl\":\"{0}\",\"previewImageUrl\":\"{0}\"}}]}}", send_string);
            request.AddParameter("application/json", body2, ParameterType.RequestBody);
            IRestResponse response = client.Execute(request);
            Console.WriteLine(response.Content);
        }
```

