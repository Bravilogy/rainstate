import React, { Component } from 'react';
import { getState, dispatch, subscribe } from './store';

export const connect = generateProps => {
  return Wrapped => {
    class Connected extends Component {
      componentDidMount() {
        this.unsubscribe = subscribe(this.handleUpdate);
      }

      componentWillUnmount() {
        this.unsubscribe();
      }

      handleUpdate = () => {
        this.forceUpdate();
      };

      render() {
        const stateProps = generateProps
          ? generateProps(getState() || {}, dispatch)
          : {};

        return <Wrapped {...this.props} {...stateProps} />;
      }
    }

    return Connected;
  };
};
