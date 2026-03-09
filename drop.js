const DropState = {
  Falling: "Falling",
  HitCollider: "HitCollider",
  Disappearing: "Disappearing",
  ShouldRemove: "ShouldRemove",
};

class Drop {
  static MAX_VELOCITY = 40;
  static INITIAL_WIDTH = 4;
  GRAVITY = 0.4;
  COLOR = color(250, 0, 64);
  POINT_AMOUNT = 2;
  points = [];
  state = DropState.Falling;
  colliderHit = null;

  constructor(position_x, position_y, velocity_x, velocity_y, width, countryName) {
    this.position = createVector(position_x, position_y);
    this.points.push(this.position.copy());
    this.velocity = createVector(velocity_x, velocity_y);
    this.width = width;
    this.countryName = countryName;
  }

  update(colliders) {
    let oldPosition = this.position.copy();

    // Update position
    let acceleration = createVector(0, this.GRAVITY);
    this.velocity.add(acceleration);
    this.velocity.limit(this.MAX_VELOCITY);
    this.position.add(this.velocity);

    if (this.state == DropState.Falling) {
      // Check colliders
      for (let collider of colliders) {
        let intersection = this.getIntersection(oldPosition, this.position, collider.p1, collider.p2);
        if (intersection) {
          this.position = intersection;
          this.state = DropState.HitCollider;
          this.colliderHit = collider;
          break;
        }
      }

      // Check if the drop hit the ground
      if (this.position.y > height) {
        this.position.y = height;
        this.state = DropState.HitCollider;
      }
    }

    // Add new point to the trail
    if (this.state === DropState.Falling || this.state === DropState.HitCollider) {
      this.points.push(this.position.copy());
    }
    // Remove oldest point
    if (this.points.length > this.POINT_AMOUNT || this.state === DropState.Disappearing) {
      this.points.shift();
    }
    // Mark for deletion
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
      t *= 0.9; // Move the hit point slightly back to prevent the splash going through the collider
      return createVector(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
    }
    return null;
  }

  isMouseOver() {
    let padding = 5;
    let threshold = this.width / 2 + padding;

    // Check if the distance from the mouse to a line segment is small enough
    for (let i = 1; i < this.points.length; i++) {
      let a = this.points[i - 1];
      let b = this.points[i];
      
      if (this.distToSegment(a, b) < threshold) return true;
    }
    return false;
  }

  distToSegment(a, b) {
    let a_to_b = b.copy().sub(a);
    let a_to_mouse = createVector(mouseX - a.x, mouseY - a.y);
    let t = constrain(a_to_mouse.dot(a_to_b) / a_to_b.magSq(), 0, 1); // High dot product means the mouse is in the same direction as the line segment --> t = 1 --> closest to b
    let closestPoint = createVector(a.x + t * a_to_b.x, a.y + t * a_to_b.y);
    return dist(mouseX, mouseY, closestPoint.x, closestPoint.y);
  }
}
