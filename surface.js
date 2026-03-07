class Surface {
  constructor(x1, y1, x2, y2) {
    this.p1 = createVector(x1, y1);
    this.p2 = createVector(x2, y2);
  }

  draw() {
    stroke(40, 100, 30);
    strokeWeight(10);
    line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
  }

  getNormalVector() {
    let v = createVector(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    v.rotate(-HALF_PI); 
    v.normalize();
    return v;
  }
}