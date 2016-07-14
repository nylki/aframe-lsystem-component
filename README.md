## Under Work
Not ready yet, ETA mid-July! :)

## aframe-lsystem-component

A L-System component for [A-Frame](https://aframe.io) which use the L-System library [lindenmayer](https://github.com/nylki/lindenmayer) in the background.
It renders L-Systems via the *turtle graphic* technique.

### Properties

| Property               | Description                                                                                           | Default Value |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | -------       |
| axiom                  | (string) Initiator/initial string/axiom.                                                              | 'F'           |
| production             | (string) Productions from->to. Separate by space.                                                     | 'F->F'       |
| iterations             | (int) Set the initiator/initial string/axiom.                                                         | `1 `          |
| angle                  | (number) Angle/rotation in degree to apply rotation symbols.                                          | `45.0`        |
| mergeGeometries        | (boolean) Set false if you want an Object3D per segment. Degrades rendering performance when `false`! | `true`        |
| segmentMixins          | (list) For each symbol you can define its appearance with a mixin you have defined in your `a-assets`. Eg. `F:blue line, X:big sphere`. You can also define multiple mixins per symbol ifyou plan to use `!` and `'` in your L-System to increment/decrement the color index, which directly relates to your segmentMixins. Eg. `F: red line,blue line,green line` with an Axiom `F!F!F` will produce exactly three lines with those colors.  |         |


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
- `!` increments color index (next `segmentMixin` per symbol if defined) reduce scale by 1/3
- `'` decrements color index (previous `segmentMixin` per symbol if defined) increase scale by 1/3
- `[` starts branch
- `]` ends branch

Besides those *turtle graphic* symbols, you define your own symbols like `F` for drawing actual geometry like lines or flowers.
However if you want your symbol to be rendered, you need to define an entry in `segmentMixins`, like so:

```.html
<a-entity lsystem="axiom: A; productions: A:A+B; segmentMixins: A:line,B:blue sphere"></a-entity>
```
Be sure that you define your [mixins](https://aframe.io/docs/0.2.0/core/mixins.html) in your `<a-assets>` at the beginning of your scene.
A fallback geometry and material if you don't define your segmentMixins is not yet implemented, but will be soon :)



It's also possible to use context sensitive productions like:
```.html
<a-entity lsystem="axiom: AABC; productions: A<A>B:A+A"></a-entity>
```

Parametric and stochastic productions are not yet implemented in the component.
Native JS function parsing for productions, as the backend library allows, might added to this
component, but is not yet done.

#### Browser Installation

Install and use by directly including the [browser files](dist):

```.html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.2.0/aframe.min.js"></script>
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
npm install aframe-example-component
```

Then register and use.

```js
require('aframe');
require('aframe-lsystem-component');
```
