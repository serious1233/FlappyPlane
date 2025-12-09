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

    // 只在初始化時設置一次計時器
    towerInterval = setInterval(placeTowers, 1500);

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
            // 等待音效播放完成
            gameOverSound.onended = function() {
                soundPlaying = false;
            };
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
                // 等待音效播放完成
                gameOverSound.onended = function() {
                    soundPlaying = false;
                };
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
    let openingSpace = board.height/5; // 空隙寬度128px
    
    // 上方大樓Y位置範圍：讓通道有高低變化
    // 通道頂部應該在 100px 到 400px 之間
    let minGapTop = 100;
    let maxGapTop = 400;
    let gapTop = minGapTop + Math.random() * (maxGapTop - minGapTop);
    
    // 上方大樓底部對齊通道頂部
    let topTowerY = gapTop - towerHight;
    
    // 下方大樓頂部對齊通道底部
    let bottomTowerY = gapTop + openingSpace;

    let topTower = {
        img : TopTowerimg,
        x : towerX,
        y : topTowerY,
        width : towerWidth,
        height : towerHight,
        passed : false
    }

    towerArray.push(topTower);

    let bottomTower = {
        img : BottomTowerimg,
        x : towerX,
        y : bottomTowerY,
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
        velocityY = 0; // 重置飛機速度
        towerArray = [];
        score = 0;
        gameOver = false;
        gameStarted = false;
        return; // 重置後不執行其他操作
    }
    
    // 開始遊戲
    if (!gameStarted) {
        gameStarted = true;
    }
    
    // move plane up (只在遊戲進行中才能飛)
    if (!gameOver) {
        velocityY = -6;
    }
}

function detectCollision(a, b) {
    // 增加更大的容錯空間，只檢測實際圖片內容部分
    // 飛機圖片周圍有透明區域，需要更大的邊距
    let marginX = 25; // 左右容錯值（增加）
    let marginY = 15; // 上下容錯值（增加）
    return a.x + marginX < b.x + b.width - marginX &&
           a.x + a.width - marginX > b.x + marginX &&
           a.y + marginY < b.y + b.height - marginY &&
           a.y + a.height - marginY > b.y + marginY;
}
