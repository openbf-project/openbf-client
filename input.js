class Input {
    constructor (doc) {
        this.mouse = {
            buttons:{ //Object, incase weird things.
                
            },
            lastx:false,
            x:false,
            lasty:false,
            y:false,
            dragListCallbacks:[],
            dragListVectors:false,
            pressure:0.5,
            movementX:0,
            movementY:0
        };
        this.keys = {};
        doc.addEventListener("mouseup", (evt)=>{
            this.mouse.movementX = evt.movementX;
            this.mouse.movementY = evt.movementY;
            this.onMouseUp(
                evt.clientX,
                evt.clientY,
                evt.button
            );
        });
        doc.addEventListener("mousedown", (evt)=>{
            this.mouse.movementX = evt.movementX;
            this.mouse.movementY = evt.movementY;
            this.onMouseDown(
                evt.clientX,
                evt.clientY,
                evt.button
            );
        });
        doc.addEventListener("mousemove", (evt)=>{
            this.mouse.movementX = evt.movementX;
            this.mouse.movementY = evt.movementY;
            this.onMouseMove(evt.clientX, evt.clientY, evt.mozPressure);
        });
        doc.addEventListener("keydown", (evt)=>{
            this.keys[evt.key] = true;
        });
        doc.addEventListener("keyup", (evt)=>{
            this.keys[evt.key] = false;
        });
    }
    isMousePressed(button=0) {
        return (this.mouse.buttons[button] === true);
    }
    setMousePressed(button, pressed=true) {
        this.mouse.buttons[button] = pressed;
    }
    setMousePosX(x) {
        this.mouse.lastx = this.mouse.x;
        this.mouse.x = x;
    }
    setMousePosY(y) {
        this.mouse.lasty = this.mouse.y;
        this.mouse.y = y;
    }
    setMousePos(x, y) {
        this.setMousePosX(x);
        this.setMousePosY(y);
    }
    //callbacks for special actions
    on(type, callback) {
        switch (type) {
            case "draglist": //Get all the point data after a mouse drag
            this.mouse.dragListCallbacks.push(callback);
            break;
            default:
            console.log("I don't know what to do with type", type);
            break;
        }
    }
    remove(type, callback) {
        switch (type){
            case "draglist":
            for (let i=0; i<this.mouse.dragListCallbacks.length; i++) {
                if (this.mouse.dragListCallbacks[i] === callback) {
                    return this.mouse.dragListCallbacks.splice(i, 1);
                }
            }
            break;
            default:
            console.warn("unhandled listener type", type, "in input.remove");
            break;
        }
        return false;
    }
    isKeyPressed (keyCode) {
        return this.keys[keyCode];
    }
    //====Internal functions, use with care!
    //Appends mouse drag data to the list
    appendMouseDragListVector(x, y) {
        if (!this.mouse.dragListVectors) {
            this.mouse.dragListVectors = [];
        }
        this.mouse.dragListVectors.push(x, y);
    }
    //Called per mouse up
    onMouseUp (x, y, button) {
        this.setMousePressed(button, false);
        this.setMousePos(x, y);
        this.appendMouseDragListVector(x, y);
        this.finishMouseDragListVectors();
    }
    //Fires drag list callbacks, cleans up data
    finishMouseDragListVectors () {
        if (this.mouse.dragListVectors) {
            for (let i=0; i<this.mouse.dragListCallbacks.length; i++) {
                this.mouse.dragListCallbacks[i].call(this, this.mouse.dragListVectors);
            }
            this.mouse.dragListVectors = false;
        }
    }
    //Called per mouse initial down action
    onMouseDown(x, y, button) {
        this.setMousePressed(button);
        this.setMousePos(x, y);
        this.appendMouseDragListVector(x, y);
    }
    //Called when mouse is detected moving
    onMouseMove(x, y, pressure) {
        this.setMousePos(x, y);
        this.setMousePressure(pressure);
        if (this.isMousePressed()) {
            this.appendMouseDragListVector(x, y);
        }
    }

    setMousePressure (pressure) {
        this.mouse.pressure = pressure;
    }
    //End internal functions
}

module.exports = Input;

/*
//Example usage:
//Create the input, hook it to the document (contextual input! yay!)
let m_In = new Input(document);

//Listen for mouse drag data, getting the drag points on mouse up
m_In.on("draglist", (vectorList)=>{ //list is alternating x and y indices
    let str = "";
    for (let i=0; i<vectorList.length; i+=2) {
        str += vectorList[i] + ", " + vectorList[i+1] + "\n";
    }
    console.log("Got mouse drag with data", str);
});

//A constant loop, usually used on render instead
setInterval(()=>{
    if (m_In.isMousePressed()) { //Optionally supply a integer argument for given button
        console.log("While mouse down");
    }
    if (m_In.isKeyPressed("w")) {
        console.log("While w down");
    }
}, 1000/20);
*/