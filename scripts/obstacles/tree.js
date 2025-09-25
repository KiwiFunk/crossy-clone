import Mesh from '../mesh.js';
import { CONFIG } from '../config.js';

class Tree extends Mesh {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = ['assets/tree_a.glb', 'assets/tree_b.glb', 'assets/tree_c.glb'][Math.floor(Math.random() * 3)]; // Randomly choose between three tree models
        this.type = 'tree';
        this.static = true; 
        this.totalWidth = CONFIG.MODEL_DIMENSIONS.TREE.WIDTH;

        this.loadModel();
    }
}

export default Tree;