# addcomb-js

`AddComb.js` is a javascript library for additive combinatorics calculation.


##### The [Online Interface](https://PetereFrancis.com/addcomb-js/web/index.html) allows for full functionality of [this repository](https://github.com/PeterEFrancis/addcomb-js).


## Use

To use `AddComb.js`, include the script in your html file.

```javascript
<script src="https://PetereFrancis.com/addcomb-js/AddComb.min.js"></script>
```



## Examples

The main bit of important code is the sumset calculations and the 7 "Chapter" functions.

### Sumsets

To do sumset calculations, first create a new set object (`FastSet` for cyclic groups of order at most 31, otherwise `GeneralSet`). Then add contents to your set and call the appropriate sumset method.

```javascript
// I want to create the set {1, 2, 3} and
// find its 2 fold restricted sumset in Z_13
let fs = new FastSet();
fs.add_all([1, 2, 3]);
let sumset1 = fs.hfold_restricted_sumset(2, 13);

// I want to create the set {(1,3), (2,14), (3,10)} and
// find its [0,3] fold signed sumset in Z_5 x Z_15
let gs = new GeneralSet();
fs.add_all([[1,3], [2,14], [3,10]]);
let sumset = fs.hfold_signed_sumset([0,3], [2,15]);
```

The same can be accomplished by creating a `Computer` object to complete the computation asynchronously:

```javascript
// I want to create the set {(1,3), (2,14), (3,10)} and
// find its [0,3] fold signed sumset in Z_5 x Z_15
let computer = new Computer();
computer.start({
  purpose: 'sumset',
  info: {
    H_string: '[0,3]',
    set_contents: '(1,3), (2,14), (3,10)',
    restricted: false,
    signed: true,
    sizes: '13x15'
  },
  oncomplete: function(response) {
    console.log(response.data.sumset); // FastSet or GeneralSet, depending
    console.log(response.data.verbose_string);
  },
  onerror: function(response) {
    console.log(response.data.msg);
  },
  ontimeout: function(response) {
    console.log(response.data.msg);
  },
  timeout: 60000 // ms to continue computation before timeout
})
```

### Chapter Functions


To execute chapter functions, you must first create a group object. By convention, the chapter functions usually take the group as an argument, but here, the group is an object and the chapter functions are all methods. If a verbose element is supplied, verbose printing will be allowed. To enable verbose printing, the last argument of a chapter function must be `true`. The verbose printing will be in the developer console during the computation, and once complete, will be added to the `innerHTML` verbose_element (the later must be done manually if using a `Computer` object).

```HTML
<textarea id='verbose'></textarea>
<script>
  let verbose_element = document.getElementById('verbose');

  // I want to find mu^(Z_2xZ_15, {1, 2}) with verbose printing
  let group_2_15 = new Group([2,15], verbose_element);
  let restricted = true;
  let signed = false;
  let H = new Set([1,2]);
  let verbose = true;
  let result1 = group_2_15.mu(restricted, signed, H, verbose);

  // I want to find nu±(Z_29, 5, [0,7]) without verbose printing
  let group_29 = new Group([29], verbose_element);
  let result2 = group.mu(false, true, [0,7], false);

</script>
```

The same can be accomplished by creating a `Computer` object to complete the computation asynchronously:

```HTML
<script src="AddComb.js"></script>
<textarea id='verbose'></textarea>
<script>
  let verbose_element = document.getElementById('verbose');

  // I want to find mu^(Z_2xZ_15, {1, 2}) with verbose printing
  let computer = new Computer();
  computer.start({
    purpose: 'function',
    info: {
      func:'mu',
      arg:'1,2',
      restricted:true,
      signed:false,
      sizes:'2x15',
      verbose:true
    },
    oncomplete: function(response) {
      verbose.innerHTML += response.data.verbose_string;
    },
    onerror: function(response) {
      console.log(response.data.msg);
    },
    ontimeout: function(response) {
      console.log(response.msg);
    },
    timeout: 10000 // ms to continue computation before timeout
  });


  // I want to find nu±(Z_29, 5, [0,7]) without verbose printing
  let computer = new Computer();
  computer.start({
    purpose: 'function',
    info: {
      func:'nu',
      arg:'5,[0,7]',
      restricted:false,
      signed:true,
      sizes:'29',
      verbose:false
    },
    oncomplete: function(response) {
      console.log(response.data.res);
    },
    onerror: function(response) {
      console.log(response.data.msg);
    },
    ontimeout: function(response) {
      console.log(response.msg);
    },
    timeout: 10000
  });

</script>
```
