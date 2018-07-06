var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var isArray = Array.isArray;


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

var validateString = function validateString(thing) {
  if (typeof thing !== 'string') {
    throw new Error('Expected string and got ' + thing);
  }
};

var events = {};
var effects = {};
var subscriptions = [];

var stateManager = makeStateManager();

export var registerEvent = function registerEvent(type, handler) {
  validateString(type);

  if (events[type]) {
    console.warn('An event \'' + type + '\' has already been registered, overwriting.');
  }

  events[type] = handler;
};

export var registerStateEvent = function registerStateEvent(type, handler) {
  var handlerWrapper = function handlerWrapper() {
    return {
      state: handler.apply(undefined, arguments)
    };
  };

  registerEvent(type, handlerWrapper);
};

export var registerEvents = function registerEvents(eventsMap) {
  Object.keys(eventsMap).forEach(function (event) {
    var eventHandler = eventsMap[event];

    if (typeof eventHandler === 'function') {
      registerEvent(event, eventHandler);
    }
  });
};

export var registerEffect = function registerEffect(type, handler) {
  validateString(type);

  if (type === 'state' && effects[type]) {
    throw new Error('Cannot override the default \'state\' effect.');
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

/* Handle string and array events */
var dispatchEffect = function dispatchEffect(event) {
  if (isArray(event)) {
    return dispatch.apply(undefined, event);
  }

  return dispatch(event);
};

/* Parse onSuccess and onFailure handlers */
var parseHandler = function parseHandler(evt) {
  if (!event) return [];

  if (typeof evt === 'string') {
    return [evt];
  }

  if (!isArray(evt)) {
    throw new Error('onSuccess and onFailure can only be either strings or arrays.');
  }

  return evt;
};

/* ------------------------------
   Register a few default effects

   1. state     - an effect to update the state
   2. dispatch  - an effect to dispatch another event from an event
   3. dispatchN - an effect to dispatch multiple events from an event.
                  It will filter and remove any falsey values. This allows
                  the user to pass conditional events list.
                  i.e. [['getUser', 1], null, 'getTasks']
   4. http      - an effect to make http calls. By default it will use fetch api
                  but it can be overwritten by registerring another http effect.
                  This effect accepts a default fetch request object with a few additional
                  properties - onFailure, onSuccess, uri. These properties will be used by
                  the effect itself and the rest will be passed down to browser's fetch.

                  The method will default to get request.
   ------------------------------ */
registerEffect('state', function (newValue) {
  return stateManager.update(newValue);
});

registerEffect('dispatch', dispatchEffect);

registerEffect('dispatchN', function (events) {
  if (!isArray(events)) {
    throw new Error('dispatchN expects an array of events, where each event is either a String or an Array');
  }

  events.filter(function (x) {
    return !!x;
  }).forEach(dispatchEffect);
});

registerEffect('http', function (config) {
  var _config$method = config.method,
      method = _config$method === undefined ? 'get' : _config$method,
      onFailure = config.onFailure,
      onSuccess = config.onSuccess,
      uri = config.uri,
      requestObj = _objectWithoutProperties(config, ['method', 'onFailure', 'onSuccess', 'uri']);

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
    return successEvent ? dispatch.apply(undefined, [successEvent].concat(successParams, [response])) : response;
  }).catch(function (err) {
    return failureEvent ? dispatch.apply(undefined, [failureEvent].concat(failureParams, [err])) : err;
  });
});