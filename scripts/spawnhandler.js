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
        const direction = Math.random() > 0.5 ? 'right' : 'left';
        const baseSpeed = this.getDefaultSpeed();
        const speed = direction === 'right' ? baseSpeed : -baseSpeed;
        

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
        if (this.options.isMoving && this.count === 1) {
            // If there is only one movng entity, we can just set startX
            entities[0].entity.x = startX;
            entities[0].positioned = true;
        } else {
            // For multiple, or static entities we need to calculate spacing
            for (const entityData of entities) {
                let positioned = false;
                let attempts = 0;
                const maxAttempts = 10; // Avoid infinite loops

                while (!positioned && attempts < maxAttempts) {

                    attempts++;
                    let x;

                    if (this.options.isMoving) {
                        // Moving entities start at the edge with some variation
                        const variation = (Math.random() - 0.5) * 3;
                        x = startX + variation;
                    } else {
                        // Static entities use distribution that avoids center unless count === row width
                        x = this.generatePosWithEdgeWeighting(rowHalfWidth);
                    }
                    
                    // Skip if in center and we're avoiding center
                    if (this.options.avoidCenter && Math.abs(x) < this.options.centerClearance) {
                        continue;
                    }
                    
                    // Check for overlaps with existing entities
                    const overlapping = occupiedRanges.some(range => {
                        const minDist = (entityData.width + range.width) / 2 + this.options.minSpacing;
                        return Math.abs(x - range.x) < minDist;
                    });
                    
                    if (!overlapping) {
                        // Valid position found
                        entityData.entity.x = x;
                        entityData.positioned = true;
                        positioned = true;
                        
                        // Register occupied space
                        occupiedRanges.push({
                            x: x,
                            width: entityData.width
                        });
                    }
                }

                // If we couldn't position after max attempts, delete the entity
                if (!positioned) {
                    entityData.entity = null; // Mark for deletion
                }

            }
        }

        // Add all successfully positioned entities to the scene
        for (const entityData of entities) {
            // Get positioned entity
            const entity = entityData.entity;
            
            // Set entity position
            entity.x = entity.x || 0;
            entity.y = y;
            entity.z = this.row;
            
            // Set properties for moving entities
            if (this.options.isMoving) {
                entity.direction = direction;
                entity.speed = speed;
            }
            
            // Now add to scene (recreating with the scene parameter)
            const finalEntity = new this.EntityClass(
                this.scene, 
                entity.x, 
                entity.y, 
                entity.z,
                entity.segmentCount // Pass segment count if it exists
            );
            
            // Copy properties to final entity
            if (this.options.isMoving) {
                finalEntity.direction = direction;
                finalEntity.speed = speed;
            }
            
            // Add to return array
            spawnedEntities.push(finalEntity);
        }
        
        return spawnedEntities;
    }

    // Generate position with edge weighting 
    generatePosWithEdgeWeighting(rowHalfWidth) {
        // Use a power curve to weight toward edges
        const side = Math.random() > 0.5 ? 1 : -1;
        const value = Math.pow(Math.random(), 1.5); // Higher power = more edge weighting
        return side * value * rowHalfWidth * 0.8; // 80% of half width to stay on terrain
    }
    
    // Get default speed based on entity type (Replace with CONFIG values)
    getDefaultSpeed() {
        const className = this.EntityClass.name.toLowerCase();
        
        if (className.includes('train')) return 0.12;
        if (className.includes('car')) return 0.05 + (Math.random() * 0.02);
        if (className.includes('truck')) return 0.03 + (Math.random() * 0.01);
        if (className.includes('log')) return 0.02 + (Math.random() * 0.015);
        
        return 0.04; // Default for unknown types
    }

}
