## Under Work
Not ready yet, ETA mid-July! :)

## aframe-lsystem-component

A L-System component for [A-Frame](https://aframe.io) which use the L-System library [lindenmayer](https://github.com/nylki/lindenmayer) in the background.


### Properties

| Property               | Description                                                                                           | Default Value |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | -------       |
| axiom                  | (string) Initiator/initial string/axiom.                                                              | 'F'           |
| production             | (string) Productions from->to. Separate by space.                                                     | 'F->FF'       |
| iterations             | (int) Set the initiator/initial string/axiom.                                                         | `1 `          |
| angle                  | (number) Angle/rotation in degree to apply rotation symbols.                                          | `45.0`        |
| functionsInProductions | (boolean) Set true to enable parsing of native JS functions.                                          | `false`       |
| mergeGeometries        | (boolean) Set false if you want an Object3D per segment. Degrades rendering performance when `false`! | `true`        |


### Usage

#### Browser Installation

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.2.0/aframe.min.js"></script>
  <script src="https://raw.githubusercontent.com/nylki/aframe-lsystem-component/master/dist/aframe-lsystem-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity lsystem="axiom: F+F; productions: F->F-F++F"></a-entity>
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
