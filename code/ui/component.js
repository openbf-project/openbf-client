
const { on, off, make, rect } = require("../utils/aliases.js");

/**WHO NEEDS LIBRARIES, BUWAHAHAHAHA
 * No but really, this is making life a lot nicer rn
 * This class is to make the UI creation/design process less of a pain
 * @author Jonathan Crowder
 */
module.exports = class Component {
  constructor() {
    /**@type {HTMLElement} Element responsible for the visual display*/
    this.element;
  }
  /**Mounts the component to a parent HTML element
   * @param {Component|HTMLElement} parent to mount to
   * @returns {Component} self
   */
  mount(parent) {
    if (parent instanceof HTMLElement) {
      parent.appendChild(this.element);
    } else if (parent instanceof Component) {
      parent.element.appendChild(this.element);
    } else {
      throw "Cannot append to parent because its not a Component or HTMLElement";
    }
    return this;
  }

  mountChild (child) {
    if (child instanceof HTMLElement) {
      this.element.appendChild(child);
    } else if (child instanceof Component) {
      this.element.appendChild(child.element);
    } else {
      throw "Cannot append child because its not a Component or HTMLElement";
    }
    return this;
  }

  /**Listen to events on this componenet's element
   * @param {string} type 
   * @param {callback} callback
   * @callback callback
   * @param {Event}
   * @returns {Component} self
   */
  on(type, callback) {
    on(this.element, type, callback);
    return this;
  }

  /**Stop listening to an event on this componenet's element
   * @param {string} type 
   * @param {callback} callback
   * @callback callback
   * @param {Event}
   * @returns {Component} self
   */
  off(type, callback) {
    off(this.element, type, callback);
    return this;
  }

  /**Set the element id
   * @param {string} str
   * @returns {Component} self
   */
  id (str) {
    this.element.id = str;
    return this;
  }

  /**Add CSS classes
   * @param  {...string} classnames
   * @returns {Component} self
   */
  addClasses (...classnames) {
    this.element.classList.add(...classnames);
    return this;
  }
  /**Remove CSS classes
   * @param  {...string} classnames
   * @returns {Component} self
   */
  removeClasses (...classnames) {
    this.element.classList.remove(...classnames);
  }

  /**Make the element of this component a type of HTMLElement
   * @param {string} type of HTML element
   * @returns {Component} self
   */
  make(type) {
    this.element = make(type);
    return this;
  }

  /**@param {HTMLElement} element use a native element instead of creating one*/
  useNative(element) {
    if (!element) throw "Element cannot be " + typeof(element);
    if (!element instanceof HTMLElement) throw "Element isn't an HTMLElement!";
    this.element = element;
    return this;
  }

  textContent (str) {
    this.element.textContent = str;
    return this;
  }

  hide () {
    this.addClasses("hide");
    return this;
  }
  show () {
    this.removeClasses("hide");
    return this;
  }
  set left (x) {
    this.element.style.left = x;
  }

  set top (y) {
    this.element.style.top = y;
  }

  /**@returns {DOMRect} The calculated DOMRect of the component*/
  get rect () {
    return rect(this.element);
  }

  /**@param {string} type of input.type*/
  type (t) {
    if (!this.element instanceof HTMLInputElement) throw "type is meant to be set when the element is an HTMLInputElement";
    this.element.type = t;
    return this;
  }

  removeChildren () {
    while (this.element.lastChild) {
      this.element.lastChild.remove();
    }
  }

  backgroundImage (url) {
    this.element.style["background-image"] = `url(${url})`;
    return this;
  }
}
