/** Simple expression parser: numbers, parentheses, unary minus, +, -, *, /, %, ^. No eval. */
export function calculate(expression: string): number {
  if (expression.length > 200) throw Error('Expression too long');
  const clean = expression.replace(/\s+/g, '');
  const pattern = /\d+(?:\.\d+)?|\.\d+|[()+\-*/%^]/g;
  const tokens = clean.match(pattern) || [];
  if (tokens.join('') !== clean) throw Error('Invalid characters');
  let pos = 0;
  const peek = () => tokens[pos];
  function atom(): number {
    if (peek() === '+') {
      pos++;
      return atom();
    }
    if (peek() === '-') {
      pos++;
      return -atom();
    }
    if (peek() === '(') {
      pos++;
      const v = expr();
      if (peek() !== ')') throw Error('Missing closing parenthesis');
      pos++;
      return v;
    }
    const t = tokens[pos++];
    if (!t || Number.isNaN(Number(t)) || (!/^\d/.test(t) && !/^\.\d/.test(t)))
      throw Error('Expected a number');
    return Number(t);
  }
  function pow(): number {
    let v = atom();
    if (peek() === '^') {
      pos++;
      v = Math.pow(v, pow());
    }
    return v;
  }
  function mul(): number {
    let v = pow();
    while (['*', '/', '%'].includes(peek())) {
      const op = tokens[pos++],
        b = pow();
      v = op === '*' ? v * b : op === '/' ? v / b : v % b;
    }
    return v;
  }
  function expr(): number {
    let v = mul();
    while (['+', '-'].includes(peek())) {
      const op = tokens[pos++],
        b = mul();
      v = op === '+' ? v + b : v - b;
    }
    return v;
  }
  const answer = expr();
  if (pos !== tokens.length || !Number.isFinite(answer))
    throw Error('Invalid expression or division by zero');
  return answer;
}
