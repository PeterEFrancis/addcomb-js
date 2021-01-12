
//             _      _   ____                   _         _
//   __ _   __| |  __| | / ___| ___   _ __ ___  | |__     (_) ___
//  / _` | / _` | / _` || |    / _ \ | '_ ` _ \ | '_ \    | |/ __|
// | (_| || (_| || (_| || |___| (_) || | | | | || |_) |_  | |\__ \
//  \__,_| \__,_| \__,_| \____|\___/ |_| |_| |_||_.__/(_)_/ ||___/
//                                                      |__/
// adaptation of code by Matt Torrence




"use strict";



// constants

const BIT_SIZE = 31;
const B = 2 ** BIT_SIZE - 1;





// bit helpers

function bin(int) {
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
  let i = 0;
  while (!(1 & n)) {
    i++;
    n >>= 1;
  }
  return i;
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
  // cycle the first m bits of num by i
  let ret = num;
  console.log("1.       ret: " + bin(ret));
  let wrapped = B << (m - i); // mask bits that will get wrapped
  console.log("2.   wrapped: " + bin(wrapped));
  wrapped &= ret;
  console.log("3.   wrapped: " + bin(wrapped));
  wrapped >>= m - i;
  console.log("4.   wrapped: " + bin(wrapped));
  ret <<= i;
  console.log("5.       ret: " + bin(ret));
  ret |= wrapped;
  console.log("6.       ret: " + bin(ret));
  ret &= ~(B << m);
  console.log("7. !(B << m): " + bin(~(B << m)))
  console.log("8.       ret: " + bin(ret));
  return ret;
}









// other helpers

function range(m,n) {
  var r = [];
  for (var i = m; i < n; i++) {
    r.push(i);
  }
  return r;
}

function sum(arr) {
  return arr.reduce((a,b)=>a+b);
}

function in_interval(val, interval) {
  // check if val is in the closed interval
  return val >= interval[0] && val <= interval[1];
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

function v(g, n, h) {
  return Math.max(...D(n).map(d => (Math.floor((d - 1 - gcd(d,g)) / h) + 1) * (n / d)));
}

function v_signed(n, h) {
  return Math.max(...D(n).map(d => (2 * Math.floor((d - 2) / (2 * h)) + 1) * (n / d)));
}

function u(n, m, h) {
  return Math.min(...D(n).map(d => (h * Math.ceil(m / d) - h + 1) * d));
}










// classes and associated func

class VerboseWriter {
  constructor(DOMElement) {
    this.element = DOMElement;
  }

  write (s) {
    try {
      this.element.innerHTML += s + "\n";
    } catch {
      // do nothing
    }
  }

}



class FastSet {
  constructor() {
    this.contents = 0;
  }

  // structural methods
  contains(i) {
    // check containment
    return this.contents & (1 << i) > 0;
  }
  add(i) {
    // add i to the set
    this.contents |= 1 << i;
  }
  isfull(n) {
    // Tests if the set is full up to (and including) n
    return (!(this.contents & ((1 << (n + 1)) - 1)) << (BIT_SIZE - n)) == 0;
  }
  isempty() {
    return this.contents == 0;
  }
  size() {
    return num_ones(self.contents);
  }
  intersect(other) {
    self.contents &= other.contents;
  }
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

  // sumsets
  hfold_sumset(h, n) {
    if (h == 0) {
      return singleton(0);
    }
    let res = 0;
    let prev = 1;

  }


}

function singleton(i) {
  // create fastset with one element i
  var fs = new FastSet();
  fs.add(i);
  return fs;
}

function emptyset() {
  // create and return an empty fastSet
  return new FastSet();
}



class Iterator {

  constructor() {

  }



}




// sumsets








// main functions

class AddComb {

  constructor(verbose_element) {
    this.verbose_writer = new VerboseWriter(verbose_element);
  }


  // nu

  nu(n, m, h, verbose) { }

  nu_interval(){}

  nu_signed(){}

  nu_signed_interval(){}

  nu_restricted(){}

  nu_restricted_interval(){}

  nu_signed_restricted(){}

  nu_signed_restricted_interval(){}



}
