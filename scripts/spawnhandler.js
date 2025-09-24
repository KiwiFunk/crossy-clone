import { CONFIG } from './config.js';
import * as THREE from 'three';

export class SpawnManager {
    constructor(scene, EntityClass, count, chance, terrainRowZ, options = {}) {
       this.scene = scene;              // Scene we are spawning into
       this.EntityClass = EntityClass;  // Entity class to instantiate (Car, Truck, Log, Train, etc.)
       this.row = terrainRowZ;          // Which Row are we spawning in (Z Position)
       this.count = count;              // How many to spawn
       this.chance = chance;            // Chance of spawning (0.0 - 1.0)
       this.options = options;          // Additional options for spawning (e.g., speed, direction)

       // Set up default options
        this.options = {
            avoidCenter: true,             // Keep center area clear
            centerClearance: 3,            // How many units to keep clear in center
            heightOffset: 0.01,            // Y-position offset above terrain
            isMoving: true,                // Is this a moving obstacle?
            minSpacing: 1.5,               // Minimum spacing between objects
            terrainHeight: 0.1,            // Height of terrain
            ...options                     // Override with any passed options
        };

        // Handle the spawning if chance permits
        if (Math.random() <= this.chance) {
            return this.spawnAssets();
        }
        
        return []; // Return empty array if nothing spawned
    }

    spawnAssets() {

        // 1. Get the row dimensions
        const rowHalfWidth = (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE) / 2;

        // 2. If !Static, determine direction and speed
        if(this.options.isMoving) {
            const direction = Math.random() > 0.5 ? 'right' : 'left';
            const baseSpeed = this.getAppropriateSpeed();
            const speed = direction === 'right' ? baseSpeed : -baseSpeed;
        }

        // Moving objects spawn offscreen
        let startX = 0;
        if (this.options.isMoving) {
            const spawnDistance = 5; // 5 meters outside view
            startX = direction === 'right' 
                ? -rowHalfWidth - spawnDistance 
                : rowHalfWidth + spawnDistance;
        }

        // Plan object positions to avoid overlap
        const plannedPositions = [];
        const spawnedEntities = [];

        // 3. Create asset plans to avoid overlap
        const plans = this.createAssetPlans();

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
