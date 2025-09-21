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
        GRASS: 0.20,                   // Grass: 20cm high
        ROAD: 0.15,                    // Road: 15cm high
        RAIL: 0.15,                    // Rail: 15cm high
        RIVER: 0.01,                   // River: 1cm high
    },

    // Player settings
    PLAYER_SIZE: 0.8,
    PLAYER_JUMP_HEIGHT: 1.5,
    PLAYER_MOVE_SPEED: 200,
    PLAYER_MOVE_COOLDOWN: 150,          // Time between moves in ms
    
    // Camera settings with new names
    CAMERA_POS_Y: 12,                   // Height above player
    CAMERA_POS_Z: 8,                    // Distance behind player
    CAMERA_POS_X: 5.2,                  // Side offset (negative = left of player)
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
        GRASS_A: 0xBEF565,
        GRASS_B: 0xB5ED5D,
        ROAD: 0x555555,
        RAIL: 0x777777,
        RIVER: 0x4444FF,
        PLAYER: 0x0000ff
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