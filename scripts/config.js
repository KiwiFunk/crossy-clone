export const CONFIG = {
    // Grid and spacing
    GRID_SIZE: 1,
    ROW_SPACING: 1,
    TERRAIN_WIDTH: 20,
    TERRAIN_DEPTH: 1,
    
    // Player settings
    PLAYER_SIZE: 1,
    PLAYER_JUMP_HEIGHT: 1.5,
    PLAYER_MOVE_SPEED: 200,
    
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
        GRASS: 0x55AA55,
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