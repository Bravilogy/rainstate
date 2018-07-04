var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var events = {};
var effects = {};
var subscriptions = [];

var makeStateManager = function makeStateManager() {
  var state = void 0;

  return {
    update: function update(newValue) {
      state = newValue;
    },
    getState: function getState() {
      return state;
    }
  };
};

var stateManager = makeStateManager();

var validateString = function validateString(thing) {
  if (typeof thing !== 'string') {
    throw new Error('Expected string and got ' + thing);
  }
};

export var registerEvent = function registerEvent(type, handler) {
  validateString(type);

  if (events[type]) {
    console.warn('An event called ' + type + ' has already been registered.');
    return;
  }

  events[type] = handler;
};

export var registerEffect = function registerEffect(type, handler) {
  validateString(type);

  if (effects[type]) {
    console.warn('An effect called ' + type + ' has already been registered.');
    return;
  }

  effects[type] = handler;
};

export var dispatch = function dispatch(type) {
  for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    params[_key - 1] = arguments[_key];
  }

  if (events[type]) {
    var eventHandler = events[type];

    var actionsMap = eventHandler.apply(undefined, [stateManager.getState()].concat(params));

    Object.keys(actionsMap).forEach(function (effect) {
      if (effects[effect]) {
        var effectHandler = effects[effect];
        effectHandler(actionsMap[effect]);
      }
    });
  }

  subscriptions.forEach(function (sub) {
    sub(stateManager.getState());
  });
};

export var subscribe = function subscribe(handler) {
  if (typeof handler !== 'function') {
    throw new Error('Subscription handler has to be a function.');
  }

  subscriptions.push(handler);

  var idx = subscriptions.indexOf(handler);

  return function () {
    return subscriptions.splice(idx, 1);
  };
};

export var getState = stateManager.getState;

/* register a few default effects */
registerEffect('state', function (newValue) {
  return stateManager.update(newValue);
});

var parseHandler = function parseHandler(evt) {
  if (typeof evt === 'string') {
    return [evt];
  }

  if (!Array.isArray(evt)) {
    throw new Error('onSuccess and onFailure can only be either strings or arrays.');
  }

  return evt;
};

registerEffect('http', function (config) {
  var uri = config.uri,
      method = config.method,
      onSuccess = config.onSuccess,
      onFailure = config.onFailure,
      requestObj = _objectWithoutProperties(config, ['uri', 'method', 'onSuccess', 'onFailure']);

  var allowedMethods = ['get', 'post', 'delete', 'put', 'patch'];

  if (typeof uri !== 'string') {
    throw new Error('Please make sure that the uri is a string');
  }

  if (!allowedMethods.includes(method.toLowerCase())) {
    throw new Error('Could not figure out how to handle a \'' + method + '\' method');
  }

  var _parseHandler = parseHandler(onSuccess),
      successEvent = _parseHandler[0],
      successParams = _parseHandler.slice(1);

  var _parseHandler2 = parseHandler(onFailure),
      failureEvent = _parseHandler2[0],
      failureParams = _parseHandler2.slice(1);

  fetch(uri, _extends({ method: method }, requestObj)).then(function (res) {
    return res.json();
  }).then(function (response) {
    return dispatch.apply(undefined, [successEvent].concat(successParams, [response]));
  }).catch(function (err) {
    return dispatch.apply(undefined, [failureEvent].concat(failureParams, [err]));
  });
});