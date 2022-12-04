const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => res.send(''));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Include the chrome driver
require("chromedriver");
const axios = require("axios");
const slackToken = 'xoxb-3954263676342-4447852709271-NzauPmDdIiKIkxipxmNuGVGV';

// Include selenium webdriver
let swd = require("selenium-webdriver");
let browser = new swd.Builder();
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
let tab = browser.forBrowser("chrome")
    .setChromeOptions(new chrome.Options().headless())
    .setFirefoxOptions(new firefox.Options().headless())
    .build();
  
// Get the credentials from the JSON file
let { email, pass } = require("./credentials.json");
  
// Step 1 - Opening the foriio sign in page
let tabToOpen =
    tab.get("https://creatormatch.foriio.com/app/login");

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function sendMessageToSlack(text, username) {
    const url = 'https://slack.com/api/chat.postMessage';
    const res = await axios.post(url, {
        channel: '#general',
        text: text,
        username: username,
        icon_emoji: ':+1:'
    }, { headers: { authorization: `Bearer ${slackToken}` } });

    console.log('Done', res.data);
}

tabToOpen
  .then(function () {

      // Timeout to wait if connection is slow
      let findTimeOutP =
          tab.manage().setTimeouts({
              implicit: 30000, // 10 seconds
          });
      return findTimeOutP;
  })
  .then(function () {

      // Step 2 - Finding the username input
      let promiseUsernameBox =
          tab.findElement(swd.By.id("email"));
      return promiseUsernameBox;
  })
  .then(function (usernameBox) {

      // Step 3 - Entering the username
      let promiseFillUsername =
          usernameBox.sendKeys(email);
      return promiseFillUsername;
  })
  .then(function () {
      console.log(
          "Username entered successfully in" +
          "'login demonstration' for foriio"
      );

      // Step 4 - Finding the password input
      let promisePasswordBox =
          tab.findElement(swd.By.id("password"));
      return promisePasswordBox;
  })
  .then(function (passwordBox) {

      // Step 5 - Entering the password
      let promiseFillPassword =
          passwordBox.sendKeys(pass);
      return promiseFillPassword;
  })
  .then(function () {
      console.log(
          "Password entered successfully in" +
          " 'login demonstration' for foriio"
      );

      // Step 6 - Finding the Sign In button
      let promiseSignInBtn = tab.findElement(
          swd.By.css(".ceneop")
      );
      return promiseSignInBtn;
  })
  .then(function (signInBtn) {

      // Step 7 - Clicking the Sign In button
      let promiseClickSignIn = signInBtn.click();
      return promiseClickSignIn;
  })
  .then(async function () {
      await sleep(5000)
      return tab.manage().getCookie('foriio-jwt')
  })
  // .then(async function (cookie) {
  //     const token = 'Bearer ' + cookie.value;
  //     const url = 'https://api.foriio.com/api/v1/proposals';
  //     axios.defaults.headers.common['authorization'] = token
  //     axios.defaults.headers.common['Accept'] = 'application/json'
  //     axios.defaults.headers.common['Accept-Encoding'] = 'identity'
  //     const res = await axios.get(url, {
  //         params: {
  //             project_step: 'order_contract,advance_payment,order_delivery,evaluation',
  //             include_group_chats: ''
  //         }
  //     });

  //     const assignment = res.data.assignments[0];
  //     const username = assignment.requestor.screen_name;
  //     const message = 
  //       'Title: ' + assignment.project.title + '\n'
  //       + 'Budget Amount: ' + assignment.project.budget_formatted + '\n'
  //       + 'Description: ' + assignment.project.description + '\n'

  //     await sendMessageToSlack(message, username);
  // })
  .then(async function () {
      const cookie = await tab.manage().getCookie('foriio-jwt');
      const token = 'Bearer ' + cookie.value;
      const url = 'https://api.foriio.com/api/v1/chat/auth';
      axios.defaults.headers.common['authorization'] = token
      axios.defaults.headers.common['Accept'] = 'application/json'
      axios.defaults.headers.common['Accept-Encoding'] = 'identity'
      const res = await axios.post(url, {})
      const chat_token = res.data.token;

      const { Client } = require('@twilio/conversations');

      const client = new Client(chat_token);

      client.on("connectionStateChanged", (state) => {
          if (state === "connecting")
              console.log('Connecting to Twilio…')
          if (state === "connected") 
              console.log("You are connected.")
          if (state === "disconnecting")
              console.log("Disconnecting from Twilio…")
          if (state === "disconnected")
              console.log("Disconnected.")
          if (state === "denied") 
              console.log("Failed to connect.",)
      });

      // client.on("conversationJoined", conversation => {
      //     conversation.getMessages(50).then(res => {
      //         res.items.map(async message => {
      //             await sendMessageToSlack(message.body, 'Bot');
      //         })
      //     })
      // });

      // Before you use the client, subscribe to the `'initialized'` event.
      client.on('initialized', () => {
          console.log(initialized)
          // Use the client.
      });
      
      // To catch client initialization errors, subscribe to the `'initFailed'` event.
      client.on('initFailed', ({ error }) => {
          // Handle the error.
      });

      // Fired when a new message has been added to the conversation on the server.
      client.on('messageAdded', async (message) => {
          await sendMessageToSlack(message.body, 'Bot');
      });

      client.on('messageRemoved', (message) => {
          // Handle the error.
      });

      client.on('messageUpdated', (message) => {
          // Handle the error.
      });

      client.on('pushNotification', (pushNotification) => {
          // Handle the error.
      });
  })
  .catch(function (err) {
      console.log("Error ", err, " occurred!");
  });

