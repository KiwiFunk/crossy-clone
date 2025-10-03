import { CONFIG } from './config.js';

export class SpawnManager {
    constructor(scene, EntityClass, count, chance, terrainRowZ, terrainType, options = {}) {
        this.scene = scene;
        this.EntityClass = EntityClass;
        this.count = count;
        this.chance = chance;
        this.row = terrainRowZ;
        this.terrainType = terrainType;

        this.options = {
            avoidCenter: true,
            centerClearance: 3,
            heightOffset: 0.01,
            isMoving: true,
            variance: true,
            varianceAmount: 0.15, // Percentage of TILE_SIZE for max variance
            fallbackStrategy: 'warn', // 'destroy', 'force', 'warn'
            biasStrength: 1.0,
            ...options
        };
    }
    // Entry point to attempt spawning
    spawn() {
        return Math.random() > this.chance ? [] : this.spawnAssets();
    }

    /**
     * Main spawning logic: creates entities, assigns positions, and adds them to the scene.
     * @returns {Array} Array of successfully spawned entities
     */
    spawnAssets() {
        // Calculate row information (Total Width and height)
        const rowHalfWidth = (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE) / 2;
        const terrainHeight = CONFIG.TERRAIN_HEIGHTS[this.terrainType.toUpperCase()] || 0.05;
        const y = terrainHeight + this.options.heightOffset;

        // Set up movement direction and startX for moving entities
        const direction = Math.random() > 0.5 ? 'right' : 'left';
        const startX = this.options.isMoving
            ? direction === 'right' ? -rowHalfWidth - 2 : rowHalfWidth + 2
            : 0;

        // Calculate the speed for this row using ranges defined in CONFIG, with a difficulty modifier based of Z value
        let finalSpeed = null;
        if (this.options.isMoving) {
            const speeds = CONFIG.MODEL_SPEEDS[this.EntityClass.entityType];
            const baseSpeed = Math.random() * (speeds.MAX - speeds.MIN) + speeds.MIN;
            const difficultyModifier = Math.abs(this.row) / 10000;
            finalSpeed = baseSpeed + difficultyModifier;
        }

        // Track occupied tiles to prevent overlaps, create array to store positioned Entities
        const tileOccupancy = new Array(CONFIG.ROW_WIDTH_IN_TILES).fill(false);
        const spawnedEntities = [];

        // Create entities array using count parameter with an initial x of 0
        const entities = Array.from({ length: this.count }, () => {
            const entity = new this.EntityClass(this.scene, 0, y, this.row);

            entity.direction = direction;
            entity.speed = finalSpeed;

            const width = entity.totalWidth || CONFIG.TILE_SIZE;
            return { entity, width, positioned: false, finalX: 0 };
        });

        // Start to position each entity in entity array
        for (const entityData of entities) {
            if (this.options.isMoving && this.count === 1) {
                // Single moving entity place at startX
                entityData.finalX = startX;
                entityData.positioned = true;
                continue;
            }

            let attempts = 0;
            const maxAttempts = 10;

            while (!entityData.positioned && attempts < maxAttempts) {
                attempts++;
                const tilesNeeded = Math.ceil(entityData.width / CONFIG.TILE_SIZE);
                const pos = this.generateTileBasedPosition(rowHalfWidth, tilesNeeded, tileOccupancy);

                if (!pos) continue;

                const { x, tileIndex } = pos;

                // Skip if too close to center
                if (this.options.avoidCenter && Math.abs(x) < this.options.centerClearance) continue;

                // Check if the position is valid, then reserve the space if true
                if (this.canPlaceAt(tileIndex, tilesNeeded, tileOccupancy)) {
                    this.reserveTiles(tileIndex, tilesNeeded, tileOccupancy);
                    entityData.finalX = x;
                    entityData.positioned = true;
                }
            }
            // If asset could not be placed, handle according to fallback strategy
            if (!entityData.positioned) {
                switch (this.options.fallbackStrategy) {
                    case 'destroy':
                        console.warn(`Destroyed ${this.EntityClass.name} due to placement failure.`);
                        if (entityData.entity.destroy) {
                            entityData.entity.destroy();
                        }
                        entityData.entity = null; // Mark for removal
                        continue;
                    case 'force':
                        entityData.finalX = (Math.random() - 0.5) * rowHalfWidth * 1.5;
                        entityData.positioned = true;
                        break;
                    case 'warn':
                    default:
                        entityData.finalX = (Math.random() - 0.5) * rowHalfWidth * 1.5;
                        entityData.positioned = true;
                        console.warn(`Could not find non-overlapping position for ${this.EntityClass.name}. Using fallback.`);
                        break;
                }
            }
        }
        // Finalize entity positions and add to spawnedEntities array for tracking/cleanup
        for (const { entity, finalX, positioned } of entities) {
            if (!entity || !positioned) {
                // Redundant check, *should* not happen due to above logic
                if (entity && entity.mesh && this.scene) this.scene.remove(entity.mesh);
                continue;
            }

            entity.x = finalX;

            // Handle edge case where mesh already loaded before X was set
            if (entity.mesh) {
                entity.mesh.position.x = finalX;
                console.log("Mesh loaded before finalX was set");
            }

            spawnedEntities.push(entity);
        }

        return spawnedEntities;
    }

    /**
     * Generates a tile-based position with edge bias and optional variance.
     * Filters out tiles that can't fit the entity.
     * @param {number} rowHalfWidth - Half the width of the row
     * @param {number} tilesNeeded - Number of tiles the entity spans
     * @param {Array} tileOccupancy - Boolean array of tile usage
     * @returns {Object|null} Position object with x and tileIndex, or null if none available
     */
    generateTileBasedPosition(rowHalfWidth, tilesNeeded, tileOccupancy) {
        const { ROW_WIDTH_IN_TILES: numTiles, TILE_SIZE: tileSize } = CONFIG;

        const tilePositions = Array.from({ length: numTiles }, (_, i) => {
            const x = -rowHalfWidth + i * tileSize + tileSize / 2;
            // Calculate edgeScore with bias towards edges
            const edgeScore = Math.pow(Math.abs((i / (numTiles - 1)) - 0.5) * 2, this.options.biasStrength);
            return { x, edgeScore, tileIndex: i };
        });

        const validTiles = tilePositions.filter(pos => {
            const { tileIndex } = pos;
            return this.canPlaceAt(tileIndex, tilesNeeded, tileOccupancy);
        });

        if (validTiles.length === 0) return null;

        // Weighted random selection based on edgeScore
        const totalWeight = validTiles.reduce((sum, p) => sum + p.edgeScore, 0);
        const rand = Math.random() * totalWeight;

        let cumulative = 0;
        for (const pos of validTiles) {
            cumulative += pos.edgeScore;
            if (rand <= cumulative) {
                let finalX = pos.x;
                if (this.options.variance) {
                    const maxVariance = tileSize * this.options.varianceAmount;
                    finalX += (Math.random() - 0.5) * maxVariance * 2;
                }
                return { x: finalX, tileIndex: pos.tileIndex };
            }
        }

        return null;
    }

    canPlaceAt(tileIndex, tilesNeeded, tileOccupancy) {
        if (tileIndex + tilesNeeded > tileOccupancy.length) return false;
        for (let i = tileIndex; i < tileIndex + tilesNeeded; i++) {
            if (tileOccupancy[i]) return false;
        }
        return true;
    }

    reserveTiles(tileIndex, tilesNeeded, tileOccupancy) {
        for (let i = tileIndex; i < tileIndex + tilesNeeded; i++) {
            tileOccupancy[i] = true;
        }
    }
}