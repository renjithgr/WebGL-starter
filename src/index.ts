let canvas: HTMLCanvasElement = document.getElementById('webgl') as HTMLCanvasElement;
canvas.width = canvas.height = 640;
let gl: WebGLRenderingContext = canvas.getContext("webgl");

if(!gl) {
    throw new Error("WebGL failed to initialize");
}

gl.clearColor(0.0, 0.0, 0.0, 0.0);
gl.colorMask(true, true, true, true);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.cullFace(gl.BACK);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const positions = new Float32Array([
    1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0,
    0.0, 1.0, 0.0
]);

const colors = new Float32Array([
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
]);

let positionBuffer: WebGLBuffer = null;
let colorBuffer: WebGLBuffer = null;

let createBuffer = (arr: ArrayBuffer) => {
    let buf = gl.createBuffer();
    let bufType = arr instanceof Uint16Array || arr instanceof Uint32Array ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    gl.bindBuffer(bufType, buf);
    gl.bufferData(bufType, arr, gl.STATIC_DRAW);
    return buf;
};

positionBuffer = createBuffer(positions);
colorBuffer = createBuffer(colors);

const indices = new Uint16Array([0, 1, 2]);
let indexBuffer: WebGLBuffer = null;
indexBuffer = createBuffer(indices);

let vertModule: WebGLShader = null;

const vertShaderCode = `
attribute vec3 inPosition;
attribute vec3 inColor;

varying vec3 vColor;

void main()
{
    vColor = inColor;
    gl_Position = vec4(inPosition, 1.0);
}
`;

let createShader = (source: string, stage: GLenum) => {
    let s = gl.createShader(stage);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(`An error occurred compiling the shader: ${gl.getShaderInfoLog(s)}`);
    }
    return s;
}

vertModule = createShader(vertShaderCode, gl.VERTEX_SHADER);

let fragModule: WebGLShader = null;

const fragShaderCode = `
precision mediump float;

varying highp vec3 vColor;

void main()
{
    gl_FragColor = vec4(vColor, 1.0);
}
`;

fragModule = createShader(fragShaderCode, gl.FRAGMENT_SHADER);

let program: WebGLProgram = null;

let createProgram = (stages: WebGLShader[]) => {
    let p = gl.createProgram();
    for (let stage of stages) {
        gl.attachShader(p, stage);
    }
    gl.linkProgram(p);
    return p;
}

program = createProgram([vertModule, fragModule]);

let animationHandler: number = 0;

let render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.scissor(0, 0, canvas.width, canvas.height);

    let setVertexBuffer = (buf: WebGLBuffer, name: string) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        let loc = gl.getAttribLocation(program, name);
        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 4 * 3, 0);
        gl.enableVertexAttribArray(loc);
    };

    setVertexBuffer(positionBuffer, 'inPosition');
    setVertexBuffer(colorBuffer, 'inColor');

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

    animationHandler = requestAnimationFrame(render);
};

render();
