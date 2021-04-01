const messages = document.querySelector('#messages')
const form = document.querySelector('form')
const username = document.querySelector('#username')
const newMessage = document.querySelector('#new-message')
let ws;

// load messages and username
_init()
async function _init() {
  username.value = localStorage['username'] || ''
  newMessage.focus()

  // fetch old messages from server, stored in a database
  let messages = await fetch('/rest/messages')
  messages = await messages.json()

  for(let msg of messages) {
    appendMessage(msg)
  }
}

connect()
async function connect() {
  console.log('connecting');

  // logic to connect through heroku URL
  const protocol = location.protocol == 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${protocol}://${location.host}/ws`)
  
  // listen to messages from the server
  ws.onmessage = message => {
    let data = JSON.parse(message.data)
    appendMessage(data)
  }

  ws.onopen = () => console.log('connected');

  // try to reconnect every second
  ws.onclose = () => {
    console.log('disconnected');

    // reconnect once every second
    setTimeout(() => {
      connect()
    }, 1000);
  }
}

// function to send a message to the server through the websocket
function send(message) {
  if(ws) {
    // send MUST always be a string
    ws.send(JSON.stringify(message))
  }
}

// create a new div and append to the messages
function appendMessage(message) {
  let messageDiv = document.createElement('div')
  messageDiv.innerHTML = `
    <p>${new Date(message.time).toLocaleString()}</p>
    <p><strong>${message.sender}: </strong>${message.text}</p>
  `
  messages.append(messageDiv)
}

// the default behaviour of a submit is to reload the page
form.addEventListener('submit', event => {
  event.preventDefault() // prevent page reload

  let message = {
    sender: username.value,
    text: newMessage.value,
    time: Date.now()
  }

  // send message to server
  send(message)

  // clear message input
  newMessage.value = ''
})

// store username in localStorage, to remember between reloads
username.addEventListener('keyup', () => (localStorage['username'] = username.value))