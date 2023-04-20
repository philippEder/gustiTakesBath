class TubRenderNode extends CubeRenderNode {

    constructor() {
        super(tubColorsBuffer, 1)
    }
}

class WaterRenderNode extends CubeRenderNode {

    constructor() {
        super(waterColorsBuffer, 0.3)
    }
}



