## 介绍 ##
本游戏使用了HTML5中的canvas，基于观察者模式，和MVC模式开发的一个十分简单的小游戏
## 思路 ##
Tile base的随机地图生成，这次使用了[细胞自动机](https://baike.baidu.com/item/%E5%85%83%E8%83%9E%E8%87%AA%E5%8A%A8%E6%9C%BA)的概念，根据一定规则，让地图自动演化成新的随机地图。

本代码使用的规则是
> 1. 按照 40% 几率初始化数据；Winit(p) = rand(0, 100) < 40% //Winit生成一个二维数组R，且Math.random()小于40%为墙壁
> 2. 重复四次：W'(p) = R1(p) >= 5 || R2(p) <= 2 // W'(p)是R的克隆数组
> 3. 重复三次：W'(p) = R1(p) >= 5 //R2表示改坐标第二圈的墙壁数目

进而生成随机地图，然而偶尔还是会遇到一些不联通的情况，这时候用代码把它打通就显得较为容易啦。

[参考文档](https://www.indienova.com/indie-game-development/procedural-content-generation-tile-based-random-cave-map/)

## 项目优化 ##
关于JS
  避免了多次重绘，使用了**双缓存技术**，先将整体大背景绘在一个bgCanvas当中进行存储，然后再将整个bgCanvas绘制(drawImage)到真正的canvasDOM节点里，然后再绘入player的图像，而每次keyDown事件触发的时候，改变player的坐标(x,y)，并移动bgCanvas让player在canvas居中即可
  ``` javascript
self.ctx.fillStyle = self.src.floor;
self.ctx.fillRect(data.player.x * 32, data.player.y * 32, 32, 32);//将先前的位置改成地板，从而去掉之前的物体
img.src = self.src.player;
self.ctx1.clearRect(0, 0, 600, 480);
self.ctx1.drawImage(self.canvas, this.data.x - 300, this.data.y - 240, 600, 480, 0, 0, 600, 480);
self.ctx1.drawImage(img, 300, 240);
  ```

