import Obstacle from '../obstacle.js';

class Log extends Obstacle {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        this.modelPath = 'assets/log.glb';
        this.type = 'log';
        this.speed = Obstacle.getRandomSpeed(0.01, 0.08);

        this.loadModel();
    }

}

export default Log;