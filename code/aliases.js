//Get an element by its ID, alias
let get = (id) => document.getElementById(id);
let getByClass = (classname) => document.getElementsByClassName(classname);
//Get bounding rectangle, alias
let rect = (e) => e.getBoundingClientRect();
//Create an element, alias
let make = (type) => document.createElement(type);
/**
 * 
 * @param {Object} elem 
 * @param {*} type 
 * @param {callback} callback 
 * @param {object} options 
 */
let on = (elem, type, callback, options) => elem.addEventListener(type, callback, options);

module.exports = {get, getByClass, rect, make, on};
