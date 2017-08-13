document.addEventListener("DOMContentLoaded", function() {
	window.requestAnimationFrame(function() {
		var manager = new GameManager(50, Actuator, keyboardManager);
	});
});

const TILE = {
	boss: 6,
	enermy: 5,
	weapon: 4,
	heart: 3,
	player: 2,
	wall: 1,
	floor: 0,
	stair: -1
};

function Player() {
	this.restart();
	this.type = TILE.player;
}

Player.prototype.restart = function() {
	this.health = 100;
	this.ATK = 100; //攻击力
	this.level = 1;
};

function Boss(x, y) {
	this.health = 500;
	this.ATK = 300;
	this.type = TILE.boss;
}

function Health() {
	this.health = 50;
	this.type = TILE.heart;
}

function Enermy(x, y) {
	this.health = 50;
	this.ATK = 50;
	this.type = TILE.enermy;
}

function Weapon() {
	this.ATK = 50;
	this.type = TILE.weapon;
}



function GameManager(size, Actuator, EventManager) {
	this.Actuator = new Actuator;
	this.EventManager = new EventManager;
	this.size = size;
	this.player = new Player();
	this.map = new map(this.size);
	this.count = {
		enermy: 0,
		boss: 0,
		heart: 0,
		weapon: 0
	};
	this.EventManager.on('move', this.move.bind(this));
	this.EventManager.on('restart', this.restart.bind(this));
	this.EventManager.on('toggle-fog', this.toggleFog.bind(this));
	this.setup();
}

GameManager.prototype.toggleFog = function() {
	this.Actuator.toggleFog();
};

GameManager.prototype.restart = function() {
	this.player.restart();
	this.map.restart();
	this.Actuator.restart();
	this.EventManager.on("move", this.move.bind(this));
	this.setup();
};

GameManager.prototype.setup = function() {
	var self = this;
	this.over = false;
	this.won = false;
	this.roleRandomize();
	this.Actuator.createBg(this.map.grid, this.player.x, this.player.y);
};

GameManager.prototype.move = function(direction) {
	direction = this.getVector(direction);
	//direction是根据背景移动的方向而不是player前进的方向
	var x = this.player.x + direction.x,
		y = this.player.y + direction.y;
	var msg = '';
	var actuated = false,
		tile = this.map.cellContent(x, y),
		value = tile;

	if (typeof value === 'object')
		value = tile.type;

	if (value === TILE.floor) {
		this.map.removeTile(this.player.x, this.player.y);
		this.player.x = x;
		this.player.y = y;
		this.map.setValue(x, y, this.player);
		actuated = true;
	} else if (value === TILE.heart) {
		this.map.removeTile(this.player.x, this.player.y);
		this.player.x = x;
		this.player.y = y;
		this.player.health += tile.health;
		this.count.heart--;
		this.map.setValue(x, y, this.player);
		actuated = true;

		msg = 'you got ' + tile.health + ' health!';
	} else if (value === TILE.weapon) {
		this.map.removeTile(this.player.x, this.player.y);
		this.player.x = x;
		this.player.y = y;
		this.player.ATK += tile.ATK;
		this.count.weapon--;
		this.map.setValue(x, y, this.player);
		actuated = true;
		msg = 'you got ' + tile.ATK + ' weapon!';
	} else if (value === TILE.enermy || value === TILE.boss) {
		tile.health -= this.player.ATK;
		this.player.health -= tile.ATK;
		if (this.player.health <= 0) {
			actuated = false;
			this.over = true;
			this.player.ATK = 0;
			msg = 'you killed the enermy,but you lost!';
		} else if (tile.health <= 0) {
			actuated = true;
			this.map.removeTile(this.player.x, this.player.y);
			this.player.x = x;
			this.player.y = y;
			if (value === TILE.enermy) {
				this.count.enermy--;
				msg = 'you killed the enermy';
			}
			if (value === TILE.boss) {
				this.count.boss--;
				msg = 'you killed the boss';
			}
			if (this.player.level === 4 && this.count.boss === 0) {
				this.won = true;
				msg = 'you win';
			}

			this.map.setValue(x, y, this.player);

		} else {
			tile.health -= this.player.ATK;
			this.player.health -= tile.ATK;
			msg = 'you lost ' + tile.ATk + 'health';
		}
	} else if (value === TILE.stair) {
		this.player.level++;
		this.Actuator.restart();
		this.map.restart();
		this.roleRandomize();
		this.Actuator.changeLevel({
			grid: this.map.grid,
			player: this.player
		});

	}

	if (actuated || msg)
		this.actuate(actuated, msg);

	if (this.over || this.won) {
		this.EventManager.off("move"); //接除绑定
	}
};

GameManager.prototype.actuate = function(actuated, msg) {
	this.Actuator.actuate({
		over: this.over,
		won: this.won,
		player: this.player,
		actuated: actuated, //是否有移动
		msg: msg
	});
};

GameManager.prototype.roleRandomize = function() {
	var bossNum = 2,
		enermyNum = Math.round(Math.random() * 4 + 4),
		heartNum = Math.round(Math.random() * 3 + 6),
		weaponNum = Math.round(Math.random() * 3 + 5);

	var x, y, i, stairsNum = 1,
		random;

	//player position
	do {
		x = Math.floor(Math.random() * 30) + 10;
		y = Math.floor(Math.random() * 35) + 8;
	} while (this.map.cellContent(x, y) !== TILE.floor);
	this.player.x = x;
	this.player.y = y;
	this.map.setValue(x, y, this.player);

	//boss position
	if (this.player.level === 4) {
		for (i = 0; i < bossNum; i++) {
			random = this.randomize(50);
			x = random[0];
			y = random[1];
			this.count.boss++;
			this.map.setValue(x, y, new Boss());
		}
	}

	//enermy position
	for (i = 0; i < enermyNum; i++) {
		random = this.randomize(50);
		x = random[0];
		y = random[1];
		this.count.enermy++;
		this.map.setValue(x, y, new Enermy());
	}

	//heart position
	for (i = 0; i < heartNum; i++) {
		random = this.randomize(50);
		x = random[0];
		y = random[1];
		this.count.heart++;
		this.map.setValue(x, y, new Health());
	}

	// position
	for (i = 0; i < stairsNum; i++) {
		random = this.randomize(50);
		x = random[0];
		y = random[1];
		this.map.setValue(x, y, TILE.stair);
		//this.entity.stair.push(TILE.stair);
	}
	for (i = 0; i < weaponNum; i++) {
		random = this.randomize(50);
		x = random[0];
		y = random[1];
		this.count.weapon++;
		this.map.setValue(x, y, new Weapon());
	}
};

//随机数生成器
GameManager.prototype.rand = function() {
	var today = new Date();
	var seed = today.getTime();
	seed = (seed * 9301 + 49297) % 233280;
	return seed / (233280.0);
};

GameManager.prototype.randomize = function(value) {
	do {
		x = Math.floor(this.rand() * value);
		y = Math.floor(this.rand() * value);
	} while (this.map.cellContent(x, y) !== TILE.floor);
	return [x, y];
};

GameManager.prototype.getVector = function(direction) {
	//不是player在动，而是背景在动，所以是反方向的
	var map = {
		0: {
			x: 0,
			y: -1
		}, // up
		1: {
			x: 1,
			y: 0
		}, // right
		2: {
			x: 0,
			y: 1
		}, // down
		3: {
			x: -1,
			y: 0
		} // left
	};

	return map[direction];
};

function map(size) {
	this.size = size;
	this.grid = [];
	this.generateGrid();
}
map.prototype.restart = function() {
	this.grid = [];
	this.generateGrid();
};
map.prototype.eachCell = function(callback) {
	for (var i = 0; i < this.size; i++) {
		for (var j = 0; j < this.size; j++) {
			callback(i, j, this.grid[i][j]);
		}
	}
};

map.prototype.cellContent = function(x, y) {
	if (this.withBound(x, y))
		return this.grid[x][y];
	return null;
};

map.prototype.withBound = function(x, y) {
	return !!(x >= 0 && x < this.grid.length && y >= 0 && y < this.grid.length);
};

map.prototype.setValue = function(x, y, tile) {
	this.grid[x][y] = tile;
};

map.prototype.removeTile = function(x, y) {
	this.grid[x][y] = TILE.floor;
};

map.prototype.randomArray = function() {
	for (var x = 0; x < this.size; x++) {
		this.grid.push([]);
		for (var y = 0; y < this.size; y++) {
			var random = x === 0 || y === 0 || x === this.size - 1 || y === this.size - 1 ? TILE.wall : Math.random() < 0.4 ? TILE.wall : TILE.floor;
			this.grid[x].push(random);
		}
	}
};

map.prototype.generateGrid = function() {

	this.randomArray();
	var arr = [],
		i, j, x, y, a;

	for (i = 0; i < this.size; i++) {
		arr[i] = [];
		for (j = 0; j < this.size; j++) {
			arr[i][j] = TILE.wall;
		}
	}
	// 按照 40% 几率初始化数据；Winit(p) = rand(0, 100) < 40%
	// 重复四次：W'(p) = R1(p) >= 5 || R2(p) <= 2
	// 重复三次：W'(p) = R1(p) >= 5
	for (a = 0; a < 4; a++) {
		for (x = 1; x < this.size - 1; x++) {
			for (y = 1; y < this.size - 1; y++) {
				if (this.findFirstNeighbour(x, y) >= 5 || this.findSecondNeighbour(x, y) <= 2)
					arr[x][y] = TILE.wall;
				else
					arr[x][y] = TILE.floor;
			}
		}
	}

	for (a = 0; a < 3; a++) {
		for (x = 1; x < this.size - 1; x++) {
			for (y = 1; y < this.size - 1; y++) {
				if (this.findFirstNeighbour(x, y) >= 5)
					arr[x][y] = TILE.wall;
				else
					arr[x][y] = TILE.floor;
			}
		}
	}

	for (x = 0; x < this.size; x++) {
		for (y = 0; y < this.size; y++) {
			this.grid[x][y] = arr[x][y];
		}
	}
};

map.prototype.findFirstNeighbour = function(x, y) {
	var r1 = 0;
	for (i = -1; i <= 1; i++) {
		for (j = -1; j <= 1; j++) {
			if (this.grid[x + i][y + j] === TILE.wall)
				r1++;
		}
	}
	return r1;
};

map.prototype.findSecondNeighbour = function(x, y) {
	var r2 = 0;
	for (var i = x - 2; i <= x + 2; i++) {
		for (var j = y - 2; j <= x + 2; j++) {
			if (Math.abs(i - x) === 2 && Math.abs(j - y) === 2) //不能是
				continue;
			if (i < 0 || j < 0 || i >= this.size || j >= this.size)
				continue;
			if (this.grid[i][j] === TILE.wall)
				r2++;
		}
	}
	return r2;
};


function Actuator() {
	//迷雾也使用canvas，canvas还是挺强大的
	this.canvas = document.createElement("canvas");
	this.ctx = this.canvas.getContext('2d');
	this.canvas1 = document.getElementById("canvas");
	this.ctx1 = this.canvas1.getContext('2d');
	this.logPanel = $(".log-panel").eq(0);
	this.fog = document.getElementById("fog");
	this.fogCtx = fog.getContext("2d");
	this.health = $("#health");
	this.weapon = $("#weapon");
	this.zone = $("#zone");
	this.level = $("#level");
	this.src = {
		wall: "#887848",
		floor: "#ebc099",
		player: "img/player.png",
		enermy: "#F3F9A7",
		heart: "#CB356B",
		boss: "#141E30",
		weapon: "#0cebeb"
	};
}

Actuator.prototype.restart = function() {
	this.ctx1.clearRect(0, 0, 600, 480);
	this.ctx.clearRect(0, 0, 1600, 1600);
	this.logPanel.html();
	this.fogCtx.clearRect(0, 0, 600, 480);
	this.health.html();
	this.weapon.html();
	this.level.html();
};

Actuator.prototype.changeLevel = function(data) {
	this.ctx1.clearRect(0, 0, 600, 480);
	this.ctx.clearRect(0, 0, 1600, 1600);
	var player = data.player;
	this.createBg(data.grid, player.x, player.y);
	this.health.html(player.health);
	this.weapon.html(player.weapon);
	this.level.html(player.level);
};

Actuator.prototype.createFog = function() {
	this.fog.width = 600;
	this.fog.height = 480;
	//径向渐变
	var gradient = this.fogCtx.createRadialGradient(300, 240, 240, 300, 240, 0);
	gradient.addColorStop(0, "#9e8065");
	gradient.addColorStop(1, "transparent");
	this.fogCtx.fillStyle = gradient;
	this.fogCtx.fillRect(0, 0, 600, 480);
};

Actuator.prototype.toggleFog = function() {
	$(this.fog).toggle();
};


Actuator.prototype.createBg = function(grid, x1, y1) {

	this.canvas.width = 1600;
	this.canvas.height = 1600;
	this.canvas1.width = 600;
	this.canvas1.height = 480;

	//每一個img都的是唯一

	var img;
	for (var i = 0; i < grid.length; i++) {
		for (var j = 0; j < grid.length; j++) {

			if (typeof grid[i][j] === 'object') {
				if (grid[i][j].type === TILE.enermy) {
					this.ctx.fillStyle = this.src.enermy;
					this.ctx.fillRect(i * 32, j * 32, 32, 32);

				} else if (grid[i][j].type === TILE.heart) {
					this.ctx.fillStyle = this.src.heart;
					this.ctx.fillRect(i * 32, j * 32, 32, 32);

				} else if (grid[i][j].type === TILE.boss) {
					this.ctx.fillStyle = this.src.boss;
					this.ctx.fillRect(i * 32, j * 32, 32, 32);

				} else if (grid[i][j].type === TILE.weapon) {
					this.ctx.fillStyle = this.src.weapon;
					this.ctx.fillRect(i * 32, j * 32, 32, 32);

				}

			} else {
				if (grid[i][j] === TILE.wall) {
					this.ctx.fillStyle = this.src.wall;
					this.ctx.fillRect(i * 32, j * 32, 32, 32);
				} else if (grid[i][j] === TILE.floor) {
					this.ctx.fillStyle = this.src.floor;
					this.ctx.fillRect(i * 32, j * 32, 32, 32);
				}
			}


		}
	}

	this.createFog();
	img = document.createElement("img");
	img.style.width = "32px";
	img.style.height = "32px";
	//始终让player居中,x1,y1是player的坐标
	this.ctx1.drawImage(this.canvas, x1 * 32 - 300, y1 * 32 - 240, 600, 480, 0, 0, 600, 480);
	img.src = this.src.player;
	this.ctx1.drawImage(img, 300, 240);
};

Actuator.prototype.actuate = function(data) {


	var x = data.player.x * 32,
		y = data.player.y * 32,
		msg = data.msg;

	var self = this;
	var img = new Image(32, 32);
	if (data.actuated) {
		window.requestAnimationFrame(function() {
			self.ctx.fillStyle = self.src.floor;
			self.ctx.fillRect(data.player.x * 32, data.player.y * 32, 32, 32);
			img.src = self.src.player;
			self.ctx1.clearRect(0, 0, 600, 480);
			self.ctx1.drawImage(self.canvas, x - 300, y - 240, 600, 480, 0, 0, 600, 480);
			self.ctx1.drawImage(img, 300, 240);
		});
	}

	if (data.over || data.won) {
		this.fogCtx.clearRect(0, 0, 600, 480);
		this.fogCtx.fillStyle = "rgba(158, 128, 101, 0.5)";
		this.fogCtx.fillRect(0, 0, 600, 480);
		this.fogCtx.fillStyle = "#000";
		this.fogCtx.font = "80px Georgia";
		if (data.over) {
			this.fogCtx.fillText("sorry, You lost!", 10, 200);
		} else {
			this.fogCtx.fillText("Congraduation! You win!", 10, 200);
		}
		$(this.fog).show();
	}

	if (msg) {
		var date = new Date(),
			hour = this.format(date.getHours()),
			min = this.format(date.getMinutes()),
			sec = this.format(date.getSeconds()),
			time = hour + ':' + min + ":" + sec;

		this.logPanel.prepend('<div>' + '<label>' + msg + '</label>' + '<span>' + time + '</span>' + '</div>');
	}

	this.health.html(data.player.health);
	this.weapon.html(data.player.ATK);
	this.level.html(data.player.level);
};

//时间戳格式化
Actuator.prototype.format = function(value) {
	value = value+'';
	if(value.length===1)
		value = '0' + value;	
	return value;
};

function keyboardManager() {
	this.events = {};

	this.listen();
}

//绑定事件
keyboardManager.prototype.on = function(ev, callback) {
	if (!this.events[ev])
		this.events[ev] = callback;
};

//解除事件绑定
keyboardManager.prototype.off = function(ev) {
	this.events[ev] = null;
};

keyboardManager.prototype.emit = function(event, data) {
	var callback = this.events[event];
	if (callback) {
		callback(data);
	}
};

keyboardManager.prototype.restart = function(ev) {
	ev.preventDefault();
	this.emit("restart");
};

keyboardManager.prototype.listen = function() {
	var self = this;
	var map = {
		38: 0, // Up
		39: 1, // Right
		40: 2, // Down
		37: 3 // Left    
	};

	$(window).keydown(function(ev) {
		var mapped = map[ev.which];
		if (mapped !== undefined) {
			ev.preventDefault();
			self.emit('move', mapped);
		}
	});

	$("#restart").click(function(ev) {
		ev.preventDefault();
		self.emit("restart");
	});

	$('#toggle-bg').click(function(ev) {
		ev.preventDefault();
		self.emit("toggle-fog");
	});
};