
import { on, off, make, rect } from  "../aliases.js";

/**
 * @author Jonathan Crowder
 */
export default class Component {
  element: HTMLElement|undefined;

  constructor() {
  }
  /**Mounts the component to a parent HTML element*/
  mount(parent: Component|HTMLElement): Component {
    if (parent instanceof HTMLElement) {
      parent.appendChild(this.element);
    } else if (parent instanceof Component) {
      console.log(parent);
      parent.element.appendChild(this.element);
    } else {
      throw "Cannot append to parent because its not a Component or HTMLElement";
    }
    return this;
  }

  /**Mounts child component or html element to this*/
  mountChild (child: Component|HTMLElement): Component {
    if (child instanceof HTMLElement) {
      this.element.appendChild(child);
    } else if (child instanceof Component) {
      this.element.appendChild(child.element);
    } else {
      throw "Cannot append child because its not a Component or HTMLElement";
    }
    return this;
  }

  /**Listen to events on this componenet's element*/
  on(type: string, callback: EventListener, options:any|undefined): Component {
    on(this.element, type, callback, options);
    return this;
  }

  /**Stop listening to an event on this componenet's element*/
  off(type: string, callback: EventListener): Component {
    off(this.element, type, callback);
    return this;
  }

  /**Set the element id*/
  id (str: string): Component {
    this.element.id = str;
    return this;
  }
  /**Add CSS classes*/
  addClasses (...classnames: string[]): Component {
    this.element.classList.add(...classnames);
    return this;
  }
  /**Remove CSS classes*/
  removeClasses (...classnames: string[]): Component {
    this.element.classList.remove(...classnames);
    return this;
  }

  /**Make the element of this component a type of HTMLElement*/
  make(type: string): Component {
    this.element = make(type);
    return this;
  }

  /**Use a native element instead of creating one*/
  useNative(element: HTMLElement): Component {
    if (!element) console.warn("useNative was passed", element);
    this.element = element;
    return this;
  }

  /**Sets the textContent of this element*/
  textContent (str: string): Component {
    this.element.textContent = str;
    return this;
  }

  /**Adds the .hide class to the element*/
  hide (): Component {
    this.addClasses("hide");
    return this;
  }
  /**Removes the .hide class from the element*/
  show (): Component {
    this.removeClasses("hide");
    return this;
  }

  /**Sets the style.left prop*/
  set left (x: any) {
    this.element.style.left = x;
  }

  /**Sets the style.top prop*/
  set top (y: any) {
    this.element.style.top = y;
  }

  /**Alias of getBoundingClientRect */
  get rect (): DOMRect {
    return rect(this.element);
  }

  /**@param {string} type of input.type*/
  inputType (t: string): Component {
    if (!(this.element instanceof HTMLInputElement)) throw "type is meant to be set when the element is an HTMLInputElement";
    (this.element as HTMLInputElement).type = t;
    return this;
  }
  /**Removes children components*/
  removeChildren (): Component {
    while (this.element.lastChild) {
      this.element.lastChild.remove();
    }
    return this;
  }
  /**Sets the background image*/
  backgroundImage (url: string): Component {
    this.element.style["background-image"] = `url(${url})`;
    return this;
  }

  click () {
    this.element.click();
  }
}
