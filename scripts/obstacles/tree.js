import Obstacle from '../obstacle.js';

class Tree extends Obstacle {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = ['assets/tree_a.glb', 'assets/tree_b.glb'][Math.floor(Math.random() * 2)]; // Randomly choose between two tree models
        this.type = 'tree';
        this.static = true; 

        this.loadModel();
    }
}

export default Tree;