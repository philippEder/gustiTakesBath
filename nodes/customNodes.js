class TubRenderNode extends CubeRenderNode {

    constructor() {
        super(tubColorsBuffer, 1)
    }
}

class WaterRenderNode extends CubeRenderNode {


    constructor(animationInterval) {
        super(waterColorsBuffer, 0.3)
        this.animationInterval = animationInterval;
    }

    render(context) {
        waterAnimationCounter++;
    
        if (waterAnimationCounter > this.animationInterval) {
            var posMatrix = glm.translate(0,0.1,0);
            context.sceneMatrix = mat4.multiply(mat4.create(), context.sceneMatrix, posMatrix);
        }

        if (waterAnimationCounter > this.animationInterval * 2) {
            waterAnimationCounter = 0;
        }

        super.render(context);
    }

}



