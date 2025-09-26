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

        // Set up default options
        this.options = {
            avoidCenter: true,             // Keep center area clear
            centerClearance: 3,            // How many units to keep clear in center
            heightOffset: 0.01,            // Y-position offset above terrain
            isMoving: true,                // Is this a moving obstacle?
            minSpacing: 1.5,               // Minimum spacing between objects
            ...options                     // Override with any passed options
        };
    }

    // Main method to spawn entites - called when creating manager
    spawn() {
        // Roll to see if we should spawn anything using chance value
        if (Math.random() > this.chance) {
            return [];
        }

        return this.spawnAssets();
    }

    spawnAssets() {

        // Calculate row information
        const rowHalfWidth = (CONFIG.ROW_WIDTH_IN_TILES * CONFIG.TILE_SIZE) / 2;
        const spawnedEntities = [];

        // Determine direction and speed
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

        // Calculate Y pos from terrain type and offset
        const terrainHeight = CONFIG.TERRAIN_HEIGHTS[this.terrainType.toUpperCase()] || 0.05;
        const y = terrainHeight + this.options.heightOffset;

        // Step 1: Create all entities for this row with temporary positions, then get their totalWidth value.
        const entities = [];

        for (let i = 0; i < this.count; i++) {
            // Create entity, with a temporary X position
            const entity = new this.EntityClass(this.scene, 0, y, this.row);

            // Get the totalWidth from the entity instance (Fallback to tile size)
            const width = entity.totalWidth || CONFIG.TILE_SIZE;
            
            // Store in entities array for positioning later
            entities.push({
                entity,
                width,
                positioned: false,
                finalX: 0
            });
        }

        // Step 2: Calculate final X pos for all entities in array
        if (this.options.isMoving && this.count === 1) {
            // Single moving entity - just use startX
            entities[0].finalX = startX;
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
                        entityData.finalX = x;
                        entityData.positioned = true;
                        positioned = true;
                        
                        // Register occupied space
                        occupiedRanges.push({
                            x,
                            width: entityData.width
                        });
                    }
                }

                // If we couldn't find a good position, use a fallback (Update to just destroy instead, otherwise janky look)
                if (!entityData.positioned) {
                    const fallbackX = (Math.random() - 0.5) * rowHalfWidth * 1.5;
                    entityData.finalX = fallbackX;
                    entityData.positioned = true;
                    console.warn(`Could not find non-overlapping position for ${this.EntityClass.name}. Using fallback position.`);
                }

            }
        }

        // Step 3: Position all entities at their calculated locations then ADD to scene 
        for (const entityData of entities) {
            if (entityData.positioned) {
                const entity = entityData.entity;
                
                // Update entity position
                entity.x = entityData.finalX;
                
                // Update the mesh position if it exists
                if (entity.mesh) {
                    entity.mesh.position.x = entityData.finalX;
                }
                
                // Set movement properties for moving entities
                if (this.options.isMoving) {
                    entity.direction = direction;
                    entity.speed = speed;
                }

                // Once calculated X position is set, call addToScene to add the mesh to the scene
                entity.addToScene();

                // Add to result array for tracking
                spawnedEntities.push(entity);

            } else {
                // If not positioned, remove from scene and clean up
                if (entityData.entity.mesh && this.scene) {
                    this.scene.remove(entityData.entity.mesh);
                }
            }
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
