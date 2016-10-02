## aframe-lsystem-component

A L-System component for [A-Frame](https://aframe.io) which use the L-System library [lindenmayer](https://github.com/nylki/lindenmayer) as backend.
It renders L-Systems via the *turtle graphic* technique to create procedurally generated geometry.

[![](https://cloud.githubusercontent.com/assets/1710598/18224914/273eab36-71e6-11e6-82a5-826e0f603ea1.jpg)
](http://nylki.github.io/aframe-lsystem-component/)

### Properties

| Property               | Description                                                                                           | Default Value |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | -------       |
| axiom                  | (string) Initiator/initial string/axiom.                                                              | `'F'`           |
| productions             | (string) Productions `from`:`to`. Separate by space. eg: `productions: F:FF X:F+X+F`                                                    | `'F:F'`       |
| iterations             | (int) How many times the productions should be applied                                                         | `1`          |
| angle                  | (number) Degree change to apply for rotation symbols like, `+`, `-`, `>`, `<` etc.                                           | `45.0`        |
| segmentMixins          | (list) For any symbol you want to be rendered, you need to assign them [mixins](https://aframe.io/docs/0.3.0/core/mixins.html) here. Let's say you want F and X to be rendered, then you could write `segmentMixins: F:blue line X:big sphere`. You may define multiple mixins per symbol if you plan to use `!` and `'` in your L-System to increment/decrement the mixin index, which directly relates to your *segmentMixins*. Eg. `F: red line,blue line,green line` with an Axiom `F!F!F` will produce exactly three lines with those colors. Be sure though to actually define mixins you want to use in you assets. Take a look at some of the examples to get a better idea how this works, eg. the [multi-mixin example](https://github.com/nylki/aframe-lsystem-component/blob/master/examples/multiple%20mixins/index.html).  |         |
| scaleFactor            | (number) If you use `!` and `'` in your L-System (see also `segmentMixins` above), this factor controls the size decrease/increase of subsequent segments. | `1.0` |


#### advanced properties
Usually you don't need to touch the following, but in some situations, you might need or want to.

| Property               | Description                                                                                           | Default Value |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | -------       |
| translateAxis          | (string) `'x'`, `'y'` or `'z'`, defines the axis on which to translate along when adding a segment (or moving the *turtle* via lowercase symbols of segments). Changing this to `'x'` is often necessary if you 1:1 copy examples from a textbook. | `'y'`        |
| mergeGeometries        | (boolean) Set false if you want an Object3D per segment. Degrades rendering performance when `false`! | `true`        |

### Usage
A very basic L-System entity could look like:

```.html
<a-entity lsystem="axiom: F; productions: F:F-F++F angle:40 iterations:3 segmentMixins: F:line"></a-entity>
```
Please refer to the examples for some practical usage examples.

If you want to learn more about L-Systems in general, I recommend the [overview article at wikipedia](https://en.wikipedia.org/wiki/L-system).
And if you want to dive deep in, you can read the [Algorithmic Beauty of Plants](http://algorithmicbotany.org/papers/#abop), the classic by Aristid Lindenmayer and Przemyslaw Prusinkiewicz.

In case you are already familiar with L-Systems or turtle graphics,
here is a list of all supported symbols and their interpretation in this component:

- `+` rotates Y around defined angles
- `-` rotates Y around defined -angles
- `&` rotates Z around defined angles
- `^` rotates Z around defined -angles
- `\` rotates X around defined -angles
- `<` rotates X around defined -angles
- `/` rotates X around defined angles
- `>` rotates X around defined angles
- `|` rotates Y around defined 180 degree
- `!` increments segment index (next `segmentMixin` per symbol if defined). Also applies `scaleFactor` to next segments.
- `'` decrements segment index (previous `segmentMixin` per symbol if defined). Also applies 1.0 / `scaleFactor` to next segments.
- `[` starts branch
- `]` ends branch

Besides those *turtle graphic* symbols, you define your own symbols like `F` for drawing actual geometry like lines or flowers.
However if you want your symbol to be rendered, you need to define an entry in `segmentMixins`, like so:

```.html
<a-entity lsystem="axiom: A; productions: A:A+B; segmentMixins: A:line B:blue sphere"></a-entity>
```
Be sure that you define your [mixins](https://aframe.io/docs/0.3.0/core/mixins.html) in your `<a-assets>` at the beginning of your scene.
A fallback geometry and material if you don't define your segmentMixins is not yet implemented, but will be soon :)



It's also possible to use context sensitive productions like:
```.html
<a-entity lsystem="axiom: AABC; productions: A<A>B:A+A segmentMixins: A:line B:small line C:big line"></a-entity>
```

Parametric and stochastic productions are not yet implemented in the component.
Native JS function parsing for productions, as the backend library allows, might added to this
component, but is not yet done.

Please take a look at the examples to get an idea how to use the component. PRs are welcome! :)

#### Browser Installation

Install and use by directly including the [browser files](dist):

```.html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.3.0/aframe.min.js"></script>
  <script src="https://raw.githubusercontent.com/nylki/aframe-lsystem-component/master/dist/aframe-lsystem-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity lsystem="axiom: F+F; productions: F:F-F++F"></a-entity>
  </a-scene>
</body>
```

#### NPM Installation

Install via NPM:

```bash
npm install aframe-lsystem-component
```

Then register and use.

```js
require('aframe');
require('aframe-lsystem-component');
```
