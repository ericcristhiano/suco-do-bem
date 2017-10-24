/* ================== HELPERS ===================== */
function c(log) {
    console.log(log);
}

function $(elem) {
    return document.querySelector(elem);
}

function $a(elem) {
    return document.querySelectorAll(elem);
}
/* ================== END HELPERS ===================== */

/* ================== CLASS GAME ===================== */
class Game
{
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.time = 10;
        this.score = 0;
        this.mouseX = null;
        this.mouseY = null;
        this.objects = [];
        this.splashes = [];
        this.timer = null;
        this.finished = false;
        this.slash = new Slash(this);
        this.assets = [
            {type: 'image', url: 'assets/img/juice.png', instance: new Image()},
            {type: 'image', url: 'assets/img/splash.png', instance: new Image()},
            {type: 'audio', url: 'assets/audio/splash.mp3', instance: new Audio()},
            {type: 'image', url: 'assets/img/juice-cut.png', instance: new Image()},
        ];
    }

    startTime() {
        this.timer = setInterval(() => {
            this.time -= 1;

            if (this.time < 1) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        clearInterval(this.timer);
        let premios = JSON.parse(localStorage.getItem('premios'));

        let message = "You didn't win anything.";

        if (this.score == 0) {
            message = 'You won a ' + premios.premio1;
            premios.quantidade1--;
        }

        if (this.score == 1) {
            message = 'You won a ' + premios.premio2;
            premios.quantidade2--;
        }

        if (this.score == 2) {
            message = 'You won a ' + premios.premio3;
            premios.quantidade3--;
        }

        localStorage.setItem('premios', JSON.stringify(premios));
        this.populateConfig();

        this.objects = [new Text(this, message)];
        this.showEndMessage();

        this.checkQuantity();
    }

    checkQuantity() {
        let premios = JSON.parse(localStorage.getItem('premios'));

        if (premios.quantidade1 <= 0 || premios.quantidade2 <= 0 || premios.quantidade3 <= 0) {
            $('.block').classList.remove('hidden');
        } else {
            $('.block').classList.add('hidden');
        }
    }

    showEndMessage() {
        $('.end-message').classList.remove('hidden');
    }

    playSplashSound() {
        this.assets[2].instance.currentTime = 0;
        this.assets[2].instance.play();
    }

    preload() {
        this.assets.forEach(obj => {
            let totalAssets = this.assets.length;
            let assetsLoaded = 0;
            let event = '';

            this.assets.forEach(asset => {
                asset.instance.src = asset.url;

                if (asset.type == 'audio') {
                    event = 'canplay';
                } else {
                    event = 'load'
                }

                asset.instance.addEventListener(event, e => {
                    assetsLoaded++;

                    if (totalAssets == assetsLoaded) {
                        this.startGame();
                    }
                });
            });
        });
    }

    init() {
        this.checkLocalStorage();
        this.populateConfig();
        this.bindHandlers();
        this.checkQuantity();
    }

    checkLocalStorage() {
        if (!localStorage.getItem('premios')) {
            let premiosDefault = {
                    premio1: 'Suco de laranja',
                    quantidade1: 10,
                    premio2: 'Suco de laranja',
                    quantidade2: 10,
                    premio3: 'Suco de laranja',
                    quantidade3: 10,
                };

            localStorage.setItem('premios', JSON.stringify(premiosDefault));
        }
    }

    bindHandlers() {
        $('#start-game').addEventListener('click', e => {
            e.preventDefault();
            this.preload();
        });

        $('#canvas').addEventListener('mousemove', e => {
            this.mouseX = e.clientX - $('#canvas').getBoundingClientRect().left;
            this.mouseY = e.clientY - $('#canvas').getBoundingClientRect().top;
        });

        $('#canvas').addEventListener('mouseout', e => {
            this.mouseX = null;
            this.mouseY = null;
        });

        $('#config').addEventListener('click', e => {
            this.openConfig();
        });

        $('#save').addEventListener('click', e => {
            this.saveConfig();
            this.closeConfig();
        });

        $('.form-login ').addEventListener('submit', e => {
            e.preventDefault();

            if ($('#password').value == 'relatorio@cliente') {
                this.showConfig();
            }
        });

        $('#restart').addEventListener('click', e => {
            e.preventDefault();
            location.reload();
        });
    }

    showConfig() {
        $('.config-form').classList.remove('hidden');
        $('.form-login').classList.add('hidden');
    }

    hideConfig() {
        $('.config-form').classList.add('hidden');
        $('.form-login').classList.remove('hidden');
    }

    saveConfig() {
        let premios = {
            premio1: $('#config-01-nome').value,
            quantidade1: parseInt($('#config-01-quantidade').value),
            premio2: $('#config-02-nome').value,
            quantidade2: parseInt($('#config-02-quantidade').value),
            premio3: $('#config-03-nome').value,
            quantidade3: parseInt($('#config-03-quantidade').value),
        };

        localStorage.setItem('premios', JSON.stringify(premios));
        this.hideConfig();
        this.populateConfig();
        this.checkQuantity();
    }

    openConfig() {
        $('#config-modal').classList.add('active');
    }

    closeConfig() {
        $('#config-modal').classList.remove('active');
    }

    loop() {
        this.animation = requestAnimationFrame(() => {
            this.clearCanvas();
            this.drawSplashes();
            this.updateObjects();
            this.drawObjects();
            this.updateScreenInfo();

            if (this.score >= 3 && !this.finished) {
                this.finished = true;
                this.endGame();
            }

            this.loop();
        });
    }

    updateScreenInfo() {
        $('.score span').innerHTML = this.score;

        $('.time span').innerHTML = this.time;

        if (this.time == 60) {
            $('.time span').innerHTML = '1:00';
        } else {
            if (this.time.toString().length == 2) {
                $('.time span').innerHTML = '0:' + this.time;
            } else {
                $('.time span').innerHTML = '0:0' + this.time;
            }
        }
    }

    hideStartButton() {
        $('#start-game').classList.add('hidden');
    }

    startLoop() {
        this.loop();
    }

    startGame() {
        this.startLoop();

        if (this.objects.length == 0) {
            this.startTime();
            this.throwJuice();
        }

        this.hideStartButton();
    }

    throwJuice() {
        this.objects.push(new Juice(game, this.assets[0].instance));
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawSplashes() {
        this.splashes.forEach(obj => {
            obj.draw();
        });
    }

    drawObjects() {
        this.slash.draw();
        this.objects.forEach(obj => {
            obj.draw();
        });
    }

    updateObjects() {
        this.slash.update();
        this.objects.forEach(obj => {
            obj.update();
        });
    }

    populateConfig() {
        let premios = JSON.parse(localStorage.getItem('premios'));

        $('#config-01-nome').value = premios.premio1;
        $('.premio-1').innerHTML = premios.premio1;
        $('#config-01-quantidade').value = premios.quantidade1;
        $('.quantidade-1').innerHTML = premios.quantidade1;

        $('#config-02-nome').value = premios.premio2;
        $('.premio-2').innerHTML = premios.premio2;
        $('#config-02-quantidade').value = premios.quantidade2;
        $('.quantidade-2').innerHTML = premios.quantidade2;

        $('#config-03-nome').value = premios.premio3;
        $('.premio-3').innerHTML = premios.premio3;
        $('#config-03-quantidade').value = premios.quantidade3;
        $('.quantidade-3').innerHTML = premios.quantidade3;
    }
}
/* ================== END CLASS GAME ===================== */

/* ================== CLASS DRAWABLE ===================== */
class Drawable
{
    constructor(game, img) {
        this.game = game;
        this.img = img;
    }

    draw() {
        this.game.ctx.drawImage(this.img, this.x, this.y, this.img.width, this.img.height);
    }

    update() {

    }
}
/* ================== END CLASS DRAWABLE ===================== */

class Slash{
    constructor(game){
        this.coordenates = [];
        this.ctx = game.ctx;
        this.game= game;
    }
    update(){
        let maxCoordenates = 15;
        let coordenates;
        if(this.game.mouseX == null || this.game.mouseY == null){
            if(this.coordenates.length){
                coordenates = {
                    x: this.coordenates[this.coordenates.length-1].x,
                    y: this.coordenates[this.coordenates.length-1].y
                };
            }else{
                return;
            }
        }else{
            coordenates = {
                x: this.game.mouseX,
                y: this.game.mouseY
            };
        }

        this.coordenates.push(coordenates);
        if(this.coordenates.length > maxCoordenates){
            this.coordenates = this.coordenates.slice(this.coordenates.length-maxCoordenates,this.coordenates.length);
        }
    }
    draw(){
        if(!this.coordenates.length)
            return;

        let x = this.coordenates[0].x;
        let y = this.coordenates[0].y;
        this.ctx.beginPath();
            this.ctx.moveTo(x,y);
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle= "cyan";
            this.ctx.lineCap = "round";
            for (var i = 1; i < this.coordenates.length; i++) {
                let x = this.coordenates[i].x;
                let y = this.coordenates[i].y;
                this.ctx.lineTo(x,y);
            }
            this.ctx.stroke();
        this.ctx.closePath();
    }
}

/* ================== CLASS JUICE ===================== */
class Juice extends Drawable
{
    constructor(game, img) {
        super(game, img);
        this.x = 100;
        this.y = game.canvas.height;
        this.stepX = this.randomNumber(0, 3);
        //this.stepY = 10;
        this.gravity = 0.05;
        this.speed =  this.randomNumber(-80, -90)/10;
        this.img = img;
        this.stepDeg = 1;
        this.deg = 0;
        this.collided = false;
    }

    update() {
        this.speed += this.gravity;
        this.y += this.speed;
        this.x += this.stepX;
        this.deg += this.stepDeg;
        this.checkCollision();

        if (this.y > this.game.canvas.height) {
            if (!this.collided) {
                this.game.score++;
            }

            this.game.objects.splice(this.game.objects.indexOf(this), 1);
            this.game.throwJuice();
        }
    }

    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    draw() {
        this.rotate();
    }

    rotate() {
        let radians = this.deg * Math.PI / 180;
        this.game.ctx.translate(this.x + this.img.width / 2, this.y + this.img.height / 2);
            this.game.ctx.rotate(radians);
                this.game.ctx.drawImage(this.img, -(this.img.width / 2), -(this.img.height / 2), this.img.width, this.img.height);
            this.game.ctx.rotate(-radians);
        this.game.ctx.translate(-(this.x + this.img.width / 2), -(this.y + this.img.height / 2));
    }

    checkCollision() {
        let coord = {
            x1: this.x,
            x2: this.x + this.img.width,
            y1: this.y,
            y2: this.y + this.img.height
        };

        if (!(this.game.mouseX > coord.x2 || this.game.mouseX < coord.x1 || this.game.mouseY > coord.y2 || this.game.mouseY < coord.y1)) {
            if (!this.collided) {
                // this.speed = 0;
                // this.stepX = 0;
                this.game.splashes.push(new Splash(this.game, this.game.assets[1].instance, this.x, this.y));
                this.img = this.game.assets[3].instance;
                this.collided = true;
                this.game.playSplashSound();
            }
        }
    }
}
/* ================== END CLASS JUICE ===================== */

/* ================== CLASS TEXT ===================== */
class Text extends Drawable
{
    constructor(game, text) {
        super(game);
        this.text = text;
        this.y = 0;
    }

    update() {
        this.y += 3;
        if (this.y > (this.game.canvas.height/2) - 50) {
            this.y = (this.game.canvas.height/2) - 50;
        }
    }

    draw() {
        this.game.ctx.font = '26px Arial';
        this.game.ctx.fillText(this.text, (this.game.canvas.width/2) - 200, this.y);
    }
}
/* ================== END CLASS TEXT ===================== */

/* ================== CLASS SPLASH ===================== */
class Splash extends Drawable
{
    constructor(game, img, x, y) {
        super(game, img);
        this.x = x;
        this.y = y;
    }
}
/* ================== END CLASS SPLASH ===================== */

/* ================== START GAME ===================== */
let game = new Game($('#canvas'));
game.init();
/* ================== END START GAME ===================== */