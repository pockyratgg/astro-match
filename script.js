//creating the audioController. the class is going to be a blueprint for objects that are created.
//we initialize all our sounds here for the game
class AudioController {
    constructor() {
        this.bgMusic = new Audio('Assets/Audio/neongaming.mp3');
        this.flipSound = new Audio('Assets/Audio/flip.wav');
        this.matchSound = new Audio('Assets/Audio/positivebeep.mp3');
        this.victorySound = new Audio('Assets/Audio/levelcomplete.mp3');
        this.gameOverSound = new Audio('Assets/Audio/gameoversad.wav');
        this.bgMusic.volume = 0.15; //audio is really loud so we want to turn it down half-way or more so sound effects are still heard
        this.bgMusic.loop = true; //loops the music
    }
    //writing all functions for the music and each sound effect and then they will be called later
    startMusic() {
        this.bgMusic.play();
    }
    stopMusic() {
        this.bgMusic.pause(); //pauses music
        this.bgMusic.currentTime = 0; //resets the time of the music to zero so when played again it will begin at the start
    }
    flip() {
        this.flipSound.play();
    }
    match() {
        this.matchSound.play();
    }
    victory() {
        this.stopMusic(); //stops music so you can hear the victory sound
        this.victorySound.play(); 
    }
    gameOver() {
        this.stopMusic();
        this.gameOverSound.play();
    }
}

//there are properties of this object that are set from the constructor which cardsArray and totalTime. the rest are going to be set dynamically
class MixOrMatch {
    constructor(totalTime,cards) {
        this.cardsArray = cards;
        this.totalTime = totalTime;
        this.timeRemaining = totalTime; //time remaining in game at any given point
        this.timer = document.getElementById('time-remaining'); //grabbed from the DOM
        this.ticker = document.getElementById('flips'); //ticks up every time a card is flipped
        this.audioController = new AudioController();
    }
//the constructor above only gets called one time but startGame will get called multiple times, initial start, after losing, after winning
    startGame() {
        this.cardToCheck = null; //when the game starts the card to check is null. once a card is flipped this is no longer null since other cards are going to be compared to it. returns to null when cards are flipped over and there's nothing to check 
        this.totalClicks = 0;
        this.timeRemaining = this.totalTime; //we want the time to reset each time we do a new game
        this.matchedCards = []; //starts empty and all the matches will go in here. this will be used to check against the total cards array to see if there is a victory or not
        this.busy = true;

        //creating a timeout, takes a function as first parameter and the second parameter is miliseconds. this says wait 500 milisecohnd before doing anything in the function
        //half a second time-out is for the game over or victory, it goes smoother.

        setTimeout(() => {
            this.audioController.startMusic();
            this.shuffleCards();
            this.countDown = this.startCountDown();
            this.busy = false;
        }, 500);
        this.hideCards();
        this.timer.innerText = this.timeRemaining; //resetting time text with new game
        this.ticker.innerText = this.totalClicks; //resetting ticker with new game
    }
    //loops through cards array using forEach. for each card, remove visible classes and remove matched card animation
    hideCards() {
        this.cardsArray.forEach(card => {
            card.classList.remove('visible');
            card.classList.remove('matched');
        });
    }

    flipCard(card) {
        if(this.canFlipCard(card)) {
            this.audioController.flip();
            this.totalClicks++;
            this.ticker.innerText = this.totalClicks; //updating flips count to be the current value
            card.classList.add('visible');

            //if statement, should we check for a match or shouldn't we
            if(this.cardToCheck)
                this.checkForCardMatch(card);
            else
                this.cardToCheck = card;
        }
    }
    checkForCardMatch(card) {
        if(this.getCardType(card) === this.getCardType(this.cardToCheck))
            this.cardMatch(card, this.cardToCheck);
        else
            this.cardMisMatch(card, this.cardToCheck);

        this.cardToCheck = null; //set to null whether there is a match or no match
    }
    //first thing we want to do is push the cards to matched cards aray
    cardMatch(card1, card2) {
        this.matchedCards.push(card1);
        this.matchedCards.push(card2);
        card1.classList.add('matched'); //card1 match animation
        card2.classList.add('matched'); //card2 match animation
        this.audioController.match(); //plays match sound
        if(this.matchedCards.length === this.cardsArray.length) //if the length of the match cards matches the cards array, we're going to call a victory
            this.victory();
    }
    //flipping the cards back when not getting a match. gives viewer a second to see the incorrect match and then turn it over that's where 1000 comes in
    cardMisMatch(card1, card2) {
        this.busy = true;
        setTimeout(() => {
            card1.classList.remove('visible');
            card2.classList.remove('visible');
            this.busy = false;
        },  1000);

    }
    //the card itself is going to be in the huge block in html which will be the source attrivute and the 0th one in the array
    getCardType(card) {
        return card.getElementsByClassName('card-value')[0].src; //was missing .src and it was causing matches to not work properly here
    }

    //gameover function. if timer runs out we know we have a game over and this is what its checking for
    startCountDown() {
        return setInterval(() => {
            this.timeRemaining--; //subtracts a second each time
            this.timer.innerText = this.timeRemaining;
            if(this.timeRemaining === 0)
                this.gameOver();
        }, 1000); //interval works similarily to setTimeOut function
        
    }
    //clears the countdown, plays the game over sound, and then shows the game over text + overlay
    gameOver() {
        clearInterval(this.countDown); 
        this.audioController.gameOver();
        document.getElementById('game-over-text').classList.add('visible')
    }

    //does the same things as the gameOver function except with victory text : )
    victory() {
        clearInterval(this.countDown);
        this.audioController.victory();
        document.getElementById('victory-text').classList.add('visible')
    }

    //fisher yates shuffle algorithm
    //math.random creates a random float between 0-1 but not including 1. 0.63 * 5 and then rounding down as an example
    //using css grid to shuffle the display of cards
    //taking random item in card list and then taking the card we're on and we're swapping the css grid order using the algorithim
    shuffleCards() {
        for(let i = this.cardsArray.length - 1; i > 0; i--) {
            let randIndex = Math.floor(Math.random() * (i+1));
            this.cardsArray[randIndex].style.order = i;
            this.cardsArray[i].style.order = randIndex;
        }
    }

    //this checks to see if the user is allowed to flip a card or not. three different scenarios will use this. when this.busy is true it will be used for when an animation is playing and the player needs to wait
    //second case is when clicking on a card that is already a matched card, we don't want the flipped card function to run 
    //third case if the card you click is the card to check, don't allow the user to click the card again
    //all three statements have to return as false in order for canFlipCard(card) to be true
    canFlipCard(card) {
        return (!this.busy && !this.matchedCards.includes(card) && card !== this.cardToCheck)
    }
}

//grab all overlays from the DOM also grab cards. this is going to return an html collection, not exactly an array. since its an html collection it doesn't have access to the javascript functions
function ready() {
    let overlays = Array.from(document.getElementsByClassName('overlay-text')); //whatever you give Array.from, its going to try to create an array for it. overlays is just an array of elements
    let cards = Array.from(document.getElementsByClassName('card')); //class name is card here
    let game = new MixOrMatch(120, cards);

//we're gonna loop over all these and add event listeners
    overlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            overlay.classList.remove('visible');
            game.startGame(); //this will initalize game
        });
    });
    //cards event functions. for each click that happens on a card, we'll use game.flipCard() and pass the card itself 
    cards.forEach(card => {
        card.addEventListener('click', () => {
            game.flipCard(card);
        });
    });
}

//if the html page has not finished loading, then put an event listener on the DOM that says when it is loaded, call ready. if not we already know the page is loaded so call ready
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready());
} else {
    ready();
}




