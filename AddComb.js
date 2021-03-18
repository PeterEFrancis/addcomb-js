

//     _        _      _   ____                   _         _
//    / \    __| |  __| | / ___| ___   _ __ ___  | |__     (_) ___
//   / _ \  / _` | / _` || |    / _ \ | '_ ` _ \ | '_ \    | |/ __|
//  / ___ \| (_| || (_| || |___| (_) || | | | | || |_) |_  | |\__ \
// /_/   \_\\__,_| \__,_| \____|\___/ |_| |_| |_||_.__/(_)_/ ||___/
//                                                       |__/



"use strict";



// constants

const BIT_SIZE = 31;
const B = 2 ** BIT_SIZE - 1;


// errors

function unimplemented() {
  throw new Error('This has not been implemented yet.')
}

function unreachable() {
  throw new Error('This should not have been reachable.')
}

function stop() {
  throw new Error('This was intentional.')
}

function bad_bounds() {
  throw new Error("supplied bounds are not possible");
}






// bit helpers

function bin(int) {
  // just for testing -- never used
  if (int > 2**31 - 1) {
    throw new Error('int too large');
  }
  return (int >>> 0).toString(2).padStart(32,0).substring(1);
}

function num_ones(n) {
  // count number of ones in bit representation
    let i = 0;
    do {
      if (n & 1) {
        ++i;
      }
    } while (n >>= 1);
    return i;
}

function trailing_zeros(n) {
  // count number of leading zeros in bit representation.
  // ex: 8 = ...001000 -> 3
  for (let i = 0; i < BIT_SIZE; i++) {
    if (n & (1 << i)) {
      return i;
    }
  }
  return BIT_SIZE;
}

function leading_zeros(n) {
  // count number of leading zeros in bit representation.
  // ex: 2**27 = 00001000000000000000000000000000 -> 4
  let i = BIT_SIZE - 1;
  while (!(2**i & n) && i >= 0) {
    i--;
  }
  return BIT_SIZE - 1 - i;
}

function cycle(num, i, m) {
  // cycle the first m rightmost bits of num by i to the left
  let ret = num;
  // console.log("1.       ret: " + bin(ret));
  let wrapped = B << (m - i); // mask bits that will get wrapped
  // console.log("2.   wrapped: " + bin(wrapped));
  wrapped &= ret;
  // console.log("3.   wrapped: " + bin(wrapped));
  wrapped >>= m - i;
  // console.log("4.   wrapped: " + bin(wrapped));
  ret <<= i;
  // console.log("5.       ret: " + bin(ret));
  ret |= wrapped;
  // console.log("6.       ret: " + bin(ret));
  ret &= ~(B << m);
  // console.log("7. ~(B << m): " + bin(~(B << m)))
  // console.log("8.       ret: " + bin(ret));
  return ret;
}

function cycle_rev(num, i, m) {
  // cycle the first m rightmost bits of num by i to the right
  return cycle(num, m - i, m);
}







// other helpers

function range(m,n) {
  let r = [];
  for (let i = m; i < n; i++) {
    r.push(i);
  }
  return r;
}

function zeros(m) {
  let z = [];
  for (let i = 0; i < m; i++) {
    z.push(0);
  }
  return z;
}

function fill(fill, l) {
  let v = [];
  for (let i = 0; i < l; i++) {
    v.push(fill);
  }
  return v;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function sum(arr) {
  return arr.reduce((a,b)=>a+b);
}

function in_interval(val, interval) {
  // check if val is in the closed interval
  return val >= interval[0] && val <= interval[1];
}

function arraysEqual(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
}

function fold(reducer, init, xs) {
  let acc = init;
  for (let x of xs) {
    acc = reducer(acc, x);
  }
  return acc;
}






// iter tools

function *iter_range(m,n) {
  for (let i = m; i < n; i++) {
    yield i;
  }
  return null;
}

function *combinations_with_replacement(n, r) {

  let indices = zeros(r);

  yield zeros(r);

  while (true) {
    let found = false;
    for (var i = r - 1; i >= 0; i--) {
      if (indices[i] != n - 1) {
        found = true;
        break;
      }
    }
    if (!found) {
      return null;
    }
    indices = [...indices.slice(0,i), ...fill(indices[i] + 1, r - i)];
    yield indices;
  }

}

function *combinations(iter, r, process_func) {
  let process = process_func || function(x) {return x;};
  let pool = [...iter];
  let n = pool.length;
  if (r > n) {
    return null;
  }
  let indices = [...range(0,r)];
  yield process(indices.map(x => pool[x]));
  while (true) {
    let found = false;
    for (var i = r - 1; i >= 0; i--) {
      if (indices[i] != i + n - r) {
        found = true;
        break;
      }
    }
    if (!found) {
      return null;
    }
    indices[i] += 1;
    for (let j = i + 1; j < r; j++) {
      indices[j] = indices[j-1] + 1;
    }
    yield process(indices.map(x => pool[x]));
  }
}

function *each_element(curr, G, zero) {
  if (zero) {
    yield zeros(G.length);
  }

  while (true) {
    let index = 0;
    while (curr[index] == G[index] - 1) {
      curr[index] = 0;
      index++;
      if (index == curr.length) {
        return null;
      }
    }
    curr[index] += 1;
    yield clone(curr);
  }

}

function *sign_combinations(pattern) {
  // pattern is a list of integers or other == comparable objects that are not "undefined"
  let repeated = []; // list of how many times the elements are repeated (ex: pattern=[1, 2, 2, 4, 4, 5]  => repeated=[1, 2, 2, 1])
  let num = 1;
  for (let i = 1; i < pattern.length + 1; i++) {
    if (pattern[i] != pattern[i - 1]) {
      repeated.push(num);
      num = 1;
    } else {
      num++;
    }
  }

  let sign_comb = fill(1, repeated.length);
  for (let i = 0; i < Math.pow(2, repeated.length); i++) {

    // build repeated combination using sign_comb and repeated
    let ret = [];
    for (let i = 0; i < repeated.length; i++) {
      ret.push(...fill(sign_comb[i], repeated[i]));
    }
    yield ret;

    // move sign comb down one in grey code order
    for (let j = 0; j < sign_comb.length; j++) {
      if (sign_comb[j] == 1) {
        sign_comb[j] = -1;
        break;
      } else {
        sign_comb[j] = 1;
      }
    }
  }

  return null;
}

class EachSetExact {
  constructor(state, setmask, doneflag) {
    this.state = state;
    this.setmask = setmask;
    this.doneflag = doneflag;
  }
  next() {
    // Find the greatest number which can be moved to the left
    let can_be_moved_left = this.state & ~(this.state >> 1) & ~(this.setmask >> 1);
    let first_moveable = BIT_SIZE - leading_zeros(can_be_moved_left);
    if (first_moveable == 0) {
        this.doneflag = true;
        return new FastSet(this.state);
    }
    let update_region = ~((1 << (first_moveable - 1)) - 1) & ~this.setmask;
    let to_fill_left = num_ones(this.state & update_region) - 1;

    let old = this.state;
    // Clear the updated region
    this.state &= ~update_region;
    let newregion = ((1 << (to_fill_left + 1)) - 1) << first_moveable;
    this.state |= newregion;

    return new FastSet(old);
  }
  next_zero() {
    let ret = this.next();
    ret.contents <<= 1;
    ret.contents |= 1;
    return ret;
  }
  next_no_zero() {
    let ret = this.next();
    ret.contents <<= 1;
    return ret;
  }
  *iterable(type) {
    while (!this.doneflag) {
      yield this[type]();
    }
    return null;
  }
}










// math functions

function D(n) {
  return range(1,n+1).filter(i => n % i == 0);
}

function d(n) {
  return D(n).length;
}

function choose(n, m) {
  if (m == 0 || n == 0) {
    return 1;
  } if (m > n) {
    return 0;
  } else {
    return n * choose(n - 1, m - 1) / m;
  }
}

function a(j,k) {
  if (j == 0 || k == 0) {
    return 1;
  }
  return sum(range(0,Math.min(j,k) + 1).map(i => choose(j,i) * choose(k,i) * 2**i));
}

function c(j, k) {
  if (j == 0 && k >= 0) {
    return 1;
  }
  if (j >= 1 && k == 0) {
    return 0;
  }
  return sum(range(1,Math.min(j,k) + 1).map(i => choose(j-1,i-1) * choose(k,i) * 2**i));
  // starting at i = 1, since if i==0, choose(j-1,i-1)==0
}

function factorial(x) {
  var f = 1;
  for (let i = 2; i <= x; i++) {
    f *= i;
  }
  return f;
}

function gcd(a,b) {
  // thanks Euclid ;)
  let x = a;
  let y = b;
  while (y != 0) {
    let t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function gcd_arr(arr) {
  let g = arr[0];
  let i = 1;
  while (i < arr.length && g > 1) {
    g = gcd(g, arr[i++]);
  }
  return g;
}

function rel_prime(arr) {
  if (arr.length == 1) {
    return true;
  } else if (arr.length == 2) {
    return gcd(...arr) == 1;
  } else {
    if (rel_prime(arr.slice(1))) {
      for (let i = 1; i < arr.length; i++) {
        if (gcd(arr[0], arr[i]) != 1) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }
}

function mod_add(a, b, G) {
  if (G.length == 1) {
    return (a + b + G[0]) % G[0];
  }
  return a.map((x, i) => (x + b[i] + G[i]) % G[i]);
}

function neg_elem(a, G) {
  if (G.length == 1) {
    return G[0] - a;
  }
  return a.map((x,i) => G[i] - x);
}







// sides

function v(g, n, h) {
  return Math.max(...D(n).map(d => (Math.floor((d - 1 - gcd(d,g)) / h) + 1) * (n / d)));
}

function v_signed(n, h) {
  return Math.max(...D(n).map(d => (2 * Math.floor((d - 2) / (2 * h)) + 1) * (n / d)));
}

function u(n, m, h) {
  return Math.min(...D(n).map(d => (h * Math.ceil(m / d) - h + 1) * d));
}

function f(d, m, h) {
  // page 84
  return (h * Math.ceil(m / d) - h + 1) * d;
}

function delta(d, n, m, h) {
  let r = h % d || d;
  let k = m % d || d;
  if (r < k) {
    return (k - r) * r - (d - 1);
  } else if (k < r && r < d) {
    return (d - r) * (r - k) - (d - 1);
  } else if (k == r && r == d) {
    return d - 1;
  } else {
    return 0;
  }
}

function f_restricted(d, n, m, h) {
  let r = h % d || d;
  let k = m % d || d;
  if (h <= Math.min(k, d - 1)) {
    return Math.min(n, f(d,m,h), h * m - h**2 + 1);
  } else {
    return Math.min(n, h * m - h**2 + 1 - delta(d,n,m,h));
  }
}

function u_restricted(n, m, h) {
  return Math.min(...D(n).map(d => f_restricted(d,n,m,h)));
}











// classes and associated func

class VerboseWriter {
  constructor(DOMElement) {
    this.element = DOMElement;
  }

  c_write(s) {
    this.write(">>> " + s);
  }

  r_write(s) {
    this.write("    " + s);
  }

  ae_write(s) {
    this.write("... = " + s);
  }

  al_write(s) {
    this.write("... ≤ " + s);
  }

  ag_write(s) {
    this.write("... ≥ " + s);
  }

  write(s) {
    try {
      this.element.innerHTML += s + "\n";
    } catch {}
    try {
      console.log(s);
    } catch {}
  }

  static disp_opt_string(restricted, signed) {
    return (restricted ? '^' : '') + (signed ? '\u00b1' : '');
  }

}




class FastSet {
  // for use in cyclcic groups of size at most 31
  constructor(contents) {
    this.contents = contents || 0;
  }

  // STATIC
  static singleton(i) {
    // create fastset with one element i
    var fs = new FastSet();
    fs.add(i);
    return fs;
  }
  static empty_set() {
    // create and return an empty fastSet
    return new FastSet();
  }

  // STRUCTURAL METHODS
  has(i) {
    // check containment
    return (this.contents & (1 << i)) > 0;
  }
  add(i) {
    // add i to the set
    this.contents |= 1 << i;
  }
  delete(i) {
    // delete i from the set (if it is there)
    this.contents &= ~(1 << i);
  }
  add_all(iter) {
    for (let el of iter) {
      this.add(el);
    }
  }
  is_full(n) {
    // Tests if the set is full up to (and including) n
    // return (~(this.contents & ((1 << (n + 1)) - 1)) << (BIT_SIZE - n)) == 0;
    return this.size() == n;
  }
  size() {
    return num_ones(this.contents);
  }
  is_empty() {
    return this.contents == 0;
  }
  intersect(other) {
    this.contents &= other.contents;
  }
  clone() {
    return new FastSet(this.contents);
  }
  zero_free() {
    return !this.has(0);
  }


  // displays
  as_vec() {
    var ret = [];
    let c1 = this.contents;
    var p = 0;
    while (c1 != 0) {
      if (c1 & 1) {
        ret.push(p);
      }
      c1 >>= 1;
      p += 1;
    }
    return ret;
}
  to_string() {
    return '{' + this.as_vec().toString() + '}';
  }


  // SUMSETS
  hfold_sumset(h, n) {
    if (h == 0) {
      return FastSet.singleton(0);
    }
    let res = 0;
    let prev = 1;
    for (let i = 0; i < h; i++) {
      let c1 = this.contents;
      while (c1 != 0) {
        let shift = trailing_zeros(c1);
        let cycled = cycle(prev, shift, n);
        res |= cycled;
        c1 &= c1 - 1;
      }
      prev = res;
      res = 0;
    }
    return new FastSet(prev);
  }
  hfold_restricted_sumset(h, n) {
    if (h > this.size()) {
      return FastSet.empty_set();
    }
    if (h == 0) {
      return FastSet.singleton(0);
    }
    return new FastSet(FastSet.hfrs(this.contents, 1, h, n, FastSet.empty_set(), n + 1));
  }
  static hfrs(stat, curr, h, n, restrictions, ceiling) {
    // A "1" in restrictions[i] means i has already been added
    if (h == 0) {
      return curr;
    }
    let total = 0;
    let toadd = stat;
    while (toadd != 0) {
      let shift = trailing_zeros(toadd);
      if (shift > ceiling) {
        break;
      }

      if (!restrictions.has(shift)) {
        let cycled = cycle(curr, shift, n);
        let newrestr = restrictions.clone();
        newrestr.add(shift);

        let rec_call = FastSet.hfrs(stat, cycled, h - 1, n, newrestr, shift);
        total |= rec_call;
      }

      toadd &= toadd - 1;
    }
    return total;
  }
  hfold_signed_sumset(h, n) {
    if (h == 0) {
      return FastSet.singleton(0);
    }
    return new FastSet(FastSet.hfss(this.contents, 1, h, n, FastSet.empty_set(), FastSet.empty_set(), n + 1))
  }
  static hfss(stat, curr, h, n, prestrictions, nrestrictions, ceiling)  {
    if (h == 0) {
      return curr;
    }
    let total = 0;
    let toadd = stat;
    while (toadd != 0) {
      let shift = trailing_zeros(toadd);
      if (shift > ceiling) {
        break;
      }
      if (!prestrictions.has(shift)) {
        let cycled = cycle(curr, shift, n);
        let newnrestr = nrestrictions.clone();
        newnrestr.add(shift);

        let rec_call = FastSet.hfss(stat, cycled, h - 1, n, prestrictions.clone(), newnrestr, shift);
        total |= rec_call;
      }
      if (!nrestrictions.has(shift)) {
          let cycled = cycle_rev(curr, shift, n);
          let newprestr = prestrictions.clone();
          newprestr.add(shift);

          let rec_call = FastSet.hfss(stat, cycled, h - 1, n, newprestr, nrestrictions.clone(), shift);
          total |= rec_call;
      }
      toadd &= toadd - 1;
    }
    return total;
  }
  hfold_restricted_signed_sumset(h, n) {
    if (h > this.size()) {
      return FastSet.empty_set();
    }
    if (h == 0) {
      return FastSet.singleton(0);
    }
    return new FastSet(FastSet.hfrss(this.contents, 1, h, n, FastSet.empty_set(), n + 1));
  }
  static hfrss(stat, curr, h, n, restrictions, ceiling) {
    // A "1" in restrictions[i] means i has already been added
    if (h == 0) {
      return curr;
    }
    let total = 0;
    let toadd = stat;
    while (toadd != 0) {
      let shift = trailing_zeros(toadd);
      if (shift > ceiling ){
          break;
      }
      if (!restrictions.has(shift)) {
        let cycled = cycle(curr, shift, n);
        let newrestr = restrictions.clone();
        newrestr.add(shift);

        let rec_call = FastSet.hfrss(stat, cycled, h - 1, n, newrestr, shift);
        total |= rec_call;

        // Also choose -cycled
        cycled = cycle_rev(curr, shift, n);
        newrestr = restrictions.clone();
        newrestr.add(shift);

        rec_call = FastSet.hfrss(stat, cycled, h - 1, n, newrestr, shift);
        total |= rec_call;
      }

      toadd &= toadd - 1;
    }
    return total;
  }

  hfold_interval_sumset(hs, n) {
    let [h1, h2] = hs;
    let final_res = 0;
    let res = 0;
    let prev = 1;
    for (let i = 0; i <= h2; i++) {
      if (in_interval(i, [h1, h2])) {
        final_res |= prev;
      }
      let c1 = this.contents;
      while (c1 != 0) {
        let shift = trailing_zeros(c1);
        let cycled = cycle(prev, shift, n);
        res |= cycled;
        c1 &= c1 - 1;
      }
      prev = res;
      res = 0;
    }
    return new FastSet(final_res);
  }
  hfold_interval_restricted_sumset(hs, n) {
    return new FastSet(FastSet.hfirs(this.contents, 1, hs[1], hs, n, FastSet.empty_set(), n + 1));
  }
  static hfirs(stat, curr, h, hs, n, restrictions, ceiling)  {
    // A "1" in restrictions[i] means i has already been added
    if (h == 0) {
      return curr;
    }
    let total = 0;
    if (in_interval(hs[1] - h, hs)) {
      total = curr;
    }
    let toadd = stat;
    while (toadd != 0) {
      let shift = trailing_zeros(toadd);
      if (shift > ceiling) {
          break;
      }

      if (!restrictions.has(shift)) {
        let cycled = cycle(curr, shift, n);
        let newrestr = restrictions.clone();
        newrestr.add(shift);

        let rec_call = FastSet.hfirs(stat, cycled, h - 1, hs, n, newrestr, shift);
        total |= rec_call;
        // Check if total is full
        if ((~(total & ((1 << (n + 1)) - 1)) << (BIT_SIZE - n)) == 0) {
          return total;
        }
      }
      toadd &= toadd - 1;
    }
    return total;
  }
  hfold_interval_signed_sumset(hs, n) {
    return new FastSet(FastSet.hfiss(this.contents, 1, hs[1], hs, n, FastSet.empty_set(), FastSet.empty_set(), n + 1));
  }
  static hfiss(stat, curr, h, hs, n, prestrictions, nrestrictions, ceiling) {
    if (h == 0) {
      return curr;
    }
    let total = 0;
    if (in_interval(hs[1] - h, hs)) {
      total = curr;
    }
    let toadd = stat;
    while (toadd != 0) {
      let shift = trailing_zeros(toadd);
      if (shift > ceiling) {
        break;
      }
      if (!prestrictions.has(shift)) {
        let cycled = cycle(curr, shift, n);
        let newnrestr = nrestrictions.clone();
        newnrestr.add(shift);

        let rec_call = FastSet.hfiss(stat, cycled, h - 1, hs, n, prestrictions.clone(), newnrestr, shift);
        total |= rec_call;
      }
      if (!nrestrictions.has(shift)) {
        let cycled = cycle_rev(curr, shift, n);
        let newprestr = prestrictions.clone();
        newprestr.add(shift);

        let rec_call = FastSet.hfiss(stat, cycled, h - 1, hs, n, newprestr, nrestrictions.clone(), shift);
        total |= rec_call;
      }
      toadd &= toadd - 1;
    }
    return total;
  }
  hfold_interval_restricted_signed_sumset(hs, n) {
    return new FastSet(FastSet.hfirss(this.contents, 1, hs[1], hs, n, FastSet.empty_set(), n + 1));
  }
  static hfirss(stat, curr, h, hs, n, restrictions, ceiling) {
    // A "1" in restrictions[i] means i has already been added
    if (h == 0) {
      return curr;
    }
    let total = 0;
    if (in_interval(hs[1] - h, hs)) {
      total = curr;
    }
    let toadd = stat;
    while (toadd != 0) {
      let shift = trailing_zeros(toadd);
      if (shift > ceiling) {
        break;
      }
      if (!restrictions.has(shift)) {
        let cycled = cycle(curr, shift, n);
        let newrestr = restrictions.clone();
        newrestr.add(shift);

        let rec_call = FastSet.hfirss(stat, cycled, h - 1, hs, n, newrestr, shift);
        total |= rec_call;

        // Also choose -cycled
        cycled = cycle_rev(curr, shift, n);
        newrestr = restrictions.clone();
        newrestr.add(shift);

        rec_call = FastSet.hfirss(stat, cycled, h - 1, hs, n, newrestr, shift);
        total |= rec_call;
      }
      toadd &= toadd - 1;
    }
    return total;
  }

}

class GeneralSet {

  constructor(contents) {
    // contents is some iteratable
    this.contents = []
    this.add_all(contents || []);
  }

  // STATIC
  static singleton(i) {
    // create fastset with one element i
    var gs = new GeneralSet();
    gs.add(i);
    return gs;
  }
  static empty_set() {
    // create and return an empty GeneralSet
    return new GeneralSet();
  }

  // STRUCTURAL METHODS
  has(el) {
    return this.contents.some(x => arraysEqual(x,el));
  }
  add(el) {
    if (!this.has(el)) {
      this.contents.push(el);
    }
  }
  delete(el) {
    this.contents = this.contents.filter(x => !arraysEqual(x,el));
  }
  add_all(iter) {
    for (let el of iter) {
      this.contents.push(el);
    }
    this.collect();
  }
  is_full(n) {
    return this.size() == n;
  }
  size() {
    return this.contents.length;
  }
  is_empty() {
    return this.size() == 0;
  }
  intersect(other) {
    let to_delete = [];
    for (let el of this.contents) {
      if (!other.has(el)) {
        to_delete.push(el);
      }
    }
    for (let el of to_delete) {
      this.delete(el);
    }
  }
  sort() {
    let func;
    if (this.contents.length != 0 && typeof(this.contents[0]) == "number") {
      func = function(a,b){return a - b};
    }
    this.contents.sort(func)
    return this;
  }
  clone() {
    let cl = new GeneralSet();
    cl.add_all(JSON.parse(JSON.stringify(this.contents)));
    return cl;
  }
  zero_free(sizes) {
    return !this.has(zeros(sizes.length));
  }


  collect() {
    // TODO: make this better
    this.sort();
    let res = [];
    for (let el of this.contents) {
      if (!arraysEqual(el, res[res.length - 1])) {
        res.push(el);
      }
    }
    this.contents = res;
  }


  // displays
  as_vec() {
    return this.contents;
  }
  to_string() {
    return '{' + this.clone().sort().as_vec().map(x => typeof(x) == 'object' ? "(" + x.toString() + ")" : x.toString()).toString() + '}';
  }

  // SUMSETS
  hfold_sumset(h, G) {
    let res = new GeneralSet();
    let n = G.length;
    if (this.contents.length == 0 || h == 0) {
      this.add(zeros(G.length));
      return res;
    }
    for (let indices of combinations_with_replacement(this.contents.length, h)) {
      res.add(indices.map(x => this.contents[x]).reduce((a,b) => mod_add(a, b, G)));
    }
    return res;
  }
  hfold_interval_sumset(intv, G) {
    let res = new GeneralSet();
    let [ia, ib] = intv;
    for (let i = ia; i <= ib; i++) {
      let tmp = this.hfold_sumset(i, G);
      res.add_all(tmp.contents);
    }
    return res;
  }

  hfold_signed_sumset(h, G) {
    let res = new GeneralSet();
    let n = G.length;
    if (this.contents.length == 0 || h == 0) {
      res.add(n == 1 ? 0 : zeros(n));
      return res;
    }
    let to_add = [];
    for (let indices of combinations_with_replacement(this.contents.length, h)) {
      for (let signs of sign_combinations(indices)) {
        let i = -1;
        to_add.push(
          fold(
            (prev, curr) => {i++; return mod_add(prev, signs[i] == 1 ? curr : neg_elem(curr, G), G)},
            n == 1 ? 0 : zeros(n),
            indices.map(x => this.contents[x])
          )
        )
      }
    }
    res.add_all(to_add);
    return res;
  }
  hfold_interval_signed_sumset(intv, G) {
    let res = new GeneralSet();
    let [ia, ib] = intv;
    for (let i = ia; i <= ib; i++) {
      if (i == 0) {
        res.add(zeros(this.contents.length));
        continue;
      }
      let tmp = this.hfold_signed_sumset(i, G);
      res = res.add_all(tmp.contents);
    }
    return res;
  }

  hfold_restricted_sumset(h, G) {
    let res = new GeneralSet();
    let n = G.length;
    if (this.contents.length == 0 || h == 0) {
      res.add(n == 1 ? 0 : zeros(n));
      return res;
    }
    for (let indices of combinations(range(0, this.contents.length), h)) {
      res.add(
        fold(
          (prev, curr) => mod_add(prev, curr, G),
          n == 1 ? 0 : zeros(n),
          indices.map(x => this.contents[x])
        )
      );
    }
    return res;
  }
  hfold_interval_restricted_sumset(intv, G) {
    let res = new GeneralSet();
    let [ia, ib] = intv;
    for (let i = ia; i <= ib; i++) {
      let tmp = this.hfold_restricted_sumset(i, G);
      res.add_all(tmp.contents);
    }
    return res;
  }

  hfold_restricted_signed_sumset(h, G) {
    let res = new GeneralSet();
    let n = G.length;
    if (this.contents.length == 0 || h == 0) {
      res.add(n == 1 ? 0 : zeros(n));
      return res;
    }
    let to_add = [];
    for (let indices of combinations(range(0, this.contents.length), h)) {
      for (let signs of sign_combinations(indices)) {
        let i = -1;
        to_add.push(
          fold(
            (prev, curr) => {i++; return mod_add(prev, signs[i] == 1 ? curr : neg_elem(curr, G), G)},
            n == 1 ? 0 : zeros(n),
            indices.map(x => this.contents[x])
          )
        )
      }
    }
    res.add_all(to_add);
    return res;
  }
  hfold_interval_restricted_signed_sumset(intv, G) {
    let res = new GeneralSet();
    let [ia, ib] = intv;
    for (let i = ia; i <= ib; i++) {
      let tmp = this.hfold_restricted_signed_sumset(i, G);
      res.add_all(tmp.contents);
    }
    return res;
  }

}












// H functions

function H_eval(H) {
  if (H == '') {
    return 1;
  }
  if (H.startsWith('{')) {
    return new Set(H.replace('{','').replace('}','').split(',').map(x => Number(x)));
  } else {
    return eval(H);
  }
}

function H_type(H) {
  // H is either a javascript set, list, or number:
  //   - set ("Set") => {1, 2, 3} is the set {1, 2, 3}
  //   - list ("Array") => [0,5] is the set {0, 1, 2, 3, 4, 5}
  //   - number => 1 is the set {1}

  if (typeof(H) == "object") {
    if (H.constructor.name == 'Set') {
      return 'literal';
    } else if (H.constructor.name == 'Array'){
      return 'interval';
    }
    unreachable();
  } else {
    return 'singleton';
  }

}

function H_to_string(H) {
  if (typeof(H) == "object") {
    if (H.constructor.name == 'Set') {
      return '{' + [...H.values()].toString() + '}';
    } else if (H.constructor.name == 'Array'){
      return '[' + H.toString() + ']';
    }
    unreachable();
  } else {
    return String(H);
  }
}






// input check functions


function check_group_string(el) {
  el.value = el.value.split('').filter(x=>'1234567890,x'.includes(x)).join('');
  if (el.value.includes(',') && el.value.includes('x')) {
    let first_comma = el.value.indexOf(',');
    let first_x = el.value.indexOf('x');
    el.value = el.value.replaceAll(el.value[Math.max(first_comma, first_x)],el.value[Math.min(first_comma, first_x)])
  }
  el.value = el.value.replaceAll('xx','x').replaceAll(',,',',');
}

function check_arg_string(el) {
  el.value = el.value.split('').filter(x => '1234567890,[]'.includes(x)).join('');
  // todo: make this better
}

function check_group_var_string(el) {
  el.value = el.value.split('').filter(x=>'1234567890,xrc'.includes(x)).join('');
  if (el.value.includes(',') && el.value.includes('x')) {
    let first_comma = el.value.indexOf(',');
    let first_x = el.value.indexOf('x');
    el.value = el.value.replaceAll(el.value[Math.max(first_comma, first_x)],el.value[Math.min(first_comma, first_x)])
  }
  el.value = el.value.replaceAll('xx','x').replaceAll(',,',',');
}

function check_arg_var_string(el) {
  el.value = el.value.split('').filter(x => '1234567890,[]rc'.includes(x)).join('');
  // todo: make this better
}

function check_set_string(el) {
  el.value = el.value.split('').filter(x => '1234567890,()'.includes(x)).join('');
}

function num_only(el) {
  el.value = el.value.split('').filter(x => '1234567890'.includes(x)).join('');
}






// main functions


function parse_args(func, arg) {

  const ONE_ARG_REG = /^\d+$/;
  const ONE_ARG_INTV_REG = /^\[\d+,\d+\]$/;
  const TWO_ARG_REG = /^\d+,\d+$/;
  const TWO_ARG_INTV_REG = /^\d+,\[\d+,\d+\]$/;

  arg = arg.replace(/\s/g, '');
  if (func === "nu" || func === "rho") {
    if (!arg.match(TWO_ARG_INTV_REG) && !arg.match(TWO_ARG_REG)) {
      throw new Error("Two arguments expected. <br/> Ex: 3,[0,5] or 3,5");
    }
  } else if (func === 'mu') {
    if (!arg.match(TWO_ARG_REG)) {
      throw new Error("Two arguments expected. <br/> Ex: 3,2");
    }
  } else { // All the other funcs are 1 argument
    if (arg.match(ONE_ARG_REG)) {
    } else if (arg.match(ONE_ARG_INTV_REG)) {
      if (func === "sigma") {
        // Special case
        let special_regex = /\[(\d+),\d+\]$/;
        let match = special_regex.exec(arg);
        let lower_bound = match[1];
        if (lower_bound !== '0') {
          throw new Error("Sigma interval only allows a lower bound of 0 (" + lower_bound + " is not allowed)");
        } else {
          arg = arg.replace("[", "").replace("]", "").replace(",0,", ",");
        }
      }
    } else {
      throw new Error("One argument expected. <br/> Ex: 5 or [0,3]");
    }
  }

  let e_args;

  if (func === "nu" || func === "rho") {
    e_args = {
      m:Number(arg.slice(0,arg.indexOf(','))),
      H:H_eval(arg.slice(arg.indexOf(',') + 1))
    };
  } else if (func == "mu") {
    e_args = {H:new Set(arg.split(',').map(x => Number(x)))};
  } else {
    e_args = {H:H_eval(arg)};
  }

  return e_args;

}




class Group {

  constructor(sizes, verbose_element) {
    this.verbose_writer = new VerboseWriter(verbose_element);
    this.sizes = sizes;
    this.n = this.sizes.reduce((a,b) => a*b);
    this.groupType = this.sizes.length == 1 ? 'cyclic' : 'non-cyclic';
    if (sizes.length == 1 && sizes[0] <= BIT_SIZE) {
      this.SetClass = FastSet;
      this.G = this.n;
    } else {
      this.SetClass = GeneralSet;
      this.G = this.sizes;
      if (this.G.length == 1) {
        this.comb_func = function(x) {return new GeneralSet(x.map(v => v[0]))};
      } else {
        this.comb_func = function(x) {return new GeneralSet(x)};
      }
      if (rel_prime(this.sizes) && this.n <= 31 && verbose_element) {
        this.verbose_writer.write("The group G[" + this.sizes.toString() + "] is isomorphic to the group G[" + this.n + "]. Using this group instead will speed up calculation.")
      }
    }
  }


  each_set_exact_helper(max_size, set_size, type) {
    if (max_size < set_size) {
      return new EachSetExact(0, 0, true).iterable(type);
    }
    let naivestate = (1 << set_size) - 1;
    let setmask = ~((1 << max_size) - 1);
    return new EachSetExact(naivestate, setmask, false).iterable(type);
  }

  each_set_exact(set_size, nozero) {
    if (this.SetClass == FastSet) {
      return this.each_set_exact_helper(this.n, set_size, 'next');
    } else {
      return combinations(each_element(zeros(this.sizes.length),this.sizes,!nozero),set_size,this.comb_func);
    }
  }
  each_set_exact_zero(set_size) {
    return this.each_set_exact_helper(this.n - 1, set_size - 1, 'next_zero');
  }
  each_set_exact_no_zero(set_size) {
    if (this.SetClass == FastSet) {
      return this.each_set_exact_helper(this.n - 1, set_size, 'next_no_zero');
    } else {
      return combinations(each_element(zeros(this.sizes.length), this.sizes), set_size, this.comb_func);
    }
  }

  to_string() {
    return 'G[' + this.sizes.join('x') + ']';
  }

  get_opt_string(restricted, signed, interval) {
    return (interval ? 'interval_' : '') + (restricted ? 'restricted_' : '') + (signed ? 'signed_' : '');
  }


  // chapter a
  nu(args) {
    if (H_type(args.H) == 'literal') unimplemented();
    let interval = H_type(args.H) == "interval";
    let opt_string = this.get_opt_string(args.restricted, args.signed, args.interval);
    let sumset_function = 'hfold_' + opt_string + 'sumset';

    if (args.verbose) this.verbose_writer.c_write("nu" + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "(" + this.to_string() + ", " + args.m + ", " + H_to_string(args.H) + ")");

    let greatest_set = this.SetClass.empty_set();
    let curr_greatest = 0;
    for (let a of this.each_set_exact(args.m)) {
      let size = a[sumset_function](args.H, this.G).size();
      if (size > curr_greatest) {
        if (size == this.n) {
          if (args.verbose) {
            this.verbose_writer.r_write("Found spanning set: " + a.to_string());
            this.verbose_writer.ae_write(this.n);
          }
          return this.n;
        }
        curr_greatest = size;
        greatest_set = a;
      }
    }
    if (args.verbose) {
      this.verbose_writer.r_write("Set with greatest sumset: A=" + greatest_set.to_string());
      this.verbose_writer.r_write("(sumset is:) " + H_to_string(args.H) + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "A=" + greatest_set[sumset_function](args.H, this.G).to_string());
      this.verbose_writer.ae_write(curr_greatest);
    }
    return curr_greatest;
  }
  // chapter b
  phi(args) {
    if (H_type(args.H) == 'literal') unimplemented();
    let interval = H_type(args.H) == "interval";

    let opt_string = this.get_opt_string(args.restricted, args.signed, interval);
    let sumset_function = 'hfold_' + opt_string + 'sumset';

    if (args.verbose) this.verbose_writer.c_write("phi" + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "(" + this.to_string() + ", " + H_to_string(args.H) + ")");

    if (interval) {
      if (args.signed) {
        for (let m = 1; m < this.n; m++) {
          for (let a of this.each_set_exact(m)) {
            if (a[sumset_function](args.H, this.G).is_full(this.G)) {
              if (args.verbose) {
                this.verbose_writer.r_write("Found spanning set: A=" + a.to_string());
                this.verbose_writer.ae_write(m);
              }
              return m;
            }
          }
        }
        unreachable();
      } else {
        let lower_bound = 1;

        // better lower bounds for cyclic groups
        if (this.groupType == 'cyclic') {

          if (!args.restricted) { // Proposition B.10
            if (args.H[0] == 0) {
              let s = args.H[1];
              lower_bound = Math.max(1, 1 + Math.ceil(Math.pow(factorial(s) * this.n, (1 / s))) - s);
              if (args.verbose) this.verbose_writer.r_write("(Proposition B.10) Using lower bound: " + lower_bound);
            }
          } else { // Proposition B.73
            if (args.H[0] == 0 && args.H[1] == 2) {
              lower_bound = Math.max(1, Math.ceil((Math.sqrt(8 * this.n - 7) - 1) / 2));
              if (args.verbose) this.verbose_writer.r_write("(Proposition B.73) Using lower bound: " + lower_bound);
            }
          }
        }

        for (let m = lower_bound; m <= this.n; m++) {
          for (let a of this.each_set_exact(m)) {
            if (a[sumset_function](args.H, this.G).is_full(this.n)) {
              if (args.verbose) {
                this.verbose_writer.r_write("Found spanning set: " + a.to_string());
                this.verbose_writer.ae_write(m);
              }
              return m;
            }
          }
        }
        unreachable();
      }
    } else {
      if (args.restricted) {
        if (!args.signed) {
          if (this.n == 1) {
            if (args.verbose) this.verbose_writer.r_write("... = 1");
            return 1;
          }
          if (args.H == 1) {
            if (args.verbose) this.verbose_writer.ae_write(this.n);
            return n;
          }
        }

        if (this.n <= args.H) {
          if (args.verbose) this.verbose_writer.ae_write(this.n);
          return this.n;
        }
        for (let m = 2; m <= this.n; m++) {
          for (let a of this.each_set_exact(m)) {
            let sumset = a[sumset_function](args.H, this.G);
            if (sumset.is_full(this.n)) {
              if (args.verbose) {
                this.verbose_writer.r_write("Found spanning set: " + a.to_string());
                this.verbose_writer.ae_write(m);
              }
              return m;
            }
          }
        }
        unreachable();
      } else {
        if (args.signed) {
          if (this.n == 1) {
            if (args.verbose) this.verbose_writer.r_write("... = 1");
            return 1;
          }
          for (let m = 2; m <= this.n; m++) {
            for (let a of this.each_set_exact(m)) {

              if (a[sumset_function](args.H, this.G).is_full(this.n)) {
                if (verbose) {
                  this.verbose_writer.r_write("Found spanning set: " + a.to_string());
                  this.verbose_writer.ae_write(m);
                }
                return m;
              }
            }
          }
          unreachable();
        }
        else {
          if (this.n == 1) {
            return 1;
          }
          if (args.H == 1) {
              return this.n;
          }
          if (args.verbose) this.verbose_writer.r_write("Using relation between phi and phi_interval to compute value");

          let res = 1 + this.phi(false, false, [0, args.H], false);

          if (args.verbose) this.verbose_writer.ae_write(res);

          return res;
        }
      }
    }

  }
  // chapter c
  sigma(args) {
    if (H_type(args.H) == 'literal') unimplemented();
    let interval = H_type(args.H) == "interval";
    let opt_string = this.get_opt_string(args.restricted, args.signed, interval);
    let sumset_function = 'hfold_' + opt_string + 'sumset';

    if (args.verbose) this.verbose_writer.c_write("sigma" + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "(" + this.to_string() + ", " + H_to_string(args.H) + ")");

    let expected_function = function(m, h, s) {
      if (opt_string == '') {
        return choose(m + h - 1, h);
      } else if (opt_string == 'interval_') {
        return choose(m + s, s);
      } else if (opt_string == 'signed_') {
        return c(h, m);
      } else if (opt_string == 'interval_signed_') {
        return c(m, s);
      } else if (opt_string == 'restricted_') {
        return choose(m, h);
      } else if (opt_string == 'interval_restricted_') {
        return range(0, Math.min(s, m) + 1).map(h => choose(m, h)).reduce((a,b) => a + b);
      } else if (opt_string == 'restricted_signed_') {
        return choose(m, h) * 2**h;
      } else if (opt_string == 'interval_restricted_signed_') {
        return range(0, Math.min(s, m) + 1).map(h => choose(m, h) * 2**h).reduce((a,b) => a + b);
      }
    }

    let h = null;
    let s = null;
    if (interval) {
      if (args.H[0] != 0) {
        unimplemented();
      }
      s = args.H[1];
    } else {
      h = args.H;
    }

    let lower_bound = args.lower_bound || 1;
    let upper_bound = args.upper_bound || this.n - 1;

    if (upper_bound < lower_bound) bad_bounds();

    for (let m = upper_bound; m >= lower_bound; m--) {
      let expected = expected_function(m,h,s);
      for (let a of this.each_set_exact(m)) {
        if (a[sumset_function](args.H, this.G).size() == expected) {
          if (args.verbose) this.verbose_writer.r_write("for m=" + m + ", found A=" + a.to_string());
          if (args.upper_bound && (args.upper_bound == m)) {
            // supplied upper bound and didn't disprove the existence of any larger sidon sets, we can't be sure of equality
            if (args.verbose) this.verbose_writer.ag_write(m);
          } else {
            if (args.verbose) this.verbose_writer.ae_write(m);
          }
          return m;
        }
      }
      if (args.verbose) this.verbose_writer.r_write("for m=" + m + ", no sidon sets (sumset size " + expected + ") found");

    }

    if (args.verbose) this.verbose_writer.r_write("Found no sets of the required size");
    if (lower_bound == 1) {
      this.verbose_writer.ae_write(lower_bound - 1);
    } else {
      this.verbose_writer.al_write(lower_bound - 1);
    }
    return lower_bound - 1;

  }
  // chapter d
  rho(args) {
    if (H_type(args.H) == 'literal') unimplemented();
    let interval = H_type(args.H) == "interval";
    let opt_string = this.get_opt_string(args.restricted, args.signed, interval);
    let sumset_function = 'hfold_' + opt_string + 'sumset';

    if (args.verbose) this.verbose_writer.c_write("rho" + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "(" + this.to_string() + ", " + args.m + ", " + H_to_string(args.H) + ")");

    let smallest_set = this.SetClass.empty_set();
    let curr_smallest = this.n;
    for (let a of this.each_set_exact(args.m)) {
      let size = a[sumset_function](args.H, this.G).size();
        if (size < curr_smallest) {
          curr_smallest = size;
          smallest_set = a;
        }
    }
    if (args.verbose) {
      this.verbose_writer.r_write("Set with smallest sumset: A=" +  smallest_set.to_string());
      this.verbose_writer.r_write("(sumset is:) " + H_to_string(args.H) + "A=" + smallest_set[sumset_function](args.H, this.G).to_string());
      this.verbose_writer.ae_write(curr_smallest);
    }
    return curr_smallest;
  }
  // chapter e
  chi(args) {
    if (H_type(args.H) == 'literal') unimplemented();
    let interval = H_type(args.H) == "interval";
    let opt_string = this.get_opt_string(args.restricted, args.signed, interval);
    let sumset_function = 'hfold_' + opt_string + 'sumset';

    if (args.verbose) this.verbose_writer.c_write("chi" + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "(" + this.to_string() + ", " + H_to_string(args.H) + ")");

    let once_found = false;

    let lower_bound = args.lower_bound || 1;
    let upper_bound = args.upper_bound || this.n - 1;

    if (upper_bound < lower_bound) bad_bounds();

    for (let m = lower_bound; m <= upper_bound; m++) {
      let found = false;
      for (let a of this.each_set_exact(m)) {
        if (!a[sumset_function](args.H, this.n).is_full(this.n)) {
          if (args.verbose) {
            this.verbose_writer.r_write("For m=" + m + ", found A=" + a.to_string() + ", which doesn't give a full sumset");
            this.verbose_writer.r_write("(gives:) " + H_to_string(args.H) + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "A=" + a[sumset_function](args.H, this.G).to_string());
          }
          once_found = true;
          found = true;
          break;
        }
      }

      if (!found) {
        if (args.verbose) {
          this.verbose_writer.r_write("Every " + (args.restricted ? "restricted" : "") + (args.signed ? "signed" : "") + H_to_string(args.H) + "-fold sumset of a subset of size " + m + " is full");
          if (args.lower_bound && !once_found) {
            // supplied lower bound and never found, we can't be sure of equality
            this.verbose_writer.al_write(m);
          } else {
            this.verbose_writer.ae_write(m);
          }
        }
        return m;
      }

    }

    if (args.verbose) {
      if (args.lower_bound && !once_found) {
        // supplied lower bound and never found, we can't be sure of equality
        this.verbose_writer.al_write(this.n - 1);
      } else if (args.upper_bound) {
        this.verbose_writer.ag_write(args.upper_bound);
      } else {
        this.verbose_writer.ae_write(this.n - 1);
      }
    }
    return upper_bound;


    unreachable();
  }
  // cahpter f
  tau(args) {
    if (H_type(args.H) == 'literal') unimplemented();
    let interval = H_type(args.H) == "interval";
    let opt_string = this.get_opt_string(args.restricted, args.signed, interval);
    let sumset_function = 'hfold_' + opt_string + 'sumset';

    if (args.verbose) this.verbose_writer.c_write("tau" + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "(" + this.to_string() + ", " + H_to_string(args.H) + ")");

    if (args.restricted && !args.signed && !args.interval) {
      let h = args.H;
      // Theorem F.88
      if (this.groupType == 'cyclic') {
        if (this.n >= 12 && this.n % 2 == 0 && (3 <= h) && (h <= this.n - 1) && (h % 2 == 1)) {
          let val;
          if (h == 1) {
            val = this.n - 1;
          } else if ((3 <= h) && (h <= this.n / 2 - 2)) {
            val = this.n / 2;
          } else if (h == this.n / 2 - 1) {
            val = this.n / 2 + 1;
          } else if ((this.n / 2 <= h) && (h <= this.n - 2)) {
            val = h + 1;
          } else { // h = n - 1 (guaranteed)
            val = this.n - 1
          }
          if (args.verbose) this.verbose_writer.ae_write(val);
          return val;
        }
      }
      if (this.n == 1) {
        if (args.verbose) {
          this.verbose_writer.r_write("Using Theorem F.88");
          this.verbose_writer.ae_write(1);
        }
        return 1;
      }
    }

    let lower_bound = args.lower_bound || 1;
    let upper_bound = args.upper_bound || this.n;

    if (upper_bound < lower_bound) bad_bounds();

    for (let m = upper_bound; m >= lower_bound; m--) {
      for (let a of this.each_set_exact_no_zero(m)) {
        if (a[sumset_function](args.H, this.G).zero_free(this.G)) {
          if (args.verbose) {
            this.verbose_writer.r_write("For m=" + m + " found A=" + a.to_string() + " which gives a zero-free sumset");
            this.verbose_writer.r_write("(gives:) " + H_to_string(args.H) + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "A=" + a[sumset_function](args.H, this.G).to_string());
            if (args.upper_bound && (args.upper_bound == m)) {
              // supplied upper bound and didn't disprove the existence of any larger zero free sets, we can't be sure of equality
              this.verbose_writer.ag_write(m);
            } else {
              this.verbose_writer.ae_write(m);
            }
          }
          return m;
        }
      }
      if (args.verbose) {
        this.verbose_writer.r_write("No subsets of size m=" + m + " give a zero-free sumset");
      }
    }
    if (args.verbose) {
      this.verbose_writer.al_write(lower_bound - 1);
    }
    return lower_bound - 1;

  }
  // chapter g
  mu(args) {
    if (H_type(args.H) != "literal") unimplemented();
    let opt_string = this.get_opt_string(args.restricted, args.signed);
    let sumset_function = 'hfold_' + opt_string + 'sumset';

    if (args.verbose) this.verbose_writer.c_write("mu" + VerboseWriter.disp_opt_string(args.restricted, args.signed) + "(" + this.to_string() + ", " + H_to_string(args.H) + ")");

    let k = Math.max(...args.H);
    let l = Math.min(...args.H);

    if (k == l) {
      if (args.verbose) this.verbose_writer.ae_write(0);
      return 0;
    }

    let once_found = false;

    let upper_bound = args.upper_bound || this.n - 1;
    let lower_bound = args.lower_bound || 1;

    if (upper_bound < lower_bound) bad_bounds();

    for (let m = lower_bound; m <= upper_bound; m++) {
      let found = false;
      for (let a of this[args.restricted && [k,l]==[2,1] ? 'each_set_exact_no_zero' : 'each_set_exact'](m)) { // if mu is restricted, then 0 cannot be in the subset
        let k_a = a[sumset_function](k, this.G);
        let l_a = a[sumset_function](l, this.G);
        k_a.intersect(l_a);
        if (k_a.is_empty()) {
          if (args.verbose){
            this.verbose_writer.r_write("For m=" + m + ", found A=" + a.to_string() + ", which is (" + k + ", " + l + ")-sum-free");
            this.verbose_writer.r_write("(kA = " + a[sumset_function](k, this.G).to_string() + ", lA = " + l_a.to_string() + ")");
          }
          found = true;
          once_found = true;
          break;
        }
      }
      if (!found) {
        if (args.verbose) {
          this.verbose_writer.r_write("For m=" + m + ", no sum-free sets were found");
          if (args.lower_bound && !once_found) {
            // supplied lower bound and never found, we can't be sure of equality
            this.verbose_writer.al_write(m - 1);
          } else {
            this.verbose_writer.ae_write(m - 1);
          }
        }
        return m - 1;
      }
    }

    if (args.verbose) {
      if (args.lower_bound && !once_found) {
        // supplied lower bound and never found, we can't be sure of equality
        this.verbose_writer.al_write(this.n - 1);
      } else if (args.upper_bound) {
        this.verbose_writer.ag_write(args.upper_bound);
      } else {
        this.verbose_writer.ae_write(this.n - 1);
      }
    }
    return upper_bound;
  }

}








// worker class and endpoints

class Computer {
  constructor(loc) {
    this.worker = new Worker(loc || 'AddComb.js');
  }

  start(data) {
    // data is JSON with purpose, info, timeout, an ontimeout function, onupdate, and an oncomplete function
    const purpose = data.purpose;
    const timeout = data.timeout;
    // kill after timeout
    const w = this.worker;
    const ontimeout = data.ontimeout || function (x) {console.log('timeout')};
    const id = setTimeout(function() {
      if (timeout) {
        w.terminate();
        ontimeout({
          msg: purpose + ' calculation timed out after ' + timeout + 'ms.'
        });
      }
    }, data.timeout);

    // responses
    this.worker.onmessage = function(msg) {
      data['on' + msg.data.type](msg);
      if (msg.data.type == 'complete') {
        clearTimeout(id);
      }
    }
    // start computation
    this.worker.postMessage({
      purpose: data.purpose,
      info: data.info,
    });
  }

  stop() {
    this.worker.terminate();
  }

}

var comp_purposes = {
  "sumset":function(info) {
    let H = H_eval(info.H_string);
    let set_contents = info.set_contents;
    let restricted = info.restricted;
    let signed = info.signed;
    let sizes = info.sizes;
    if (sizes == "") {
      throw new Error('You must define a group');
    } else {
      sizes = sizes.replaceAll('x',',').split(",").map(x => Number(x))
    }
    let group = new Group(sizes);

    if (group.SetClass == FastSet) {
      if (set_contents.includes('(')) { // TODO: make this check better
        throw new Error("The group factor orders don't match the set contents.")
      }
      set_contents = set_contents.split(',').filter(x => x.length != 0).map(x => Number(x));
    } else {
      if (set_contents.includes('(') && group.sizes.length == 1) { // TODO: make this check better
        throw new Error("The group factor orders don't match the set contents.")
      }
      set_contents = eval('[' + set_contents.replaceAll('(','[').replaceAll(')',']') + ']');
    }

    let set = new group.SetClass();
    set.add_all(set_contents);
    let G = group.G;
    let interval = H_type(H) == 'interval';
    let sumset_function = 'hfold_' + group.get_opt_string(restricted, signed, interval) + 'sumset';
    let sumset = set[sumset_function](H,G);

    return {
      sumset: sumset,
      verbose_string: "in " + group.to_string() + ", " + H_to_string(H) + VerboseWriter.disp_opt_string(restricted, signed) + set.to_string() + ' = ' + sumset.to_string()
    };
  },
  "function":function(info) {
    let sizes = info.sizes;
    if (sizes == "") {
      throw new Error('You must define a group');
    } else {
      sizes = sizes.replaceAll('x',',').split(",").map(x => Number(x))
    }
    // let verbose_element = {innerHTML:''};
    const self_ = self;
    let verbose_element = {
      innerHTMLInternal: "",
      innerHTMLListener: function(val) {
        self_.postMessage({
          type: 'update',
          msg: {
            verbose_string: this.innerHTML
          }
        });
      },
      set innerHTML(val) {
        this.innerHTMLInternal = val;
        this.innerHTMLListener(val);
      },
      get innerHTML() {
        return this.innerHTMLInternal;
      }
    };
    let group = new Group(sizes, info.verbose ? verbose_element : false);
    let args = parse_args(info.func, info.arg);
    args.restricted = info.restricted;
    args.signed = info.signed;
    args.verbose = info.verbose;
    let num = group[info.func](args);
    return {
      num: num,
      verbose_string: verbose_element.innerHTML
    };
  },
  "eval":function(info) {
    const self_ = self;
    let verbose = {
      innerHTMLInternal: "",
      innerHTMLListener: function(val) {
        self_.postMessage({
          type: 'update',
          msg: {
            verbose_string: this.innerHTML
          }
        });
      },
      set innerHTML(val) {
        this.innerHTMLInternal = val;
        this.innerHTMLListener(val);
      },
      get innerHTML() {
        return this.innerHTMLInternal;
      }
    };
    function print() {
      let args = [...arguments];
      verbose.innerHTML += args.map(x => typeof(x) == 'string' ? x : JSON.stringify(x)).join(' ') + "\n";
    }
    return eval(info.str);
    // self.postMessage({
    //   type: 'complete'
    // });
  },
  "mu_r_2_1_help":function(info) {
    let found = false;
    let set = null;
    for (let indices of info.combs) {
      let gs = new GeneralSet(indices.map(i => info.all_elements[i]));
      let h2A = gs.hfold_restricted_sumset(2,info.sizes);
      h2A.intersect(gs);
      if (h2A.is_empty()) {
        found = true;
        set = gs;
        break;
      }
    }
    return {
      found:found,
      set:found ? set.to_string() : null
    };
  },
  "complete_helper":function(info) {
    let found = [];
    for (let a_ of info.combs) {
      let a = new GeneralSet(a_);
      let k_a = a.hfold_restricted_sumset(2, [info.n]);
      let s = k_a.size();
      k_a.intersect(a);
      if (k_a.is_empty() && a.size() + s == info.n) {
        found.push(a.as_vec());
      }
    }
    return found;
  },
  "timed_eval":function(info) {
    let t_0 = new Date();
    for (let i = 0; i < info.N; i++) {
      eval(info.str);
    }
    return {
      dt: new Date() - t_0
    };
  },
};


self.onmessage = function (msg) {
  try {
    const data = msg.data;
    self.postMessage({
      type: 'complete',
      res: comp_purposes[data.purpose](data.info)
    });
  } catch (e) {
    self.postMessage({
      type: 'error',
      msg: e.message,
      error: e
    });
  }

}
