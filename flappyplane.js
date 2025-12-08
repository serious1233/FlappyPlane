//board
let board;
let boardWidth = 400;
let boardHeight = 640;
let context;


//plane
let planeWidth = 100; 
let planeHeight = 30;
let planeX = boardWidth/8;
let planeY = boardHeight/2;
let planeimg;

let plane = {
    x: planeX,
    y: planeY,
    width: planeWidth,
    height: planeHeight
}


// towers
let towerArray = [];
let towerWidth = 80;
let towerHight = 400; 
let towerX = boardWidth;
let towerY = 0;

let TopTowerimg;
let BottomTowerimg;

// physics
let velocityX = -2;// tower moving left
let velocityY = 0; // plane moving up/down
let gravity = 0.2;

let gameOver = false;
let score = 0;
let gameStarted = false; // 遊戲是否已開始
let gameOverSound; // 遊戲結束音效
let soundPlaying = false; // 音效是否正在播放
let towerInterval = null; // 大樓生成計時器


window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");// used for drawing on the board

    //draw plane
    // context.fillStyle = "green";
    // context.fillRect(plane.x, plane.y, plane.width, plane.height);

    // load plane image
    planeimg = new Image();
    planeimg.src = "./flappyplane.png";
    planeimg.onload = function() {
        context.drawImage(planeimg, plane.x, plane.y, plane.width, plane.height);
    }

    TopTowerimg = new Image();
    TopTowerimg.src = "./top_tower.png";

    BottomTowerimg = new Image();
    BottomTowerimg.src = "./bottom_tower.png";

    // 載入遊戲結束音效
    gameOverSound = new Audio();
    gameOverSound.src = "./Voicy_Allahu Akbar!!!!!!!.mp3";

    this.requestAnimationFrame(update);
    document.addEventListener("keydown", movePlane);
    // 新增觸控支援 - 直接監聽 board
    board.addEventListener("touchstart", function(e) {
        e.preventDefault();
        handleInput();
    }, { passive: false });
    board.addEventListener("mousedown", function(e) {
        e.preventDefault();
        handleInput();
    });
    // 也監聽整個文件
    document.addEventListener("touchstart", function(e) {
        e.preventDefault();
        handleInput();
    }, { passive: false });
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height); // clear board

    //redraw plane
    if (gameStarted) {
        velocityY += gravity;
        // plane.y += velocityY;
        plane.y = Math.max(plane.y + velocityY, 0);// prevent plane from going above board
    }
    context.drawImage(planeimg, plane.x, plane.y, plane.width, plane.height);

    if (plane.y > board.height) {
        if (!gameOver) {
            gameOverSound.currentTime = 0;
            gameOverSound.play();
            soundPlaying = true;
            setTimeout(() => {
                gameOverSound.pause();
                soundPlaying = false;
            }, 1200);
        }
        gameOver = true;
    }

    // 顯示開始提示
    if (!gameStarted) {
        context.fillStyle = "white";
        context.font = "30px sans-serif";
        context.fillText("按空白鍵開始", 80, 320);
    }

    // draw towers
    for (let i = 0; i < towerArray.length; i++) {
        let tower = towerArray[i];
        tower.x += velocityX; // move tower to left
        context.drawImage(tower.img, tower.x, tower.y, tower.width, tower.height);

        if (!tower.passed && tower.x + tower.width < plane.x) {
            score+=0.5;
            tower.passed = true;
        }

        if (detectCollision(plane, tower)) {
            if (!gameOver) {
                gameOverSound.currentTime = 0;
                gameOverSound.play();
                soundPlaying = true;
                setTimeout(() => {
                    gameOverSound.pause();
                    soundPlaying = false;
                }, 1500);
            }
            gameOver = true;
        }

        // remove towers that are out of board
        while (towerArray.length > 0 && towerArray[0].x < - towerWidth) {
            towerArray.shift();
        }
    }
    // score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 20, 50);

    if (gameOver) {
        context.fillText("Game Over", 5, 90);
    }
}

function placeTowers() {
    if (gameOver || !gameStarted) {
        return;
    }
    //(0-1) * towerHight/2
    // 0 -> -128 (towerHight/4)
    // 1 -> -384 (3*towerHight/4)
    let randomTowerY = towerY - towerHight/4 - Math.random() * (towerHight/2);
    let openingSpace = board.height/4;

    let topTower = {
        img : TopTowerimg,
        x : towerX,
        y : randomTowerY,
        width : towerWidth,
        height : towerHight,
        passed : false
    }

    towerArray.push(topTower);

    let bottomTower = {
        img : BottomTowerimg,
        x : towerX,
        y : randomTowerY + towerHight + openingSpace,
        width : towerWidth,
        height : towerHight,
        passed : false
    }
    towerArray.push(bottomTower);

}

function movePlane(e) {
    if (e.code == "ArrowUp" || e.code == "Space" || e.code == "KeyW") {
        handleInput();
    }
}

function handleInput() {
    // reset game (只有在音效播放完成後才允許重新開始)
    if (gameOver && !soundPlaying) {
        plane.y = planeY;
        towerArray = [];
        score = 0;
        gameOver = false;
        gameStarted = false;
        // 清除舊的計時器
        if (towerInterval) {
            clearInterval(towerInterval);
            towerInterval = null;
        }
        return; // 重置後不執行其他操作
    }
    
    // 開始遊戲（只在第一次按鍵時設置計時器）
    if (!gameStarted) {
        gameStarted = true;
        // 確保沒有重複的計時器
        if (towerInterval) {
            clearInterval(towerInterval);
        }
        towerInterval = setInterval(placeTowers, 1500); // 每 1.5 秒生成大樓
    }
    
    // move plane up (只在遊戲進行中才能飛)
    if (!gameOver) {
        velocityY = -6;
    }
}

function detectCollision(a, b) {
    // 增加容錯空間，只檢測實際的飛機主體部分
    let marginX = 15; // 左右容錯值
    let marginY = 10; // 上下容錯值
    return a.x + marginX < b.x + b.width &&
           a.x + a.width - marginX > b.x &&
           a.y + marginY < b.y + b.height &&
           a.y + a.height - marginY > b.y;
}
