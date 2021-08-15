const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");

let accessToken = ""
let id = ""

const serverIP = "5.45.97.92"

const socket = new WebSocket("ws://"+serverIP+":8081/sync")

socket.onopen = () => {
    console.log("open!")
    //socket.send("hey!")
}
socket.onmessage = (msg) => {
    if (typeof msg.data === "object") return
    console.log(msg.data)
    const event = JSON.parse(msg.data)
    if (event.type === "position") {
        clear()
        event.boats.forEach(boat => draw(boat))
    }
}

// Drawing
function draw(boat) {
    var boatImage = new Image()
    boatImage.src = 'boat.png'

    //console.log(x + " " + y)
    ctx.beginPath()
    ctx.arc(boat.position.x, boat.position.y, 10, 0, 2 * Math.PI)
    ctx.fillStyle = 'red'
    if (boat.id == id) {
        drawRotatedImage(boatImage, boat.position.x, boat.position.y, Math.acos(boat.direction.y/Math.sqrt(boat.direction.x*boat.direction.x+boat.direction.y*boat.direction.y)), boat)
    }
    ctx.fill()
    ctx.stroke()

    // direction
    ctx.beginPath()
    ctx.moveTo(boat.position.x, boat.position.y)
    ctx.lineTo(boat.position.x + boat.direction.x * 10, boat.position.y + boat.direction.y * 10)
    ctx.stroke()

    // sail
    ctx.beginPath()
    //ctx.strokeStyle = "cyan"
    ctx.moveTo(boat.position.x, boat.position.y)
    let ccw = false
    if (boat.sailPosition < 0) ccw = true
    ctx.arc(boat.position.x, boat.position.y, 15, Math.atan(boat.direction.y/boat.direction.x) - Math.PI, boat.sailPosition * Math.PI + (Math.atan(boat.direction.y/boat.direction.x) - Math.PI), ccw)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.stroke()
}

function drawRotatedImage(image, x, y, angle, boat) { 
    ctx.save(); 
    ctx.translate(x, y);
    if(boat.direction.x < 0) {
        ctx.rotate(angle)
    } else {
        ctx.rotate(0-angle)
    }
    ctx.drawImage(image, -(image.width/2), -(image.height/2));
    ctx.restore(); 
}

function clear() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = document.getElementById("map")
    ctx.drawImage(img, 0, 0)
}

// Buttons
document.getElementById("steer-left").onclick = event => {
    socket.send(JSON.stringify({
        "type": "steer",
        "deflection": -0.2
    }))
}
document.getElementById("steer-straight").onclick = event => {
    socket.send(JSON.stringify({
        "type": "steer",
        "deflection": 0.0
    }))
}
document.getElementById("steer-right").onclick = event => {
    socket.send(JSON.stringify({
        "type": "steer",
        "deflection": 0.2
    }))
}

document.getElementById("join").onclick = event => {
    const http = new XMLHttpRequest()
    http.open("PUT", "http://"+serverIP+":8081/join", true)
    http.onreadystatechange = function () {
        if (this.readyState !== XMLHttpRequest.DONE) return
        console.log(this)
        const response = JSON.parse(this.response)
        accessToken = response.accessToken
        id = response.id
        document.getElementById("at").innerText = accessToken

        // auth websocket
        socket.send(JSON.stringify({
            "type": "auth",
            "accessToken": accessToken
        }))
    }
    http.send()
}

document.getElementById("start").onclick = event => {
    const http = new XMLHttpRequest()
    http.open("POST", "http://"+serverIP+":8081/start", true)
    http.send()
}

document.getElementById("sail").oninput = event => {
    //console.log(event.target.value)
    socket.send(JSON.stringify({
        "type": "sailPosition",
        "position": event.target.value / 100
    }))
}

