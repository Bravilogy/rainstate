const { isArray } = Array;

const makeStateManager = () => {
  let state;

  return {
    update: newValue => {
      state = newValue;
    },
    getState: () => state,
  };
};

const validateString = thing => {
  if (typeof thing !== 'string') {
    throw new Error(`Expected string and got ${thing}`);
  }
};

const events = {};
const effects = {};
const subscriptions = [];

const stateManager = makeStateManager();

export const registerEvent = (type, handler) => {
  validateString(type);

  if (events[type]) {
    console.warn(`An event '${type}' has already been registered, overwriting.`);
  }

  events[type] = handler;
};

export const registerStateEvent = (type, handler) => {
  const handlerWrapper = (...params) => {
    return {
      state: handler(...params)
    };
  };

  registerEvent(type, handlerWrapper);
};

export const registerEvents = eventsMap => {
  Object.keys(eventsMap).forEach(event => {
    const eventHandler = eventsMap[event];

    if (typeof eventHandler === 'function') {
      registerEvent(event, eventHandler);
    }
  });
};

export const registerEffect = (type, handler) => {
  validateString(type);

  if (type === 'state' && effects[type]) {
    throw new Error(`Cannot override the default 'state' effect.`);
  }

  effects[type] = handler;
};

export const dispatch = (type, ...params) => {
  if (events[type]) {
    const eventHandler = events[type];

    const actionsMap = eventHandler(stateManager.getState(), ...params);

    Object.keys(actionsMap).forEach(effect => {
      if (effects[effect]) {
        const effectHandler = effects[effect];
        effectHandler(actionsMap[effect]);
      }
    });
  }

  subscriptions.forEach(sub => {
    sub(stateManager.getState());
  });
};

export const subscribe = (handler) => {
  if (typeof handler !== 'function') {
    throw new Error('Subscription handler has to be a function.');
  }

  subscriptions.push(handler);

  const idx = subscriptions.indexOf(handler);

  return () => subscriptions.splice(idx, 1);
};

export const getState = stateManager.getState;


/* Handle string and array events */
const dispatchEffect = event => {
  if (isArray(event)) {
    return dispatch(...event);
  }

  return dispatch(event);
};

/* Parse onSuccess and onFailure handlers */
const parseHandler = evt => {
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
registerEffect('state', newValue => stateManager.update(newValue));

registerEffect('dispatch', dispatchEffect);

registerEffect('dispatchN', events => {
  if (!isArray(events)) {
    throw new Error('dispatchN expects an array of events, where each event is either a String or an Array');
  }

  events.filter(x => !!x).forEach(dispatchEffect);
});

registerEffect('http', config => {
  const {
    method = 'get',
    onFailure,
    onSuccess,
    uri,
    ...requestObj,
  } = config;

  const allowedMethods = ['get', 'post', 'delete', 'put', 'patch'];

  if (typeof uri !== 'string') {
    throw new Error('Please make sure that the uri is a string');
  }

  if (!allowedMethods.includes(method.toLowerCase())) {
    throw new Error(`Could not figure out how to handle a '${method}' method`);
  }

  const [successEvent, ...successParams] = parseHandler(onSuccess);
  const [failureEvent, ...failureParams] = parseHandler(onFailure);

  fetch(uri, { method, ...requestObj })
    .then(res => res.json())
    .then(response =>
      successEvent ? dispatch(successEvent, ...successParams, response) : response)
    .catch(err =>
      failureEvent ? dispatch(failureEvent, ...failureParams, err) : err);
});
