export const CONFIG = {
    // Grid and spacing
    GRID_SIZE: 1,               // Base unit for everything
    ROW_SPACING: 1,             // Distance between terrain rows
    TERRAIN_WIDTH: 20,          // Width of each terrain row
    TERRAIN_DEPTH: 1,           // Depth of each terrain row
    
    // Player settings
    PLAYER_SIZE: 1,             // Size of player cube
    PLAYER_JUMP_HEIGHT: 1.5,    // How high player jumps
    PLAYER_MOVE_SPEED: 200,     // Milliseconds per move
    
    // Camera settings
    CAMERA_HEIGHT: 15,          // How high camera is
    CAMERA_BACK: 12,            // How far behind camera is
    CAMERA_OFFSET: 0,           // Side offset
    CAMERA_PUSH_SPEED: 0.02,    // How fast camera pushes forward
    CAMERA_FOLLOW_SPEED: 0.05,  // How smooth camera follows

    // Game settings
    MAX_DRAW_DISTANCE: 20,      // How far ahead to generate terrain
    SAFE_ZONE_ROWS: 4,          // Number of safe grass rows at start
    DEATH_ZONE_DISTANCE: 15,    // How far behind player can fall

    // Colors
    COLORS: {
        GRASS: 0x55AA55,
        ROAD: 0x555555,
        RAIL: 0x777777,
        RIVER: 0x4444FF,
        PLAYER: 0x0000ff
    }
};