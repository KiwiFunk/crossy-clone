import { CONFIG } from './config.js';

export default class InputHandler {
    constructor(player) {
        this.player = player;
        this.keys = {};                                 //Track key states in an object (key: boolean)
        this.touchStartX = 0;                           //Initial touch X position
        this.touchStartY = 0;                           //Initial touch Y position
        this.lastMoveTime = 0;                          //Timestamp of last move
        this.moveDelay = CONFIG.PLAYER_MOVE_COOLDOWN;   //Cooldown between moves in ms

        // Load Touch or Keyboard controls based on device (Make sure touch is not wacom esque stylus)
        if (window.matchMedia("(pointer: coarse)").matches) {
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
            this.keys[e.key] = true;

            this.handleInput();
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    // Functions for handling input actions
    handleInput() {
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.handleDirection('forward');
        } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.handleDirection('backward');
        } else if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.handleDirection('left');
        } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.handleDirection('right');
        }
    }

    handleDirection(direction) {
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveDelay) {
            return; // Cooldown is active, do nothing.
        }

        // Check the player's animation state as a fallback.
        if (this.player && !this.player.isMoving) {
            this.player.move(direction);
            
            // Reset the cooldown timer.
            this.lastMoveTime = now;
        }
    }

    update() {
        // Check for continuous input (keyboard)
        this.handleInput();
    }

    // Remove all event listeners this class created
    destroy() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchend', this.onTouchEnd);
    }
}
