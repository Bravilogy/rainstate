const events = {};
const effects = {};
const subscriptions = [];

const makeStateManager = () => {
  let state;

  return {
    update: newValue => {
      state = newValue;
    },
    getState: () => state,
  };
};

const stateManager = makeStateManager();

const validateString = thing => {
  if (typeof thing !== 'string') {
    throw new Error(`Expected string and got ${thing}`);
  }
};

export const registerEvent = (type, handler) => {
  validateString(type);

  if (events[type]) {
    console.warn(`An event called ${type} has already been registered.`);
    return;
  }

  events[type] = handler;
};

export const registerEffect = (type, handler) => {
  validateString(type);

  if (effects[type]) {
    console.warn(`An effect called ${type} has already been registered.`);
    return;
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


/* register a few default effects */
registerEffect('state', newValue => stateManager.update(newValue));

const parseHandler = evt => {
  if (typeof evt === 'string') {
    return [evt];
  }

  if (!Array.isArray(evt)) {
    throw new Error('onSuccess and onFailure can only be either strings or arrays.');
  }

  return evt;
};

registerEffect('http', config => {
  const {
    uri,
    method,
    onSuccess,
    onFailure,
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
    .then(response => dispatch(successEvent, ...successParams, response))
    .catch(err => dispatch(failureEvent, ...failureParams, err));
});
