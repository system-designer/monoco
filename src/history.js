/*
 * System Runtime
 *
 * https://designfirst.io/systemruntime/
 *
 * Copyright 2020 Erwan Carriou
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @module history
 * @requires db
 * @description This module manages the history of all components lifecycle
 */

'use strict';

var $db = require('./db.js');

/* Private property */

var stack = [];
var cursorIndex = -1;

/* Private methods */

/* Public methods */

/**
 * @method pushState
 * @param {Object} state new state
 * @description Add a state in the history
 */
exports.pushState = function pushState(state) {
  stack.push(state);
};

/**
 * @method state
 * @returns {Object} current state
 * @description get Current state
 */
exports.state = function state() {
  return state[state.length - 1];
};

/**
 * @method back
 * @returns {Integer} current cursor index
 * @description move backward into the history of state
 */
exports.back = function back() {
  var state = stack[cursorIndex];
  if (state) {
    switch (state.action) {
      case 'insert':
        $db[state.collection].remove({
          _id: state.id
        });
        break;
      case 'remove':
        $db[state.collection].insert(JSON.parse(state.oldValue));
        break;
      case 'update':
        $db[state.collection].update(
          {
            _id: state.id
          },
          JSON.parse(state.oldValue)
        );
        break;
      default:
        break;
    }
    cursorIndex = cursorIndex - 1;
  }

  return cursorIndex;
};

/**
 * @method forward
 * @returns {Integer} current cursor index
 * @description move forward into the history of state
 */
exports.forward = function forward() {
  cursorIndex = cursorIndex + 1;
  var state = stack[cursorIndex];
  if (state) {
    switch (state.action) {
      case 'insert':
        $db[state.collection].insert(JSON.parse(state.value));
        break;
      case 'remove':
        $db[state.collection].remove({
          _id: state.id
        });
        break;
      case 'update':
        $db[state.collection].update(
          {
            _id: state.id
          },
          JSON.parse(state.value)
        );
        break;
      default:
        break;
    }
  }

  return cursorIndex;
};

/**
 * @method get
 * @param {}
 * @description Start back/forward from state
 */
exports.get = function get(index) {
  var result = null;
  if (index === -1) {
    result = stack[stack.length - 1];
  } else {
    cursorIndex = stack[index];
  }
  return result;
};

/**
 * @method from
 * @param {Number} index index of the stack
 * @description Start back/forward from state
 */
exports.from = function from(index) {
  if (index === -1) {
    cursorIndex = stack.length - 1;
  } else {
    cursorIndex = index;
  }
};

/**
 * @method dump
 * @returns {String} a dump of the history
 * @description Dump all the history
 */
exports.dump = function dump() {
  return JSON.stringify(stack);
};

/**
 * @method load
 * @param {Object} dump dump of an history to load
 * @returns {Boolean} true if the dump was loaded with no error
 * @description Load a dump of an history
 */
exports.load = function load(dump) {
  var newDump = JSON.parse(dump);
  var noError = true;

  newDump.forEach(function(state) {
    if (state) {
      switch (state.action) {
        case 'insert':
          if ($db[state.collection]) {
            $db[state.collection].insert(JSON.parse(state.value));
          } else {
            noError = false;
          }
          break;
        case 'remove':
          if ($db[state.collection]) {
            $db[state.collection].remove({
              _id: state.id
            });
          } else {
            noError = false;
          }
          break;
        case 'update':
          if ($db[state.collection]) {
            $db[state.collection].update(
              {
                _id: state.id
              },
              JSON.parse(state.value)
            );
          } else {
            noError = false;
          }
          break;
        default:
          break;
      }
    }
  });

  return noError;
};

/**
 * @method clear
 * @description Remove all the states from the memory
 */
exports.clear = function clear() {
  stack = [];
};