# Sending LINE message with Google Cloud Storage and Line API
The main goal is to use C# program to send image or text message to LINE app chat room. Firebase and Google Cloud Storage will also be involved to achieve the goal. Some useful official documentary links are listed below
* LINE Developers: https://developers.line.biz/en/reference/messaging-api/
* Google Cloud Storage Client: https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-csharp
* Firebase Function and Firestore: https://firebase.google.com/docs/functions/write-firebase-functions

<p align="center">
<img src="/image/overview.jpg" height="90%" width="90%">  
</p>

As you can see from the above image of the structure of our program, there are many elements. Have you ever think why do we need so many parts to achieve such simple goal? The reason are as following
* LINE user ID is not the same one you usually used to add new friend. The ID contains numeric and alphabetic characters such as "U9d70e010e48a1t93634a60cf1a5y9a46". You will need a function running on the cloud to server as a Webhook for LINE to communicate with and then retrieve the ID. So here comes the ```Firebase function```. It will server as the API for LINE to call and provide LINE user ID to our function.
*  You may use C# program on your local PC to send pure text message to users via LINE API, however, image cannot. You need to upload your image to a cloud and expose it with URL, and then send this URL via LINE API to the users. So here comes the ```Google Cloud Storage``` to server as a online storage for your image and provide the accessability with URL.

