const express = require("express");
const uuid = require("uuid")
const server = express();
server.use(express.json())
server.use(express.static("public"))

//All your code goes here
let activeSessions={}


server.get("/gamestate", (req, res) => {
    let sessionID = req.query.sessionID;
  
    if (!sessionID) {
      return res.status(400).send({ error: "Session ID is missing" });
    } else if (activeSessions[sessionID]) {
      return res.status(200).send({ gameState: activeSessions[sessionID] });
    } else {
      return res.status(404).send({ error: "Game doesn't exist" });
    }
  });
  
  
  
  
  
  server.get("/newgame", async (req, res) => {
    let newID = uuid.uuidv4();
    let num = await wordGen();
    let answer = req.query.answer
    if (answer) {
      num = answer;
    }
  
    let newGame = {
      wordToGuess: num,
      guesses: [],
      wrongLetters: [],
      closeLetters: [],
      rightLetters: [],
      remainingGuesses: 6,
      gameOver: false,
    };
  
    activeSessions[newID] = newGame;
    res.status(201).send({ sessionID: newID });
  });
  
  async function wordGen() {
    let response = await fetch("https://random-word-api.vercel.app/api?words=1&length=5");
    let results = await response.json();
    return results[0];
  }
  
  
  
  
  
  
  
  server.post("/guess", async (req, res) =>{
    let sessionID = req.body.sessionID;
    let userGuess = req.body.guess;
    let response = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + userGuess);
    let results = await response.json();
    console.log(results);
    
    if(!sessionID) {
      return res.status(400).send({ error: "Session ID is missing" });
    }
  
    let session = activeSessions[sessionID];
    if(!session) {
      return res.status(404).send({ error: "Session doesn't exist" });
    }
    if(!userGuess || userGuess.length !== 5){
      return res.status(400).send({ error: "Guess must be 5 letters" });
    }
  
    if(results.title === "No Definitions Found") {
      return res.status(400).send({ error: "Not a real word" });
    }
    let realValue = session.wordToGuess.split("");
    let guess = [];
    session.remainingGuesses -= 1;
    
  
    for(let i = 0; i < userGuess.length; i++) {
      let letter = userGuess[i].toLowerCase();
      let correctness = "WRONG";
  
      if(!/[a-z]/.test(letter)) {
        return res.status(400).send({ error: "Guess must only contain letters" });
      }
  
      if(letter === realValue[i]) {
        correctness = "RIGHT";
        if(!session.rightLetters.includes(letter)) {
          session.rightLetters.push(letter);
        }
      }else if(realValue.includes(letter)) {
        correctness = "CLOSE";
        if(!session.closeLetters.includes(letter) && !session.rightLetters.includes(letter)) {
          session.closeLetters.push(letter);
        }
      }else{
        if(!session.wrongLetters.includes(letter)) {
          session.wrongLetters.push(letter);
        }
      }
      guess.push({ value: letter, result: correctness });
    }
    session.guesses.push(guess);
  
    if (userGuess === session.wordToGuess) {
      session.gameOver = true;
    } else if (session.remainingGuesses <= 0) {
      session.gameOver = true;
    }
  
    res.status(201).send({ gameState: session });
  });
  //almost had a breakdown doing this
  
  
  
  
  
  
  server.delete("/reset", (req, res) => {
    let sessionID = req.query.sessionID;
    if (!sessionID) {
      return res.status(400).send({ error: "Session ID is missing" });
    }
  
    if (activeSessions[sessionID]) {
      activeSessions[sessionID] = {
        wordToGuess: undefined,
        guesses: [],
        wrongLetters: [],
        closeLetters: [],
        rightLetters: [],
        remainingGuesses: 6,
        gameOver: false,
      };
      res.status(200).send({ gameState: activeSessions[sessionID] });
    } else {
      res.status(404).send({ error: "Session doesn't exist" });
    }
  });
  
  
  
  
  
  
  
  
  
  server.delete("/delete", (req, res) => {
    let sessionID = req.query.sessionID;
    if(!sessionID) {
      return res.status(400).send({ error: "Session ID is missing" });
    }
    if (activeSessions[sessionID]) {
      delete activeSessions[sessionID];
      res.status(204).send();
    } else {
      res.status(404).send({ error: "Session doesn't exist" });
    }
  });
//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = server;
