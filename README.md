# debug-webgl2-mipmap

在WebGL2下，sRGB贴图在生成Mipmap时，如果`TEXTURE_MIN_FILTER`设置为`LINEAR_MIPMAP_LINEAR`，贴图中明暗对比越强烈的区域，生成的Mipmap相应区域就会越亮，Mipmap Level越高，现象越明显。

`res`目录下的几张贴图：
- `img1.png`: 灰度纯色贴图
- `img2.png`: 花纹贴图，变亮效果十分明显
- `img3.png`: 测试用文字贴图，文字区域变亮明显
- `img4.png`: 非密集花纹贴图，变亮不明显

可以通过修改`index.html`中的`repeat`值，来激活使用不同Level的Mipmap
