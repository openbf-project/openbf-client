/**Get an element by its ID, alias
 */
const get = (id: string): HTMLElement|undefined => document.getElementById(id);
/**Alias for getElementsByClassName*/
const getByClass = (classname: string): HTMLCollectionOf<Element> => document.getElementsByClassName(classname);
/**An alias for getBoundingClientRect*/
const rect = (e: HTMLElement): DOMRect => e.getBoundingClientRect();
/**Alias for createElement*/
const make = (type: string):HTMLElement => document.createElement(type);
/**Listen to events on an element*/
const on = (elem: HTMLElement|Window, type: string, callback: EventListener|any, options: any|undefined = undefined) => {
  if (!elem) throw "No element supplied";
  elem.addEventListener(type, callback, options);
}

/**Stop listen to events on an element*/
const off = (elem: HTMLElement|Window, type: string, callback: EventListener) => {
  if (!elem) throw "No element supplied";
  elem.removeEventListener(type, callback);
}

/**Remove all child elements from an element*/
const clearChildren = (e: HTMLElement)=>{
  while(e.lastChild) {
    e.lastChild.remove();
  }
}

/**Apply classes to an element*/
const applyStyleClasses = (e: HTMLElement, ...classes: string[]) => {
  if (!classes) return;
  for (const c of classes) {
    e.classList.add(c);
  }
}

export { get, getByClass, rect, make, on, off, clearChildren, applyStyleClasses };
