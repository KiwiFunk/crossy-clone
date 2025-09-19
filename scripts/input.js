import { CONFIG } from './config.js';

export default class InputHandler {
    constructor(player) {
        this.player = player;
        this.keys = {};                                 //Track key states in an object (key: boolean)
        this.touchStartX = 0;                           //Initial touch X position
        this.touchStartY = 0;                           //Initial touch Y position
        this.lastMoveTime = 0;                          //Timestamp of last move
        this.moveDelay = CONFIG.PLAYER_MOVE_COOLDOWN;   //Cooldown between moves in ms

        // Load Touch or Keyboard controls based on device
        if ('ontouchstart' in window || navigator.maxTouchPoints) {
            this.initTouchControls();
        } else {
            this.initKeyboardControls();
        }
    }

    // Functions for creating event listeners depending on input type

    initTouchControls() {
        document.addEventListener('touchstart', (e) => {
            // Capture the touch event and store position
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        });

        document.addEventListener('touchend', (e) => {

            // Prevent processing if no touches
            if (e.changedTouches.length === 0) return;

            // Get the delta values of the touch
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            // Minimum distance to consider event a swipe
            const minSwipeDistance = 30;

            // If !swipe, handle as tap using absolute to avoid negative issues
            if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
                this.handleDirection('forward');
                return;
            }

            // Else calculate the swipe direction based on deltas
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.handleDirection('right');
                } else {
                    this.handleDirection('left');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.handleDirection('backward');
                } else {
                    this.handleDirection('forward');
                }
            }
        });
    }

    initKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            this.handleInput();
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    // Functions for handling input actions

    handleInput() {
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveDelay) return;
        
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.handleDirection('forward');
        } else if (this.keys['ArrowDown'] || this.keys['s']) {
            this.handleDirection('backward');
        } else if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.handleDirection('left');
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.handleDirection('right');
        }
    }

    handleDirection(direction) {
        if (this.player && !this.player.isMoving) {
            this.player.move(direction);
            this.lastMoveTime = Date.now();
        }
    }

    update() {
        // Check for continuous input (keyboard)
        this.handleInput();
    }
}
