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
        // Configs for this asset
        const numLogs = Math.floor(Math.random() * 3) + 1; // 1-3 logs
        const direction = Math.random() > 0.5 ? 'right' : 'left';
        const speedValue = Math.random() * 0.03 + 0.02;
        const signedSpeed = direction === 'right' ? speedValue : -speedValue;

        // Row dimensions
        const rowHalfWidth = (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE) / 2; // 10 meters
        const spawnDistance = 5; // 5 meters outside the view

        // Set spawn side based on direction
        const startX = direction === 'right' ? -rowHalfWidth - spawnDistance : rowHalfWidth + spawnDistance;

        // Keep track of assets to avoid overlaps if there are multiple
        const occupiedZones = [];

        // Loop through using count parameter
        for (let i = 0; i < this.count; i++) {
            // Clone the mesh and add it to an array of objects to add
            // Add the XPos to the occupiedZones width, using the model width to calculate the range
            // If the randomized x location is in this array, try again
            // else limit the number of attempts to avoid infinite loops
            // exit
            // If the mesh is static, we will need to avoid handling things such as speed

        // Push the collection of assets to the scene
        }
    }
}
