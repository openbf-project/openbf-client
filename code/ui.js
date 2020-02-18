
/**Alias for document.createElement
 * @param {String} type of element to create
 * @param {ElementCreationOptions} options
 * @returns {HTMLElement}
 */
function make (type, options) {
  return document.createElement(type, options);
}
module.exports.make = make;

/**Alias for element.addEventListener
 * @param {HTMLElement} element 
 * @param {String} type 
 * @param {EventListenerOrEventListenerObject} callback 
 * @param {boolean | AddEventListenerOptions} options 
 */
function on (element, type, callback, options) {
  element.addEventListener(type, callback, options);
}
module.exports.on = on;

/**Alias for document.getElementById
 * @param {String} id of html element
 * @returns {HTMLElement}
 */
function get (id) {
  return document.getElementById(id);
}
module.exports.get = get;

class UIManager {
  constructor (root) {
    this.root = root;
  }

  /**Add a component to the root panel
   * @param {UIComponent} component to add
   * @returns {UIComponent} for chaining
   */
  add (component) {
    component.mount(this.root);
    //this.root.appendChild(component);
    return component;
  }
}
module.exports.UIManager = UIManager;

class UIComponent {
  /**@param {HTMLElement} element 
   */
  constructor (element) {
    this.element = element;
    this.element.reference = this;
    this.element.classList.add("ui");
  }

  /**Mount a UI component to another or an HTMLElement
   * @param {UIComponent|HTMLElement} parent to mount to
   * @returns {UIComponent|null} parent if any (won't return HTMLElement)
   */
  mount (parent) {
    if (parent instanceof HTMLElement) {
      parent.appendChild(this.element);
      return null;
    } else {
      parent.element.appendChild(this.element);
      return parent;
    }
  }

  /**Unmounts this element from its parent
   * @returns {UIComponent|HTMLElement}
   */
  unmount () {
    let p = this.element.parentElement;
    this.element.remove();
    return p;
  }

  /**Get the parent UI component if there is one
   * @returns {UIComponent}
   */
  get parent () {
    return this.element.parentElement.reference;
  }

  /**Add an event listener to this component
   * @param {String} type see <HTMLElement>.addEventListener for types
   * @param {EventListenerOrEventListenerObject} cb
   * @param {boolean | AddEventListenerOptions} options
   * @returns {UIComponent} self for chaining
   */
  on (type, cb, options=undefined) {
    on(this.element, type, cb, options);
    return this;
  }

  onclick (cb) {
    this.on("click", (e)=>{
      e.preventDefault();
      e.cancelBubble = true;
      cb(e);
    });
    return this;
  }

  /**Quick absolute positioning
   * @param {Boolean} isAbsolute should be absolute positioned or not
   */
  set absolute (isAbsolute) {
    if (isAbsolute) {
      this.element.classList.add("absolute");
    } else {
      this.element.classList.remove("absolute");
    }
  }

  /**Quick size filling
   * @param {"width|height|both|none"}
   */
  set fill (style="both") {
    if (style === "width") {
      this.element.classList.remove("fill", "height");
      this.element.classList.add("width");
    } else if (style === "height") {
      this.element.classList.remove("fill", "width");
      this.element.classList.add("height");
    } else if (style === "both") {
      this.element.classList.remove("height", "width");
      this.element.classList.add("fill");
    } else {
      this.element.classList.remove("fill", "width", "height");
    }
  }

  set transparent (t) {
    if (t) {
      this.element.classList.add("transparent");
    } else {
      this.element.classList.remove("transparent");
    }
  }
}
module.exports.UIComponent = UIComponent;

module.exports.UIPanel = class UIPanel extends UIComponent {
  constructor () {
    super(make("div"));
    this.element.classList.add("panel");
  }
}

class UIButton extends UIComponent {
  constructor (text="button") {
    super(make("button"));
    this.element.classList.add("button", "bg");
    this.element.textContent = text;
  }

  set text (txt) {
    this.element.textContent = txt;
  }
}
module.exports.UIButton = UIButton;

class UILabel extends UIComponent {
  constructor (text="label") {
    super(make("label"));
    this.element.classList.add("label");
    this.element.textContent = text;
  }

  set text (txt) {
    this.element.textContent = txt;
  }
}
module.exports.UILabel = UILabel;