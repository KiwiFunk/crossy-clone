import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const CONFIG = {
    // Core scaling system: 1 unit = 1 meter = 100cm
    UNIT_SIZE: 1.0,                    // 1 unit = 1 meter
    TILE_SIZE: 1.0,                    // Each terrain tile is 1m x 1m
    
    // Terrain dimensions (in tiles)
    ROW_WIDTH_IN_TILES: 20,             // Row width: 20 tiles (20 meters)
    ROW_DEPTH_IN_TILES: 1,              // Row depth: 1 tile (1 meter)
    ROW_SPACING: 1.0,                  // Distance between rows: 1 meter
    
    // Terrain heights (in meters) - models will define their own heights
    TERRAIN_HEIGHTS: {
        GRASS: 0.30,                   // Grass: 30cm high
        TREES: 0.30,                   // Trees: 30cm high  
        ROAD: 0.18,                    // Road: 18cm high
        RAIL: 0.12,                    // Rail: 12cm high
        RIVER: 0.01,                   // River: 1cm high
    },

    // Mesh settings
    BBOX_PADDING: 0.025,                  // Padding for bounding boxes (in meters)

    // Player settings
    PLAYER_SIZE: 0.8,
    PLAYER_JUMP_HEIGHT: 1.5,
    PLAYER_MOVE_SPEED: 200,
    PLAYER_MOVE_COOLDOWN: 210,          // Time between moves in ms
    
    // Camera settings with new names
    CAMERA_POS_Y: 10,                   // Height above player
    CAMERA_POS_Z: 6,                    // Distance behind player
    CAMERA_POS_X: 4.8,                  // Side offset (negative = left of player)
    CAMERA_FOLLOW_SPEED: 0.05,          // Camera smoothing
    
    // Camera rotation settings
    CAMERA_ROT_X: degreesToRadians(55),     // Look down angle
    CAMERA_ROT_Y: degreesToRadians(-20),    // Y rotation
    CAMERA_ROT_Z: degreesToRadians(-18),    // Z rotation (roll)
    
    // Game settings
    MAX_DRAW_DISTANCE: 20,
    SAFE_ZONE_ROWS: 4,
    DEATH_ZONE_DISTANCE: 15,
    
    // Colors
    COLORS: {
        GRASS_A: 0xB4EB5D,
        GRASS_B: 0xABE255,
        ROAD: 0x555555,
        RAIL: 0x777777,
        RIVER: 0x73E4FB,
        PLAYER: 0x0000ff,
        BACKGROUND: 0x87CEEB
    },

    // Model Dimensions
    MODEL_DIMENSIONS: {
        LOG: {
            END_CAP_WIDTH: 0.3,
            SEGMENT_WIDTH: 1,    
            HEIGHT: 0.5189293026924133,           
            DEPTH: 0.5189293026924133             
        },
        CAR: {
            WIDTH: 1.4250739216804504,
            HEIGHT: 0.6552509561588522,
            DEPTH: 0.7898918390274048
        },
        TRUCK: {
            WIDTH: 2.7795649766921997,
            HEIGHT: 1.17115620279219,
            DEPTH: 0.9071100056171417
        },
        TRAIN: {
            TRAIN_WIDTH: 2.883249878883362,
            CARRIAGE_WIDTH: 2.6866562366485596,
            HEIGHT: 1.0127716436982155,
            DEPTH: 0.8591645956039429
        },
        TREE: {
            WIDTH: 1.0,
            HEIGHT: 5.0,
            DEPTH: 1.0
        },
    },

    MODEL_SPEEDS: {
        CAR: { MIN: 0.02, MAX: 0.06 },
        TRUCK: { MIN: 0.01, MAX: 0.04 },
        TRAIN: { MIN: 0.12, MAX: 0.15 },
        LOG: { MIN: 0.02, MAX: 0.05 }
    }
    
};

// Convert degrees to radians
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees  
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Calculate dimensions of a mesh
export async function calculateMeshDimensions(path) {
    
    const loader = new GLTFLoader();

    const gltf = await new Promise((resolve, reject) => {
        loader.load(path, resolve, null, reject);
    });

    const mesh = gltf.scene;
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = bbox.getSize(new THREE.Vector3());
    
    console.log(`=== Calculating dimensions for ${path} ===`);

    console.log("Mesh dimensions:", {
        width: size.x,
        height: size.y,
        depth: size.z
    });

    console.log(`=== Finished calculating dimensions for ${path} ===`);
}