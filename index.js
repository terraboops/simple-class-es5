/* Simple JavaScript Inheritance for ES 5.1
 * based on http://ejohn.org/blog/simple-javascript-inheritance/
 *  (inspired by base2 and Prototype)
 * MIT Licensed.
 */
(function() {
  "use strict";
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // ES5 15.2.3.5
  // http://es5.github.com/#x15.2.3.5
  if (!Object.create) {

      // Contributed by Brandon Benvie, October, 2012
      var createEmpty;
      var supportsProto = !({__proto__:null} instanceof Object);
                          // the following produces false positives
                          // in Opera Mini => not a reliable check
                          // Object.prototype.__proto__ === null
      if (supportsProto || typeof document === 'undefined') {
          createEmpty = function () {
              return { '__proto__': null };
          };
      } else {
          // In old IE __proto__ can't be used to manually set `null`, nor does
          // any other method exist to make an object that inherits from nothing,
          // aside from Object.prototype itself. Instead, create a new global
          // object and *steal* its Object.prototype and strip it bare. This is
          // used as the prototype to create nullary objects.
          createEmpty = function () {
              var iframe = document.createElement('iframe');
              var parent = document.body || document.documentElement;
              iframe.style.display = 'none';
              parent.appendChild(iframe);
              iframe.src = 'javascript:';
              var empty = iframe.contentWindow.Object.prototype;
              parent.removeChild(iframe);
              iframe = null;
              delete empty.constructor;
              delete empty.hasOwnProperty;
              delete empty.propertyIsEnumerable;
              delete empty.isPrototypeOf;
              delete empty.toLocaleString;
              delete empty.toString;
              delete empty.valueOf;
              empty.__proto__ = null;

              function Empty() {}
              Empty.prototype = empty;
              // short-circuit future calls
              createEmpty = function () {
                  return new Empty();
              };
              return new Empty();
          };
      }

      Object.create = function create(prototype, properties) {

          var object;
          function Type() {}  // An empty constructor.

          if (prototype === null) {
              object = createEmpty();
          } else {
              if (typeof prototype !== 'object' && typeof prototype !== 'function') {
                  // In the native implementation `parent` can be `null`
                  // OR *any* `instanceof Object`  (Object|Function|Array|RegExp|etc)
                  // Use `typeof` tho, b/c in old IE, DOM elements are not `instanceof Object`
                  // like they are in modern browsers. Using `Object.create` on DOM elements
                  // is...err...probably inappropriate, but the native version allows for it.
                  throw new TypeError('Object prototype may only be an Object or null'); // same msg as Chrome
              }
              Type.prototype = prototype;
              object = new Type();
              // IE has no built-in implementation of `Object.getPrototypeOf`
              // neither `__proto__`, but this manually setting `__proto__` will
              // guarantee that `Object.getPrototypeOf` will work as expected with
              // objects created using `Object.create`
              object.__proto__ = prototype;
          }

          if (properties !== void 0) {
              Object.defineProperties(object, properties);
          }

          return object;
      };
  }

  // The base Class implementation (does nothing)
  function BaseClass(){}

  // Create a new Class that inherits from this class
  BaseClass.extend = function(props) {
    var _super = this.prototype;

    // Set up the prototype to inherit from the base class
    // (but without running the init constructor)
    var proto = Object.create(_super);

    // Copy the properties over onto the new prototype
    for (var name in props) {
      // Check if we're overwriting an existing function
      proto[name] = typeof props[name] === "function" &&
        typeof _super[name] == "function" && fnTest.test(props[name])
        ? (function(name, fn){
            return function() {
              var tmp = this._super;

              // Add a new ._super() method that is the same method
              // but on the super-class
              this._super = _super[name];

              // The method only need to be bound temporarily, so we
              // remove it when we're done executing
              var ret = fn.apply(this, arguments);
              this._super = tmp;

              return ret;
            };
          })(name, props[name])
        : props[name];
    }

    // The new constructor
    var newClass = typeof proto.init === "function"
      ? proto.hasOwnProperty("init")
        ? proto.init // All construction is actually done in the init method
        : function SubClass(){ _super.init.apply(this, arguments); }
      : function EmptyClass(){};

    // Populate our constructed prototype object
    newClass.prototype = proto;

    // Enforce the constructor to be what we expect
    proto.constructor = newClass;

    // And make this class extendable
    newClass.extend = BaseClass.extend;

    return newClass;
  };

  if (typeof exports === 'object') {
    // CommonJS support
    module.exports = BaseClass;
  } else if (typeof define === 'function' && define.amd) {
    // support AMD
    define(function() { return BaseClass; });
  } else {
    // support browser
    window.Class = BaseClass;
  }

})();