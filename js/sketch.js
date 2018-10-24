let serial;
let portName = "/dev/cu.usbmodem141101";
let ipAddr = "10.17.99.119";

let prevValues = [];
let values = [];

let img;
let headsTotal = 10;
let heads = [];
let headIndex = 0;
let particles = [];

let xMin, xMax, yMin, yMax;

let xWind, yWind;
let windMax = 5;

let fMag = 0.4;

let escape = false;
let escapeAttempt = 0;
let escapeX, escapeY;
let escapeTime = 0;
let escapeDuration = 3000;
let escapeMin = 5;

let lastEscape = 0;
let escapeCooldown = 2000;

let s = 2.0;

let debug = true;
let xSound, ySound;
let eSound;
let eSoundPlayed = false;

let eSoundStart = 0;
let eSoundDuration = 1500;

function preload(){
    img = loadImage("assets/img/hand.png");
    for(let i = 0; i < headsTotal; i++){
        heads[i] = loadImage("assets/img/" + i + ".png");
    }

    xSound = loadSound("assets/audio/1.wav");
    ySound = loadSound("assets/audio/2.wav");

    eSound = loadSound("assets/audio/0.wav");
}

function setup(){
    serial = new p5.SerialPort(ipAddr);

    serial.on('list', printList);
    serial.on('connected', serverConnected);
    serial.on('open', portOpen);
    serial.on('data', serialEvent);
    serial.on('error', serialError);
    serial.on('close', portClose);

    serial.open(portName);

    createCanvas(windowWidth, windowHeight);

    xMin = - width / 2;
    xMax = width / 2;
    yMin = - height / 2;
    yMax = height / 2;


    initParticles();

    xSound.loop();
    ySound.loop();
    eSound.loop();
    eSound.rate(2.0);
    eSound.setVolume(0);
}

function draw(){
    background(0, 30);

    applyWind();

    if(escape && millis() - escapeTime > escapeDuration){
        //eSound.stop(0.1);
        eSoundPlayed = false;
        eSound.setVolume(0);

        // xSound.loop();
        // ySound.loop();

        particles = [];
        initParticles();
        windX = windY = 0;
        escapeAttempt = 0;
        escape = false;
    }

    if(xWind * xWind < 0.01){
        xWind = 0;
    }else{
        //xWind -= -0.1
        xWind = lerp(xWind, 0, 0.05);
    }

    if(yWind * yWind < 0.01){
        yWind = 0;
    }else{
        yWind = lerp(yWind, 0, 0.05);
    }


    push();
    noStroke();
    translate(width / 2, height / 2);
    scale(s);
    // let transX, transY;
    // if(s > 1){
    //     transX = map(s, 1.0, 1.5, 0, -width / 6);
    //     transY = map(s, 1.0, 1.5, 0, -height / 6);
    // }else{
    //     transX = map(s, 0.5, 1.0, width / 2, 0);
    //     transY = map(s, 0.5, 1.0, height / 2, 0);
    // }

    push();
    for(let i = 0; i < particles.length; i++){
        let p = particles[i];

        p.applyForce(createVector(xWind, yWind));

        p.checkBoundaries();
        p.applyAttraction();

        let friction = p5.Vector.mult(p.vel, -1);
        friction.normalize();
        friction.mult(fMag);
        friction.limit(p.vel.mag());
        p.applyForce(friction);

        p.update();
        p.display();
    }
    pop();

    for(let i = particles.length - 1; i >= 0; i--){
        let p = particles[i];
        if(p.isDead){
            particles.splice(i, 1);
        }
    }

    // noFill();
    // stroke(255);
    // rect(xMin, yMin, xMax - xMin, yMax - yMin);
    //
    // if(frameCount % 180 == 0 && escapeAttempt > 0){
    //     escapeAttempt--;
    // }
    pop();

    let scaledWidth = width  / s;
    let scaledHeight = height / s;

    xMin = -scaledWidth / 2;
    xMax = scaledWidth / 2;
    yMin = -scaledHeight / 2;
    yMax = scaledHeight / 2;

    if(debug){
        fill(255);
        text("xWind: " + xWind, width - 100, 50);
        text("xPos: " + values[0], width - 100, 70);

        text("yWind: " + yWind, width - 100, 90);
        text("zPos: " + values[2], width - 100, 110);

        text("scale: " + s, width - 100, 130);
        text("yPos: " + values[1], width - 100, 150);

        text("attempt: " + escapeAttempt, width - 100, 170);
    }


    if(!escape){
        let xVol = map(abs(xWind), 0, windMax, 0, 1);
        xSound.setVolume(xVol);

        let yVol = map(abs(yWind), 0, windMax, 0, 1);
        ySound.setVolume(yVol);
    }else{
        xSound.setVolume(0);
        ySound.setVolume(0);

        if(!eSoundPlayed){
            eSound.jump(0);
            eSound.setVolume(1.0);
            eSoundStart = millis();
            eSoundPlayed = true;
        }else{
            if(millis() - eSoundStart > eSoundDuration){
                eSound.setVolume(0);
            }
        }
    }

}

function mousePressed(){

    // escapeX = map(xWind, -windMax, windMax, -width / 2, width / 2);
    // escapeY = map(yWind, -windMax, windMax, -height / 2, height / 2);
    // escape = true;
    // escapeTime = millis();
    // console.log("escape: " + escapeX + ", " + escapeY);

    xWind = map(mouseX, -width / 2, width / 2, -windMax, windMax);
    yWind = map(mouseY, -height / 2, height / 2, -windMax, windMax);


    if(xWind * xWind > (windMax - 1) * (windMax - 1) || yWind * yWind > (windMax - 1) * (windMax - 1)){


        if(millis() - lastEscape > escapeCooldown){
            escapeAttempt++;

            console.log(escapeAttempt);

            lastEscape = millis();
        }

        if(escapeAttempt > escapeMin){
            escapeX = mouseX;
            escapeY = mouseY;
            escape = true;
            escapeTime = millis();
            console.log("escape!");
        }
    }


}

function applyWind(){
    if(prevValues[0] !=  values[0]){
        let xPos = constrain(values[0], -100, 100);
        xWind = map(xPos, -100, 100, -windMax, windMax);
    }
    if(prevValues[1] != values[1]){
        let yPos = constrain(values[1], -200, 200);
        let newS = map(yPos, -200, 200, 1.5, 2.5);
        s = lerp(s, newS, 0.05);

       // yWind = map(values[1], -270, 270, -windMax, windMax);
    }
    if(prevValues[2] != values[2]){
        // let newS = map(270 - values[2], -135, 135, 0.5, 1.5);
        // s = lerp(s, newS, 0.05);

        let zPos = constrain(values[2], 0, 230);
         yWind = map(230 - zPos, 0, 230, 0, windMax);

         if(values[1] > 0){
             yWind *= -1;
         }

         //console.log(yWind);
    }

     if(!escape && xWind * xWind > (windMax - 1) * (windMax - 1) || yWind * yWind > (windMax - 1) * (windMax - 1)){
   // if(yWind < -windMax + 1 && !escape){
        if(millis() - lastEscape > escapeCooldown){

            escapeAttempt++;

            console.log(escapeAttempt);

            lastEscape = millis();
        }

        if(escapeAttempt > escapeMin){
            escapeX = map(xWind, -windMax, windMax, -width / 2, width / 2);
            escapeY = map(yWind, -windMax, windMax, -height / 2, height / 2);
            escape = true;
            escapeTime = millis();
            console.log("escape: " + escapeX + ", " + escapeY);
        }
    }
}

function printList(ports){
    console.log(ports);
}

function serverConnected() {
    console.log('connected to server.');
}

function portOpen() {
    console.log('the serial port opened.')
}

function serialEvent() {
    let dataIn = serial.readLine();
    //console.log(dataIn);

    if(dataIn != ""){
        prevValues = values;
        values = float(dataIn.split(","));
        //console.log(values);
    }
}

function serialError(err) {
    console.log('Something went wrong with the serial port. ' + err);
}

function portClose() {
    console.log('The serial port closed.');
}

function initParticles(){


    // headIndex++;
    // if(headIndex > headsTotal - 1){
    //     headIndex = 0;
    // }

    headIndex = int(random(headsTotal));

    console.log(headIndex);

    img = heads[headIndex];

    img.loadPixels();

    //12 increment for mobile
    for(let y = 0; y < img.height; y += 12){
        for(let x = 0; x < img.width; x += 12){
            let i = (y * img.width + x) * 4;

            let r = img.pixels[i];
            let g = img.pixels[i + 1];
            let b = img.pixels[i + 2];
            let a = int(random(50, 200));

            if(r > 0 && g > 0 && b > 0){
                let mappedX = map(x, 0, img.width, - img.width / 2, img.width / 2);
                let mappedY = map(y, 0, img.height, - img.height / 2, img.height / 2);
                particles.push(new Particle(mappedX, mappedY, r, g, b, a));
                //particles.push(new Particle(mappedX + width / 2, mappedY + height / 2, r, g, b, a));
            }

        }
    }
    //


 //   // if(xMin < -width / 2){
 //        xMin = -width / 2;
 //    //}
 //   // if(xMax > width / 2){
 //        xMax = width / 2;
 //   // }
 //  //  if(yMin < -height / 2){
 //        yMin = -height / 2;
 //  //  }
 //  //  if(yMax > height / 2){
 //        yMax = height / 2;
 // //   }

    // xMin = width / 2 - height / 2;
    // xMax = width / 2 + height / 2;
    // yMin = height / 2 - img.height / 2 - 100;
    // yMax = height / 2 + img.height / 2 + 100;
    //
    // imgWidth = height;

    xWind = 0;
    yWind = 0;
}

class Particle{

    constructor(x, y, r, g, b, a){
        this.initPos = createVector(x, y);
        this.pos = createVector(x, y);
        this.vel = createVector(random(0.01, 0.05), random(0.01, 0.05));
        this.acc = createVector(0, 0);
        this.aSpeed = random(0.01, 0.05);

        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.currentA = 0;
        this.dia = int(random(10, 16));

        this.offset = random(1, 5);

        this.isDead = false;
    }

    applyForce(f){
        f.div(this.dia * 0.5);
        this.acc.add(f);
    }

    applyAttraction(){
        let f;
        if(!escape){
            f = p5.Vector.sub(this.initPos, this.pos);
        }else{
            f = p5.Vector.sub(createVector(escapeX, escapeY), this.pos);
        }
        f.normalize().mult(1.2);
        this.acc.add(f);
    }

    update(){
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    display(){
        push();
        translate(this.pos.x, this.pos.y);
        //rotate(frameCount * this.aSpeed);

        if(this.currentA < this.a){
            this.currentA += 2;
        }

        fill(this.r, this.g, this.b, this.currentA);
        ellipse(this.offset, 0, this.dia, this.dia);
        noFill();
        pop();
    }

    checkBoundaries(){

        if(!escape){
            if(this.pos.x < xMin){
                this.pos.x = xMin;
                this.vel.x *= -1;
            }else if(this.pos.x > xMax){
                this.pos.x = xMax;
                this.vel.x *= -1;
            }

            if(this.pos.y < yMin){
                this.pos.y = yMin;
                this.vel.y *= -1;
            }else if(this.pos.y > yMax){
                this.pos.y = yMax;
                this.vel.y *= -1;
            }
        }else{
            if(this.pos.x > xMax || this.pos.x < xMin|| this.pos.y > yMax || this.pos.y < yMin){
                this.isDead = true;
            }
        }

    }

}