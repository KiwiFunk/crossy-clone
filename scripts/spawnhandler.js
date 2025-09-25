import { CONFIG } from './config.js';
import * as THREE from 'three';

export class SpawnManager {
    constructor(scene, EntityClass, count, chance, terrainRowZ, terrainType, options = {}) {
        this.scene = scene;              // Scene we are spawning into
        this.EntityClass = EntityClass;  // Entity class to instantiate (Car, Truck, Log, Train, etc.)
        this.count = count;              // How many to spawn
        this.chance = chance;            // Chance of spawning (0.0 - 1.0)
        this.row = terrainRowZ;          // Which Row are we spawning in (Z Position)
        this.terrainType = terrainType;  // Type of terrain (to calculate y pos)
        this.options = options;          // Additional options for spawning (e.g., speed, direction)

       // Set up default options
        this.options = {
            avoidCenter: true,             // Keep center area clear
            centerClearance: 3,            // How many units to keep clear in center
            heightOffset: 0.01,            // Y-position offset above terrain
            isMoving: true,                // Is this a moving obstacle?
            minSpacing: 1.5,               // Minimum spacing between objects
            ...options                     // Override with any passed options
        };

        // Handle the spawning if chance permits
        if (Math.random() <= this.chance) {
            return this.spawnAssets();
        }
        
        return []; // Return empty array if nothing spawned
    }

    spawnAssets() {

        // Calculate row information
        const rowHalfWidth = (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE) / 2;
        const spawnedEntities = [];

        // If !Static, determine direction and speed
        if(this.options.isMoving) {
            const direction = Math.random() > 0.5 ? 'right' : 'left';
            const baseSpeed = this.getDefaultSpeed();
            const speed = direction === 'right' ? baseSpeed : -baseSpeed;
        }

        // Calculate initial X pos (for moving objects, this is offscreen)
        let startX = 0;
        if (this.options.isMoving) {
            const spawnDistance = rowHalfWidth + 2; // Start just offscreen (2m offset)
            startX = direction === 'right' 
                ? -rowHalfWidth - spawnDistance 
                : rowHalfWidth + spawnDistance;
        }

        // Track occupied zones to avoid overlap
        const occupiedRanges = [];

        // Store entities in array before adding to scene
        const entities = [];

        // Calculate Y pos from terrain type and offset
        const terrainHeight = CONFIG.TERRAIN_HEIGHTS[this.terrainType.toUpperCase()] || 0.05;
        const y = terrainHeight + this.options.heightOffset;

        // Create all entities using count param and determine their model widths
        for (let i = 0; i < this.count; i++) {

            // Create entity, but don't add to scene yet (pass null as scene)
            const entity = new this.EntityClass(null, 0, y, this.row);
            
            // Store in entities array for positioning later
            entities.push({
                entity: entity,
                width: entity.totalWidth || 1.0, // Default to 1.0 if width not defined
                positioned: false
            });
        }

        // Calculate X pos for all entities in array











        // Plan object positions to avoid overlap
        const plannedPositions = [];

      

        // Loop through the plans array and try to place each asset

        // Loop through using count parameter
        for (let i = 0; i < this.plans.length; i++) {
            // Clone the mesh and add it to an array of objects to add
            // Add the XPos to the occupiedZones width, using the model width to calculate the range
            // If the randomized x location is in this array, try again
            // else limit the number of attempts to avoid infinite loops
            // exit
            // If the mesh is static, we will need to avoid handling things such as speed

        // Push the collection of assets to the scene
        }
    }

    createAssetPlans() [
        // Plan out our assets for this row
        // If we are spawnming multiple, we need to use object widths to avoid overlap
        // Return an array of planned X positions
        // Assets comprised of multiple parts need their class to return some kind of flag to allow this to be handled. We can return a 2D array with the width of each part in the sub-array

    ]
}
