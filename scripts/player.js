import * as THREE from 'three';
import { CONFIG } from './config.js';

export default class Player {
    constructor(scene) {
        this.scene = scene;
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition = new THREE.Vector3(0, CONFIG.PLAYER_SIZE/2, 0);
        this.size = CONFIG.PLAYER_SIZE;

        // Player states
        this.isMoving = false;
        this.isJumping = false;

        // Current Tile/Surface states
        this.currentTileType = 'grass'; // We always start on grass
        this.currentSurface = null;     // For interactable objects, e.g Logs

        // Log/River handling - we may refactor later
        this.isOnLog = false;
        this.currentLog = null;
        this.isInWater = false;

        // Create Mesh for player
        this.createMesh();
    }

    // Simple cube as test - replace with model later
    createMesh() {
        const bodyGeometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.PLAYER });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.copy(this.targetPosition);
        this.body.castShadow = true;
        this.scene.add(this.body);
    }

    move(direction) {
        if (this.isMoving) return; // Prevent rapid moves
        this.isMoving = true;
        this.isJumping = true;

        // Store last position (using spread)
        this.lastPosition = { ...this.gridPosition };

        // Update grid position based on direction
        switch (direction) {
            case 'forward':
                this.gridPosition.z -= 1;
                break;
            case 'backward':
                this.gridPosition.z += 1;
                break;
            case 'left':
                this.gridPosition.x -= 1;
                break;
            case 'right':
                this.gridPosition.x += 1;
                break;
        }

        // Use consistent spacing from config
        this.targetPosition = new THREE.Vector3(
            this.gridPosition.x * CONFIG.TILE_SIZE,
            this.targetPosition.y,
            this.gridPosition.z * CONFIG.TILE_SIZE
        );

        // Animate the jump (Pass function as callback to reset isMoving)
        this.jumpAnimation(() => {
            this.isMoving = false;
        });
        
        return {
            previousPosition,
            newPosition: { ...this.gridPosition }
        };
    }
    
    // Refactor to make callback mandatory?
    jumpAnimation(callback) {
        const jumpHeight = this.size * CONFIG.PLAYER_JUMP_HEIGHT;
        const jumpDuration = CONFIG.PLAYER_MOVE_SPEED;
        const startTime = Date.now();
        const startY = this.body.position.y;
        const jumpTarget = this.targetPosition.clone();
        const startPosition = this.body.position.clone();
        
        const animateJump = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / jumpDuration, 1);
            
            // Interpolate position
            this.body.position.x = startPosition.x + (jumpTarget.x - startPosition.x) * progress;
            this.body.position.z = startPosition.z + (jumpTarget.z - startPosition.z) * progress;
            
            // Add jump arc
            if (progress <= 0.5) {
                this.body.position.y = startY + jumpHeight * (progress * 2);
            } else {
                this.body.position.y = startY + jumpHeight * (2 - progress * 2);
            }
            
            // Rotate based on direction
            this.body.rotation.y = Math.atan2(
                jumpTarget.x - startPosition.x,
                jumpTarget.z - startPosition.z
            );
            
            if (progress < 1) {
                requestAnimationFrame(animateJump);
            } else {
                this.isJumping = false;
                if (callback) callback();
            }
        };
        
        animateJump();
    }

    getPosition() {
        return this.gridPosition;
    }

    // This is called every frame from the main loop
    update() {

        // Check what tile/surface the player is currently on
        this.checkCurrentTile();

        // Handle tile specific actions
        this.handleTileInteraction();

        // Add idle animation
        if (!this.isJumping) {
            this.body.position.y = this.targetPosition.y + 
                Math.sin(Date.now() / 500) * 0.05;
        }
    }
    
    /**
     * Determine what the player is currently standing on
     * Set y value and perform any logic based on surface type
     */
    checkCurrentTile() {
        // Reset states
        const previousLog = this.currentLog;
        this.currentSurface = null;
        this.isOnLog = false;
        this.currentLog = null;
        this.isInWater = false;

        // Find the current tile the player is on
        const playerWorldZ = this.gridPosition.z * CONFIG.TILE_SIZE;

        // Find the terrain row the current tile belongs to
        const terrainRow = this.findTerrainRowAtZ(playerWorldZ);
        
        if (terrainRow) {
            this.currentTileType = terrainRow.type;
            
            // Handle different tile types
            switch (this.currentTileType) {
                case 'grass':
                case 'road':
                case 'rail':
                    this.handleSolidTile(terrainRow);
                    break;
                    
                case 'river':
                    this.handleRiverTile(terrainRow);
                    break;
                    
                default:
                    console.warn(`Unknown tile type: ${this.currentTileType}`);
                    this.handleSolidTile(terrainRow);
            }
        } else {
            // Fallback if no terrain found
            this.currentTileType = 'grass';
            this.setPlayerHeight(CONFIG.TERRAIN_HEIGHTS.GRASS);
        }

        // Handle log state changes
        if (previousLog && previousLog !== this.currentLog) {
            previousLog.playerLeft();
        }
        if (this.currentLog && previousLog !== this.currentLog) {
            this.currentLog.playerLanded();
        }
    }

    // Find the terrain row at a given Z coord (not sure if this is best way to handle)
    findTerrainRowAtZ(worldZ) {
        // Access terrain generator through game instance
        if (window.game && window.game.terrainGenerator) {
            const terrainRows = window.game.terrainGenerator.rows;
            
            // Find the row that contains this Z position
            for (const row of terrainRows) {
                const rowStart = row.z - (CONFIG.TILE_SIZE / 2);
                const rowEnd = row.z + (CONFIG.TILE_SIZE / 2);
                
                if (worldZ >= rowStart && worldZ < rowEnd) {
                    return row;
                }
            }
        }
        
        return null; // No terrain found
    }

    handleSolidTile(terrainRow) {
        // Set player height based on terrain
        const terrainHeight = terrainRow.getTerrainHeight();
        this.setPlayerHeight(terrainHeight);
        
        // If we're not on grass, check for obstacles.
        if(terrainRow.type !== 'grass') {
            this.checkCollision(terrainRow);
        }
        
    }

    handleRiverTile(terrainRow) {
        // First check if player is on a log
        const logFound = this.checkForLogsOnTile(terrainRow);
        
        if (logFound) {
            // Player is on a log - they're safe
            this.isOnLog = true;
            this.isInWater = false;
            
            // Set height based on log height
            const terrainHeight = terrainRow.getTerrainHeight();
            this.setPlayerHeight(terrainHeight + 0.3); // Log height above water
        } else {
            // Player is in water - they should sink/die
            this.isInWater = true;
            this.isOnLog = false;
            
            const terrainHeight = terrainRow.getTerrainHeight();
            this.setPlayerHeight(terrainHeight - 0.5); // Sink below water surface
        }
    }

    // Check if there is a log on the current tile
    checkForLogsOnTile(terrainRow) {
        if (!terrainRow.obstacles) return false;
        
        // Get player's 'feet' position for accurate detection (more accurate than just BBox)
        const playerFeet = new THREE.Vector3(
            this.body.position.x,
            this.body.position.y - (this.size/2),
            this.body.position.z
        );
        
        // Check each obstacle on this tile
        for (const obstacle of terrainRow.obstacles) {
            if (obstacle.subtype === 'log' && 
                obstacle.isLoaded && 
                obstacle.boundingBox) {
                
                // Expand bounding box slightly for easier detection
                const expandedBox = obstacle.boundingBox.clone();
                expandedBox.expandByScalar(0.1);
                
                // Check if player is on this log
                if (expandedBox.containsPoint(playerFeet) && !this.isJumping) {
                    this.currentLog = obstacle;
                    this.currentSurface = obstacle;
                    return true;
                }
            }
        }
        
        return false;
    }

    // Check for collisions on a given row using AABB
    checkCollision(terrainRow) {
        // If this row didnt spawn with obstacles, return
        if (!terrainRow.obstacles) return;

        // Get player's bounding box
        const playerBox = new THREE.Box3().setFromObject(this.body);
        
        for (const obstacle of terrainRow.obstacles) {
            if (obstacle.isLoaded && 
                obstacle.boundingBox && 
                obstacle.type === 'obstacle') {
                
                // Check collision with nont
                if (playerBox.intersectsBox(obstacle.boundingBox)) {
                    this.currentSurface = obstacle;
                    
                    // If the obstacle is static (e.g. tree), block movement
                    if (obstacle.static) {
                        // Add logic for blocking move here
                    } 
                    // Else trigger a game over
                    else if (['car', 'truck', 'train'].includes(obstacle.subtype)) {
                        // Vehicles cause game over
                        //this.triggerGameOver('vehicle');
                    }
                }
            }
        }
    }

    handleTileInteraction() {
        if (this.isInWater && !this.isOnLog) {
            // Player is drowning
            // Create an animation for this
            //this.triggerGameOver('drowning');
            return;
        }
        
        if (this.isOnLog && this.currentLog) {
            // Player is riding a log - move with it
            this.currentLog.carryPlayer(this);
        }
        
        // Handle tile-specific effects
        switch (this.currentTileType) {
            case 'grass':
                // Safe zone - no special effects
                break;
                
            case 'road':
                // Road - watch for vehicles (handled in checkCollision)
                break;
                
            case 'rail':
                // Railway - watch for trains (handled in checkCollision)
                break;
                
            case 'river':
                // Water - sink or ride logs (handled above)
                break;
        }
    }

    setPlayerHeight(terrainHeight) {
        const newY = terrainHeight + (this.size / 2);
        
        // Only update if not jumping
        if (!this.isJumping) {
            this.targetPosition.y = newY;
            this.body.position.y = newY;
        }
    }

    triggerGameOver(reason) {
        console.log(`Game Over: ${reason}`);
        
        // Emit game over event
        if (window.game && window.game.handleGameOver) {
            window.game.handleGameOver(reason);
        } else {
            // Fallback game over handling
            alert(`Game Over! Cause: ${reason}`);
            this.resetPlayerPosition();
        }
    }

    resetPlayerPosition() {
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition = new THREE.Vector3(0, CONFIG.PLAYER_SIZE/2, 0);
        this.body.position.copy(this.targetPosition);
        this.isMoving = false;
        this.isJumping = false;
        this.currentTileType = 'grass';
        this.currentSurface = null;
        this.isOnLog = false;
        this.currentLog = null;
        this.isInWater = false;
    }

    /**
     * Get detailed information about what the player is currently on
     */
    getCurrentTileInfo() {
        return {
            tileType: this.currentTileType,
            isOnLog: this.isOnLog,
            isInWater: this.isInWater,
            currentSurface: this.currentSurface,
            gridPosition: { ...this.gridPosition }
        };
    }
    
}
