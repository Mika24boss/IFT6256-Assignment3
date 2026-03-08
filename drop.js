const DropState = {
  Falling: "Falling",
  HitSurface: "HitSurface",
  Disappearing: "Disappearing",
  ShouldRemove: "ShouldRemove",
};

class Drop {
  static MAX_VELOCITY = 40;
  static INITIAL_WIDTH = 4;
  COLOR = color(246, 0, 63);
  POINT_AMOUNT = 2;
  points = [];
  state = DropState.Falling;
  collisionSurface = null;

  constructor(position_x, position_y, velocity_x, velocity_y, width) {
    this.position = createVector(position_x, position_y);
    this.points.push(this.position.copy());
    this.velocity = createVector(velocity_x, velocity_y);
    this.width = width;
  }

  update(surfaces) {
    let oldPosition = this.position.copy();

    // Update position
    let acceleration = createVector(0, 0.4);
    this.velocity.add(acceleration);
    this.velocity.limit(this.MAX_VELOCITY);
    this.position.add(this.velocity);

    if (this.state == DropState.Falling) {
      
      // Check surfaces
      for (let surface of surfaces) {
        let hit = this.getIntersection(oldPosition, this.position, surface.p1, surface.p2);
        if (hit) {
          this.position = hit;
          this.state = DropState.HitSurface;
          this.collisionSurface = surface;
          break;
        }
      }

      // Check if the drop hit the ground
      if (this.position.y > height) {
        this.position.y = height;
        this.state = DropState.HitSurface;
      }
    }


    // Update points
    if (this.state === DropState.Falling || this.state === DropState.HitSurface) {
      this.points.push(this.position.copy());
    }
    if (this.points.length > this.POINT_AMOUNT || this.state === DropState.Disappearing) {
      this.points.shift();
    }

    if (this.points.length === 0) {
      this.state = DropState.ShouldRemove;
    }
  }

  draw() {
    push();
    let previousPosition = this.points[0];
    for (let i = 1; i < this.points.length; i++) {
      let current_position = this.points[i];
      stroke(this.COLOR);
      strokeWeight(this.width);
      line(previousPosition.x, previousPosition.y, current_position.x, current_position.y);
      previousPosition = current_position;
    }
    pop();
  }

  getIntersection(p1, p2, p3, p4) {
    // https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
    const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (denominator == 0) return null; // Parallel lines

    let t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      t *= 0.9; // Move the hit point slightly back to prevent the splash going through the surface
      return createVector(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
    }
    return null;
  }
}
