import Mesh from './mesh.js';
import * as THREE from 'three';
import { CONFIG } from './config.js';

export default class Player extends Mesh {
    constructor(scene) {
        const startY = CONFIG.PLAYER_SIZE / 2;
        super(scene, 0, startY, 0);

        this.size = CONFIG.PLAYER_SIZE;
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition = new THREE.Vector3(0, startY, 0);

        // State
        this.isMoving = false;
        this.isJumping = false;
        this.lastPosition = { ...this.gridPosition };

        // Terrain
        this.currentTileType = 'grass';
        this.currentSurface = null;
        this.isOnLog = false;
        this.currentLog = null;
        this.isInWater = false;

        // Create player mesh
        this.createMesh();
        this.updateBoundingBox();
    }

    createMesh() {
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const material = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.PLAYER });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.targetPosition);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }

    move(direction) {
        if (this.isMoving) return;

        this.isMoving = true;
        this.isJumping = true;
        this.lastPosition = { ...this.gridPosition };

        switch (direction) {
            case 'forward': this.gridPosition.z -= 1; break;
            case 'backward': this.gridPosition.z += 1; break;
            case 'left': this.gridPosition.x -= 1; break;
            case 'right': this.gridPosition.x += 1; break;
        }

        this.targetPosition.set(
            this.gridPosition.x * CONFIG.TILE_SIZE,
            this.targetPosition.y,
            this.gridPosition.z * CONFIG.TILE_SIZE
        );

        this.jumpAnimation(() => {
            this.isMoving = false;
        });

        return {
            previousPosition: { ...this.lastPosition },
            newPosition: { ...this.gridPosition }
        };
    }

    jumpAnimation(callback) {
        const jumpHeight = this.size * CONFIG.PLAYER_JUMP_HEIGHT;
        const jumpDuration = CONFIG.PLAYER_MOVE_SPEED;
        const startTime = Date.now();
        const startY = this.mesh.position.y;
        const startPos = this.mesh.position.clone();
        const target = this.targetPosition.clone();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / jumpDuration, 1);

            this.mesh.position.x = startPos.x + (target.x - startPos.x) * progress;
            this.mesh.position.z = startPos.z + (target.z - startPos.z) * progress;

            this.mesh.position.y = progress <= 0.5
                ? startY + jumpHeight * (progress * 2)
                : startY + jumpHeight * (2 - progress * 2);

            this.mesh.rotation.y = Math.atan2(
                target.x - startPos.x,
                target.z - startPos.z
            );

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isJumping = false;
                if (callback) callback();
            }
        };

        animate();
    }

    update() {
        this.checkCurrentTile();
        this.handleTileInteraction();

        if (!this.isJumping) {
            this.mesh.position.y = this.targetPosition.y +
                Math.sin(Date.now() / 500) * 0.05;
        }

        this.updateBoundingBox();
    }

    checkCurrentTile() {
        const previousLog = this.currentLog;
        this.currentSurface = null;
        this.isOnLog = false;
        this.currentLog = null;
        this.isInWater = false;

        const worldZ = this.gridPosition.z * CONFIG.TILE_SIZE;
        const terrainRow = this.findTerrainRowAtZ(worldZ);

        if (terrainRow) {
            this.currentTileType = terrainRow.type;
            switch (terrainRow.type) {
                case 'grass':
                case 'road':
                case 'rail':
                    this.handleSolidTile(terrainRow);
                    break;
                case 'river':
                    this.handleRiverTile(terrainRow);
                    break;
                default:
                    console.warn(`Unknown tile type: ${terrainRow.type}`);
                    this.handleSolidTile(terrainRow);
            }
        } else {
            this.currentTileType = 'grass';
            this.setPlayerHeight(CONFIG.TERRAIN_HEIGHTS.GRASS);
        }

        if (previousLog && previousLog !== this.currentLog) previousLog.playerLeft();
        if (this.currentLog && previousLog !== this.currentLog) this.currentLog.playerLanded();
    }

    findTerrainRowAtZ(worldZ) {
        if (window.game?.terrainGenerator?.rows) {
            return window.game.terrainGenerator.rows.find(row => {
                const start = row.z - CONFIG.TILE_SIZE / 2;
                const end = row.z + CONFIG.TILE_SIZE / 2;
                return worldZ >= start && worldZ < end;
            });
        }
        return null;
    }

    handleSolidTile(row) {
        this.setPlayerHeight(row.getTerrainHeight());
        if (row.type !== 'grass') this.checkCollision(row);
    }

    handleRiverTile(row) {
        const onLog = this.checkForLogsOnTile(row);
        this.isOnLog = onLog;
        this.isInWater = !onLog;

        const baseHeight = row.getTerrainHeight();
        this.setPlayerHeight(onLog ? baseHeight + 0.3 : baseHeight - 0.5);
    }

    checkForLogsOnTile(row) {
        if (!row.obstacles) return false;

        const feet = new THREE.Vector3(
            this.mesh.position.x,
            this.mesh.position.y - this.size / 2,
            this.mesh.position.z
        );

        for (const obstacle of row.obstacles) {
            if (obstacle.subtype === 'log' && obstacle.isLoaded && obstacle.boundingBox) {
                const expanded = obstacle.boundingBox.clone().expandByScalar(0.1);
                if (expanded.containsPoint(feet) && !this.isJumping) {
                    this.currentLog = obstacle;
                    this.currentSurface = obstacle;
                    return true;
                }
            }
        }

        return false;
    }

    checkCollision(row) {
        if (!row.obstacles) return;

        const playerBox = new THREE.Box3().setFromObject(this.mesh);

        for (const obstacle of row.obstacles) {
            if (obstacle.isLoaded && obstacle.boundingBox && obstacle.type === 'obstacle') {
                if (playerBox.intersectsBox(obstacle.boundingBox)) {
                    this.currentSurface = obstacle;
                    if (obstacle.static) {
                        // Block movement logic here
                    } else if (['car', 'truck', 'train'].includes(obstacle.subtype)) {
                        // this.triggerGameOver('vehicle');
                    }
                }
            }
        }
    }

    handleTileInteraction() {
        if (this.isInWater && !this.isOnLog) {
            // this.triggerGameOver('drowning');
            return;
        }

        if (this.isOnLog && this.currentLog) {
            this.currentLog.carryPlayer(this);
            this.gridPosition.x = Math.round(this.mesh.position.x / CONFIG.TILE_SIZE);
        }
    }

    setPlayerHeight(terrainHeight) {
        const newY = terrainHeight + this.size / 2;
        if (!this.isJumping) {
            this.targetPosition.y = newY;
            this.mesh.position.y = newY;
        }
    }

    triggerGameOver(reason) {
        console.log(`Game Over: ${reason}`);
        if (window.game?.handleGameOver) {
            window.game.handleGameOver(reason);
        } else {
            alert(`Game Over! Cause: ${reason}`);
            this.resetPlayerPosition();
        }
    }

    resetPlayerPosition() {
        this.gridPosition = { x: 0, y: 0, z: 0 };
        this.targetPosition.set(0, CONFIG.PLAYER_SIZE / 2, 0);
        this.mesh.position.copy(this.targetPosition);
        this.isMoving = false;
        this.isJumping = false;
        this.currentTileType = 'grass';
        this.currentSurface = null;
        this.isOnLog = false;
        this.currentLog = null;
        this.isInWater = false;
    }

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