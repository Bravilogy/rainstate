var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React, { Component } from 'react';
import { getState, dispatch, subscribe } from './store';

export var connect = function connect(generateProps) {
  return function (WrappedComponent) {
    var Connected = function (_Component) {
      _inherits(Connected, _Component);

      function Connected() {
        var _temp, _this, _ret;

        _classCallCheck(this, Connected);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.handleChange = function () {
          _this.forceUpdate();
        }, _temp), _possibleConstructorReturn(_this, _ret);
      }

      Connected.prototype.componentDidMount = function componentDidMount() {
        this.unsubscribe = subscribe(this.handleChange);
      };

      Connected.prototype.componentWillUnmount = function componentWillUnmount() {
        this.unsubscribe();
      };

      Connected.prototype.render = function render() {
        var stateProps = generateProps ? generateProps(getState() || {}, dispatch) : {};

        return React.createElement(WrappedComponent, _extends({}, this.props, stateProps));
      };

      return Connected;
    }(Component);

    return Connected;
  };
};