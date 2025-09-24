export class SpawnManager {
    constructor(scene, mesh, count, chance, terrainRowZ) {
       this.scene = scene;              // Scene we are spawning into
       this.mesh = mesh;                // Mesh to spawn
       this.row = terrainRowZ;          // Which Row are we spawning in
       this.chance = chance;            // Chance of spawning
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
    

};
