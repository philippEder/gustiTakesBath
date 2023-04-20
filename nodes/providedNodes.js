class SceneGraphNode {

    constructor() {
        this.children = [];
    }

    append(child) {
        this.children.push(child);
        return child;
    }
    remove(child) {
        var i = this.children.indexOf(child);
        if (i >= 0) {
            this.children.splice(i, 1);
        }
        return i >= 0;
    };

    render(context) {
        this.children.forEach(function (c) {
            return c.render(context);
        });
    };
}

class ShaderSceneGraphNode extends SceneGraphNode { //compare with ShaderSGNode in framework.js

    constructor(shader) {
        super();
        this.shader = shader;
    }

    render(context) {
        var backup = context.shader;
        context.shader = this.shader;
        context.gl.useProgram(this.shader);
        super.render(context);
        context.shader = backup;
        context.gl.useProgram(backup);
    }
};

class TransformationSceneGraphNode extends SceneGraphNode { //compare with TransformationSGNode in framework.js

    constructor(matrix) {
        super();
        this.matrix = matrix || mat4.create();
    }

    render(context) {
        var previous = context.sceneMatrix;
        if (previous === null) {
            context.sceneMatrix = mat4.clone(this.matrix);
        }
        else {
            context.sceneMatrix = mat4.multiply(mat4.create(), previous, this.matrix);
        }

        super.render(context);
        context.sceneMatrix = previous;
    }

    setMatrix(matrix) {
        this.matrix = matrix;
    }
}

class QuadRenderNode extends SceneGraphNode {

    render(context) {

        setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);


        var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
        gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLocation);

        //set alpha value for blending
        //TASK 1-3
        gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 1);

        // draw the bound data as 6 vertices = 2 triangles starting at index 0
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        super.render(context);
    }
}

class CubeRenderNode extends SceneGraphNode {

    constructor(colorBuffer, transparency) {
        super();
        this.colorBuffer = colorBuffer;
        this.transparency = transparency;
    }

    render(context) {

        //setting the model view and projection for the shader
        setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);


        var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLocation);

        //set alpha value for blending
        //TASK 1-3
        gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), this.transparency);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
        gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

        //render children
        super.render(context);
    }
}