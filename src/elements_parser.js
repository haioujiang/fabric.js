fabric.ElementsParser = function(elements, callback, options, reviver, parsingOptions) {
  this.elements = elements;
  this.callback = callback;
  this.options = options;
  this.reviver = reviver;
  this.svgUid = (options && options.svgUid) || 0;
  this.parsingOptions = parsingOptions;
};

fabric.ElementsParser.prototype.parse = function() {
  this.instances = new Array(this.elements.length);
  this.numElements = this.elements.length;

  this.createObjects();
};

fabric.ElementsParser.prototype.createObjects = function() {
  for (var i = 0, len = this.elements.length; i < len; i++) {
    this.elements[i].setAttribute('svgUid', this.svgUid);
    (function(_obj, i) {
      setTimeout(function() {
        _obj.createObject(_obj.elements[i], i);
      }, 0);
    })(this, i);
  }
};

fabric.ElementsParser.prototype.createObject = function(el, index) {
  var klass = fabric[fabric.util.string.capitalize(el.tagName.replace('svg:', ''))];
  if (klass && klass.fromElement) {
    try {
      this._createObject(klass, el, index);
    }
    catch (err) {
      fabric.log(err);
    }
  }
  else {
    this.checkIfDone();
  }
};

fabric.ElementsParser.prototype._createObject = function(klass, el, index) {
  klass.fromElement(el, this.createCallback(index, el), this.options);
};

fabric.ElementsParser.prototype.createCallback = function(index, el) {
  var _this = this;
  return function(obj) {
    var _options;
    _this.resolveGradient(obj, 'fill');
    _this.resolveGradient(obj, 'stroke');
    if (obj instanceof fabric.Image) {
      _options = obj.parsePreserveAspectRatioAttribute(el);
    }
    obj._removeTransformMatrix(_options);
    _this.reviver && _this.reviver(el, obj);
    _this.instances[index] = obj;
    _this.checkIfDone();
  };
};

fabric.ElementsParser.prototype.resolveGradient = function(obj, property) {

  var instanceFillValue = obj.get(property);
  if (!(/^url\(/).test(instanceFillValue)) {
    return;
  }
  var gradientId = instanceFillValue.slice(5, instanceFillValue.length - 1);
  if (fabric.gradientDefs[this.svgUid][gradientId]) {
    obj.set(property,
      fabric.Gradient.fromElement(fabric.gradientDefs[this.svgUid][gradientId], obj));
  }
};

fabric.ElementsParser.prototype.checkIfDone = function() {
  if (--this.numElements === 0) {
    this.instances = this.instances.filter(function(el) {
      // eslint-disable-next-line no-eq-null, eqeqeq
      return el != null;
    });
    this.callback(this.instances, this.elements);
  }
};
