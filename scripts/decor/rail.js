import Mesh from '../mesh.js';

class Rail extends Mesh {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/train_track.glb';
        this.type = 'decor';
        this.static = true;

        this.loadModel();
    }
}

export default Rail;