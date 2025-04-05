<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chaos Pendulum</title>
  <script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js"></script>
</head>
<body>
  <script>
  /*
   * Chaos Pendulum – p5.js
   * A self-contained demo of a perpetual chaotic double pendulum.
   * Paste this into an .html file and open in your browser.
   */
  let r1 = 125; // length of first arm
  let r2 = 125; // length of second arm
  let m1 = 10;  // mass of first pendulum
  let m2 = 10;  // mass of second pendulum
  let a1, a2;   // angles
  let a1_v = 0; // angular velocity
  let a2_v = 0;

  let g = 1; // gravity

  function setup() {
    createCanvas(600, 600);
    pixelDensity(1);
    a1 = PI / 2;
    a2 = PI / 2;
    background(255);
  }

  function draw() {
    // Translate origin to center
    translate(width / 2, height / 2);
    background(255, 255, 255, 20); // trails

    // Physics from Lagrange equations
    let num1 = -g * (2 * m1 + m2) * sin(a1);
    let num2 = -m2 * g * sin(a1 - 2 * a2);
    let num3 = -2 * sin(a1 - a2) * m2;
    let num4 = a2_v * a2_v * r2 + a1_v * a1_v * r1 * cos(a1 - a2);
    let den = r1 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
    let a1_a = (num1 + num2 + num3 * num4) / den;

    num1 = 2 * sin(a1 - a2);
    num2 = (a1_v * a1_v * r1 * (m1 + m2));
    num3 = g * (m1 + m2) * cos(a1);
    num4 = a2_v * a2_v * r2 * m2 * cos(a1 - a2);
    den = r2 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
    let a2_a = (num1 * (num2 + num3 + num4)) / den;

    // Update velocities and angles
    a1_v += a1_a;
    a2_v += a2_a;
    a1 += a1_v;
    a2 += a2_v;

    // Convert to cartesian
    let x1 = r1 * sin(a1);
    let y1 = r1 * cos(a1);
    let x2 = x1 + r2 * sin(a2);
    let y2 = y1 + r2 * cos(a2);

    // Draw
    stroke(0);
    strokeWeight(2);
    fill(0);
    line(0, 0, x1, y1);
    ellipse(x1, y1, m1, m1);
    line(x1, y1, x2, y2);
    ellipse(x2, y2, m2, m2);
  }
  </script>
</body>
</html>
