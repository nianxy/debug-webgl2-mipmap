const buffers = {};

const vs = `
  attribute vec3 aPos;
  attribute vec2 aVertexTextureCoord;
  varying highp vec2 vTextureCoord;

  void main(void){
    gl_Position = vec4(aPos, 1);
    vTextureCoord = aVertexTextureCoord;
  }
`;

const fs = `
  varying highp vec2 vTextureCoord;
  precision mediump float;
  uniform sampler2D uSampler;

  vec4 LinearTosRGB( in vec4 value ) {
    return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
  }

  void main(void) {
    // gl_FragColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor = LinearTosRGB(texture2D(uSampler, vTextureCoord));
  }
`;

function createShader(gl, src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader: " + gl.getShaderInfoLog(shader));
  }
  return shader;
}

const vertex = [-1, -1, 0.0, 1, -1, 0.0, 1, 1, 0.0, -1, 1, 0.0];

const vertexIndice = [0, 1, 2, 0, 2, 3];

function createRenderer(
  canvas,
  width,
  height,
  { useGL2, repeat = 3.0, srgb = false, mipmap = true } = {}
) {
  const useSrgb = useGL2 && srgb;
  const texCoords = [0.0, 0.0, repeat, 0.0, repeat, repeat, 0.0, repeat];
  console.log("rendering with params...", { useGL2, repeat, srgb });
  const gl = canvas.getContext(useGL2 ? "webgl2" : "webgl");
  if (!gl) {
    console.error("Unable to get webgl context.");
    return;
  }

  gl.canvas.width = width;
  gl.canvas.height = height;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  const vertexShader = createShader(gl, vs, gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, fs, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Unable to initialize the shader program.");
    return;
  }

  gl.useProgram(program);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  if (mipmap) {
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);

  buffers.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);

  buffers.vertexIndiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.vertexIndiceBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(vertexIndice),
    gl.STATIC_DRAW
  );

  const aVertexPosition = gl.getAttribLocation(program, "aPos");
  gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aVertexPosition);

  buffers.trianglesTexCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.trianglesTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

  const vertexTexCoordAttribute = gl.getAttribLocation(
    program,
    "aVertexTextureCoord"
  );
  gl.enableVertexAttribArray(vertexTexCoordAttribute);
  gl.vertexAttribPointer(vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  const samplerUniform = gl.getUniformLocation(program, "uSampler");
  gl.uniform1i(samplerUniform, 0);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(
    gl.SRC_ALPHA,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA
  );

  const render = (image) => {
    // console.log("drawing...");

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (useSrgb) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.SRGB8_ALPHA8,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
    }
    if (mipmap) gl.generateMipmap(gl.TEXTURE_2D);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(() => render(image));
  };

  return render;
}
if (typeof exports === "object") module.exports = { createRenderer };
else window.createRenderer = createRenderer;
