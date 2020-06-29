# Rainstate (experimental)
Having worked on multiple `Clojure` applications using `reagent + re-frame` combination, I decided to create this tiny library to 'feel at home' when working on JavaScript applications.

In my opinion, `Re-frame` is an amazing piece of software and I think JavaScript developers can learn a lot from it.

Rainstate is a tiny library for managing side effects in JavaScript applications. It follows the pub-sub architecture like `Redux`, but with the additional effects layer like `Re-frame`.

## Install
```js
yarn add https://github.com/Bravilogy/rainstate.git
```

## Effects
Effects determine what will happen when a specific event is dispatched. For example, an effect can be `state update`, `http call` or any other side effect, that will take place in application.

## Events
Events are like actions in `Redux`, but their handlers return simple objects that represent effects mentioned above. You may register as many effects and events as you need. There are 3 different functions to register events in `rainstate` - `registerEvent`, `registerEvents` and `registerStateEvent`.

Because event handlers return simple objects, they are pure functions that receive current state (and any other arguments passed during `dispatch`) and return simple objects.

Here is a basic usage of each of these functions:

```js
import { registerEvent, registerEvents, registerStateEvent } from 'rainstate';

// 1. registerEvent
const someEvent = (state) => ({
  state: {
    ...state,
    message: 'hello world'
  },
});

registerEvent('someEvent', someEvent);



// 2. registerEvents is just a convenience function and the above can be written as
registerEvents({ someEvent });



// 3. 
const someEvent = (state) => ({ message: 'hello world' });

registerStateEvent('someEvent', someEvent);
```
In the first example, a handler returns an object that has `state` as a key. Here, `state` is an effect. It can also include any number of other effects. And because javascript applications usually have more state events than any other types, `registerStateEvent` is just a helper function that nests whatever is returned from the handler, under a `state` key behind the scenes.

Rainstate also exposes a few other functions.

### getState
This function simply returns the current state.

### subscribe
This function accepts a handler and adds that handler to an array of subcriptions. These subscriptions will be called every time an event is dispatched and each subscription will receive current state in the argument.

### dispatch
Dispatches registered events. It accepts `n` number of arguments that will be passed down to the event handler.

### registerEffect
Registers custom effects. Please note that `registerEffect` will overwrite already registered effects, except `state` effect.

## Simple example
Here we're setting an initial state of our application.
```js
import { subscribe, registerStateEvent, dispatch } from 'rainstate';

subscribe(console.log);

registerStateEvent('initializeApplication', () => ({
  message: 'hello world',
}));

dispatch('initializeApplication');
```

## Simple example with http call
Rainstate comes with `http` effect which uses `fetch API`. If you would like to use any alternatives, you can overwrite it by registerring an effect yourself.
```js
import { subscribe, registerEvents, dispatch } from 'rainstate';

subscribe(console.log);

const getUser = (state, id) => ({
  state: {
    ...state,
    isFetching: true,
  },
  http: {
    uri: `https://jsonplaceholder.typicode.com/users/${id}`,
    onSuccess: 'getUserSuccess',
    onFailure: 'getUserFailure',
  },
});

const getUserSuccess = (state, user) => ({
  state: {
    ...state,
    isFetching: false,
    user,
  },
});

const getUserFailure = state => ({ ... });

registerEvents({ getUser, getUserSuccess, getUserFailure });

dispatch('getUser', 1);
```

An object that `http` effect accepts, is passed down to the `fetch API`, so any additional properties you might want to add, will be passed down to its config. i.e. headers and etc.
```js
http: {
  uri: 'https://jsonplaceholder.typicode.com/users',
  headers: {
    'Content-Type': 'application/json',
  },
},
```

Sometimes you might want to pass additional parameters to `success` or `failure` callback events. This can be done by passing an array as an event to `onSuccess` or `onFailure`:

```js
http: {
  uri: 'https://jsonplaceholder.typicode.com/users',
  onSuccess: ['getUserSuccess', 'hello there', 123],
},
```
and the `getUserSuccess` event handler will receive these parameters AND the actual response as a very last argument:
```js
const getUserSuccess = (state, arg1, arg2, response) => ({ ... });
```

`Rainstate` comes with two other effects - `dispatch` and `dispatchN`. These are useful if you would like to dispatch other events from an event:

```js
registerEvent('getUserSuccess', (state, user) => ({
  dispatch: 'showModal',
  dispatchN: [
    ['gotUser', user],
    'someOtherEvent',
    user.id === 1 && 'showSuccessMessage',
  ],
}))
```

Both - `dispatch` and `dispatchN` can handle either `strings` or `arrays` as events. i.e. `'showMessage'`, `['showUserDetails', user]`. 

And finally, `dispatchN` must receive an array of events, where there can be falsey values too. This is useful when you want to conditionally call events.
```js
  dispatchN: [
    ['gotUser', user],
    'someOtherEvent',
    false,
    null,
    undefined,
    user.id === 1 && 'showSuccessMessage',
  ],
```

## Simple registerEffect example
```js
import { dispatch, subscribe, registerEffect, registerEvent } from 'rainstate';

subscribe(console.log);

registerEffect('alert', message => alert(message));

registerEvent('showAlert', (_, message) => ({
  alert: message,
}));

dispatch('showAlert', 'hello world');
```

## Integrating with React
`Rainstate` comes with a very basic `connect` function (similar to `react-redux`).

```js
// store.js

import { registerStateEvent } from 'rainstate';

registerStateEvent('showMessage', (state) => ({
  message: 'hello world',
}));

// somewhere in your entry file import the file above
import './store';

// App.js
import { connect } from 'rainstate';
import React from 'react';

const App = ({ showMessage, message }) => (
  <div>
    <button onClick={showMessage}>Show message</button>
    {message && <h3>{message}</h3>}
  </div>
);

const generateProps = (state, dispatch) => ({
  message: state.message,
  showMessage: () => dispatch('showMessage'),
});

export default connect(generateProps)(App);
```

**Note** - `generateProps` will receive the current state as a first argument and `dispatch` function as a second.

## License
MIT
