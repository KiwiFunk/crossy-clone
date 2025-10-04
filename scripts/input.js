import { CONFIG } from './config.js';

/**
 * InputHandler class to manage keyboard and touch inputs for player movement.
 * Supports arrow keys, WASD keys, and swipe gestures.
 * Implements a cooldown to prevent rapid movements.
 * Event listeners are binded to class methods instead of anonymous arrow functions to ensure per instance cleanup
 * @param {Object} player - The player object with a move(direction) method.
 */
export default class InputHandler {
    constructor(player) {
        this.player = player;
        this.keys = {};                                 // Track key states
        this.touchStartX = 0;                           // Initial touch x position
        this.touchStartY = 0;                           // Initial touch y position
        this.lastMoveTime = 0;                          // Timestamp of the last move
        this.moveDelay = CONFIG.PLAYER_MOVE_COOLDOWN;   // Cooldown between moves (ms)

        // Bind event handlers to the instance for proper cleanup
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);

        // Load Touch or Keyboard controls based on device (Make sure touch is not wacom esque stylus)
        if (window.matchMedia("(pointer: coarse)").matches) {
            this.initTouchControls();
        } else {
            this.initKeyboardControls();
        }
    }

    // Touch event handlers
    onTouchStart(e) {
        // Capture touch event and store position
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;   
        this.touchStartY = touch.clientY;
    }

    onTouchEnd(e) {

        // Return if no touches
        if (e.changedTouches.length === 0) return;

        // Calculate delta of touch interaction
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        // Min distance to consider event a swipe
        const minSwipeDistance = 30;

        // If !swipe, handle as tap using absolute to avoid negative issues
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            this.handleDirection('forward');
            return;
        }

        // Else calculate the swipe direction based on deltas
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.handleDirection(deltaX > 0 ? 'right' : 'left');
        } else {
            this.handleDirection(deltaY > 0 ? 'backward' : 'forward');
        }
    }

    // Keyboard event handlers
    onKeyDown(e) {
        this.keys[e.key] = true;
        this.handleInput();
    }

    onKeyUp(e) {
        this.keys[e.key] = false;
    }

    // Event listener setup (binded to class methods for proper cleanup)
    initTouchControls() {
        document.addEventListener('touchstart', this.onTouchStart);
        document.addEventListener('touchend', this.onTouchEnd);
    }

    initKeyboardControls() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }

    // Input processing for keys
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

        // Cooldown is active, do nothing.
        if (now - this.lastMoveTime < this.moveDelay) return;

        // Make sure player animation has finished then call move
        if (this.player && !this.player.isMoving) {
            this.player.move(direction);
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
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchend', this.onTouchEnd);
    }
}