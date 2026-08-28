function rayHit(shooter, targetPos, point, eyeH = 0) {
  const sx = shooter.x, sy = shooter.y + eyeH, sz = shooter.z;
  let ex = point.x - sx, ey = point.y - sy, ez = point.z - sz;
  const len = Math.hypot(ex, ey, ez) || 1;
  ex /= len; ey /= len; ez /= len;
  const segLen = Math.min(100, len);
  const hit = (px, py, pz, radius) => {
    const t = (px * ex + py * ey + pz * ez) / segLen;
    if (t < 0 || t > 1 + 0.02) return null;
    const qx = ex * segLen * t - px, qy = ey * segLen * t - py, qz = ez * segLen * t - pz;
    const d = Math.hypot(qx, qy, qz);
    return d <= radius ? d : null;
  };
  const cx = targetPos.x, cy = targetPos.y, cz = targetPos.z;
  const dHead = hit(cx - sx, cy - 0.3 - sy, cz - sz, 0.26);
  const dBody = hit(cx - sx, cy - 0.75 - sy, cz - sz, 0.42)
    ?? hit(cx - sx, cy - 1.05 - sy, cz - sz, 0.45)
    ?? hit(cx - sx, cy - 1.35 - sy, cz - sz, 0.4)
    ?? hit(cx - sx, cy - 1.7 - sy, cz - sz, 0.33)
    ?? hit(cx - sx, cy - 2.05 - sy, cz - sz, 0.3)
    ?? hit(cx - sx, cy - 2.35 - sy, cz - sz, 0.26);
  if (dHead === null && dBody === null) return null;
  return dHead !== null ? 'HEAD' : 'BODY';
}
// Real convention: reported y = the EYE (~2.4 above the floor). Shooter and
// target both stand on the same floor; shooter eye = shooter.y.
const shooter = { x: 0, y: 2.4, z: 0 };
const T = { x: 10, y: 2.49, z: 0 };   // target: reported y 2.49 (the eye)
const aim = (ry) => ({ x: 10, y: ry, z: 0 });
const cases = [
  // user's ACTUAL shot data from the live session:
  ['real chest hit ray (y=1.84)', aim(1.84), 'BODY'],
  ['real chest hit ray (y=1.73)', aim(1.73), 'BODY'],
  ['real leg-miss ray (y=1.19)', aim(1.19), 'BODY'],
  ['real leg-miss ray (y=1.09)', aim(1.09), 'BODY'],
  ['real leg-miss ray (y=0.98)', aim(0.98), 'BODY'],
  ['real leg-miss ray (y=0.89)', aim(0.89), 'BODY'],
  ['real leg-miss ray (y=0.80)', aim(0.80), 'BODY'],
  ['real leg-miss ray (y=0.77)', aim(0.77), 'BODY'],
  ['real leg-miss ray (y=0.67)', aim(0.67), 'BODY'],
  // head/limits:
  ['head (y=2.2)', aim(2.2), 'HEAD'],
  ['above head (y=2.6)', aim(2.6), null],
  ['ankle at floor (y=0.0)', aim(0.0), 'BODY'],
  ['deep below feet (y=-0.5)', aim(-0.5), null],
  ['side 0.5m @chest (y=1.74)', { x: 10, y: 1.74, z: 0.5 }, null],
  ['side 0.35m @chest (y=1.74)', { x: 10, y: 1.74, z: 0.35 }, 'BODY'],
];
let fail = 0;
for (const [name, point, want] of cases) {
  const got = rayHit(shooter, T, point);
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? 'OK ' : 'FAIL'} ${name}: got ${got} want ${want}`);
}
console.log(fail === 0 ? 'ALL PASS' : fail + ' FAILURES');
process.exit(fail === 0 ? 0 : 1);
