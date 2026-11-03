export function buildTailPath(
  bx: number, by: number, bw: number,
  tailCx: number, TAIL_HALF: number,
  spkCx: number, tailY: number, tailTipY: number,
): string {
  const R = 14;
  const _hx = spkCx - (tailCx + TAIL_HALF);
  const _hy = tailTipY - tailY;
  const _hl = Math.hypot(_hx, _hy) || 1;
  const _lx = spkCx - (tailCx - TAIL_HALF);
  const _ly = tailTipY - tailY;
  const _ll = Math.hypot(_lx, _ly) || 1;
  const _r = Math.max(2, Math.min(10, TAIL_HALF * 0.55, _hl * 0.45, _ll * 0.45));
  const _rRx = (tailCx + TAIL_HALF) + _r;
  const _rTx = (tailCx + TAIL_HALF) + _r * (_hx / _hl);
  const _rTy = tailY + _r * (_hy / _hl);
  const _lLx = (tailCx - TAIL_HALF) - _r;
  const _lTx = (tailCx - TAIL_HALF) + _r * (_lx / _ll);
  const _lTy = tailY + _r * (_ly / _ll);
  return `M ${bx + R},${by} L ${bx + bw - R},${by} A ${R},${R} 0 0 1 ${bx + bw},${by + R} L ${bx + bw},${tailY - R} A ${R},${R} 0 0 1 ${bx + bw - R},${tailY} L ${_rRx},${tailY} Q ${tailCx + TAIL_HALF},${tailY} ${_rTx},${_rTy} L ${spkCx},${tailTipY} L ${_lTx},${_lTy} Q ${tailCx - TAIL_HALF},${tailY} ${_lLx},${tailY} L ${bx + R},${tailY} A ${R},${R} 0 0 1 ${bx},${tailY - R} L ${bx},${by + R} A ${R},${R} 0 0 1 ${bx + R},${by} Z`;
}
