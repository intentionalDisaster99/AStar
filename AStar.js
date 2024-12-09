
// For now we will just be using each pixel as a node
let node_distance = 5;

// Now I can have all of my obstacles in the same array :D
let walls = []; // Walls is faster to type

// The directions to make it easier to step right and left
let dir;

// The path that was found last
let path = [];

// The target
let end;

// This is so that I don't have to do a bunch of square roots
const DIAGONAL_COST = Math.SQRT2;


// My lists (out here so I can visualize them)
let open, closed;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0, 0);


    // Populating the walls
    walls.push(new CircleObstacle(createVector(0, 100), 100));
    walls.push(new CircleObstacle(createVector(0, -100), 100));
    walls.push(new RectObstacle(createVector(195, -200), 10, 400));
    walls.push(new RectObstacle(createVector(-205, -200), 10, 400));

    // populating the directions (can't call createVector before setup)
    dir = [
        createVector(1 * node_distance, 0 * node_distance),
        createVector(1 * node_distance, 1 * node_distance),
        createVector(0 * node_distance, 1 * node_distance),
        createVector(-1 * node_distance, 1 * node_distance),
        createVector(-1 * node_distance, 0 * node_distance),
        createVector(-1 * node_distance, -1 * node_distance),
        createVector(0 * node_distance, -1 * node_distance),
        createVector(1 * node_distance, -1 * node_distance),
    ]

    // Picking the end
    end = createVector(120, 100);

    // Setting up the lists
    open = new Q();
    closed = [];

}

function draw() {

    background(0);
    translate(width / 2, height / 2);

    // Drawing the goal
    fill(255, 255, 0);
    noStroke();
    circle(end.x, end.y, node_distance * 2);

    // Drawing the obstacles
    fill(255);
    for (let i = 0; i < walls.length; i++) {
        walls[i].draw();
    }

    // Visualize open and closed lists
    noStroke();
    fill(255, 0, 0, 150);
    open.list.forEach(node => circle(node.pos.x, node.pos.y, node_distance / 2));
    fill(0, 0, 255, 150);
    closed.forEach(node => circle(node.pos.x, node.pos.y, node_distance / 2));

    // Draw the path
    noFill();
    stroke(0, 255, 0);
    beginShape();
    path.forEach(p => vertex(p.x, p.y));
    endShape();



}

function mousePressed() {
    path = a_star(createVector(mouseX - width / 2, mouseY - height / 2), end);


    if (path.length == 0) {
        console.log("No path could be found.");
        return;
    }

}


// My AStar function
// Returns a bunch of vectors representing the path
function a_star(start, end) {

    // These are the ones I can explore next
    open = new Q();

    // Creating the node that we are playing with 
    let working_node = new Node(start, null, 0, p5.Vector.dist(start, end));
    open.add(working_node);

    // The closed are all of the ones I have already looked at
    closed = [];

    while (p5.Vector.dist(working_node.pos, end) > node_distance * 2) {

        // Exploring the node we have
        explore(open, closed, working_node, end);

        // Checking to see if we made it to end
        if (p5.Vector.dist(working_node.pos, end) < node_distance * 2) {
            break;
        }

        // If open is closed, then that means there isn't
        if (open.list.length === 0) {
            return [];
        }

        // Picking a new working node
        working_node = open.decapitate();
    }

    // Now we can trace back through it to make our output
    let output = [];

    while (working_node.last != null) {

        output.push(createVector(working_node.pos.x, working_node.pos.y));
        working_node = working_node.last;

    }

    return output.reverse();

}

// A function to get the available nodes around the start
function explore(open, closed, working_node, end) {
    // Trying all of the directions
    for (let i = 0; i < dir.length; i++) {

        // Moving in the direction
        let new_pos = p5.Vector.add(working_node.pos, dir[i]);

        // A flag to see whether or not we need to skip this one
        let skip = false;

        // Making sure it isn't already in the open list
        for (let j = 0; j < open.list.length; j++) {
            if (open.list[j].pos.x == new_pos.x && open.list[j].pos.y == new_pos.y) {
                // Adjusting the cost if this one is lower
                if (open.list[j].cost > working_node.cost + ((dir[i].x !== 0 && dir[i].y !== 0 ? DIAGONAL_COST : 1))) {

                    // Removing it from the open list
                    let node = open.list.splice(j, 1)[0];

                    // Rebuilding the node
                    open.add(new Node(node.pos.copy(), working_node, working_node.cost + ((dir[i].x !== 0 && dir[i].y !== 0 ? DIAGONAL_COST : 1)), node.heuristic));

                }
                skip = true;
                break;
            }
        }

        // Not doing it if they go outside the bound
        if (skip || new_pos.x < -width / 2 || new_pos.y < -height / 2 || new_pos.x > width / 2 || new_pos.y > height / 2) {
            continue;
        }

        // ! We need to change this to a map to make it faster
        // Check if it's in the closed list (if we already explored it)
        for (let j = 0; j < closed.length; j++) {
            if (closed[j].pos.x == new_pos.x && closed[j].pos.y == new_pos.y) {

                // Calculating this node's possible cost
                let new_cost = working_node.cost + ((dir[i].x !== 0 && dir[i].y !== 0 ? DIAGONAL_COST : 1));

                // If we found it, check if the new cost is lower
                if (closed[j].cost > new_cost) {
                    // Updating the node
                    closed[j].cost = new_cost;
                    closed[j].last = working_node;
                    closed[j].score = closed[j].cost + closed[j].heuristic;

                    open.list.unshift(closed.splice(j, 1)[0]);
                }
                skip = true;
                break;
            }
        }

        // Skipping early to save some time
        if (skip) { continue; }

        // Not allowing it if it is inside one of the walls
        for (let i = 0; i < walls.length; i++) {
            if (walls[i].is_inside(createVector(new_pos.x, new_pos.y))) {
                skip = true;
                break;
            }
        }
        if (skip) { continue; }

        // If we got this far, then we need to add a new node the open list
        open.add(new Node(new_pos, working_node, (working_node.cost + ((dir[i].x !== 0 && dir[i].y !== 0 ? DIAGONAL_COST : 1))), p5.Vector.dist(new_pos, end)));

    }

    // Moving the working node to the closed list 
    closed.push(working_node)

}


// These are my nodes that I can use to trace backwards
class Node {

    constructor(pos, last, cost, heuristic) {
        this.pos = pos;
        this.last = last;
        this.cost = cost;
        this.heuristic = heuristic;
        this.score = this.cost + this.heuristic;
    }

}



// Obstacles that it has to go around
class Obstacle {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Just some functions that the subclasses will need
    is_inside(point) {

        // This will only be if they are the exact same point
        if (point.x == this.x && point.y == this.y) {
            return true;
        }
        return false;
    }

    // A function to draw it on the canvas
    draw() {

        // Drawing a point at the center because there isn't else much to draw
        point(this.x, this.y);

    }

}

// The actual classes that we will use
class CircleObstacle extends Obstacle {

    constructor(center, radius) {
        super(center.x, center.y);
        this.radius = radius;
    }

    is_inside(point) {
        if (p5.Vector.dist(point, createVector(this.x, this.y)) < this.radius) {
            return true;
        }
        return false;
    }

    draw() {
        noStroke();
        circle(this.x, this.y, this.radius * 2);
    }

}

// The actual classes that we will use
class RectObstacle extends Obstacle {

    constructor(topLeft, width, height) {
        super(topLeft.x, topLeft.y);
        this.width = width;
        this.height = height;
    }

    is_inside(point) {
        if (point.x > this.x && point.y > this.y && point.x < this.x + this.width && point.y < this.y + this.height) {
            return true;
        }
        return false;
    }

    draw() {
        noStroke();
        rect(this.x, this.y, this.width, this.height);
    }

}

// This takes ages, so I am going to make a little priority queue so that I don't have to continually sort the open list
// Heh Q
class Q {


    constructor() {
        // Not really any inputs 
        this.list = [];
    }

    // Adds something in the right place
    add(newNode) {

        // If the length is zero, just add it to the beginning
        if (this.list.length == 0) {
            this.list.push(newNode);
        }

        // Binary search :D
        let index = binary_search(this.list, newNode.score);
        this.list.splice(index, 0, newNode);

        // Returning self
        return this;

    }

    // A method to get the top node
    decapitate() {
        return this.list.shift();
    }

}

// Binary search to find the correct index
function binary_search(list, score) {
    let low = 0, high = list.length;
    while (low < high) {
        let mid = Math.floor((low + high) / 2);
        if (list[mid].score < score) low = mid + 1;
        else high = mid;
    }
    return low;
}


