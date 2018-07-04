import React, { Component } from 'react';
import { getState, dispatch, subscribe } from './store';

export const connect = (generateProps) => {
  return WrappedComponent => {
    class Connected extends Component {
      componentDidMount() {
        this.unsubscribe = subscribe(this.handleChange);
      };

      componentWillUnmount() {
        this.unsubscribe();
      }

      handleChange = () => {
        this.forceUpdate();
      };

      render() {
        let stateProps = generateProps ? generateProps(getState() || {}, dispatch) : {};

        return (
          <WrappedComponent {...this.props} {...stateProps} />
        );
      }
    }

    return Connected;
  };
};
