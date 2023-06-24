class CustomComponent extends HTMLElement {
    constructor() {
      super();
  
      const _style = document.createElement('style');
      const _template = document.createElement('template');
  
      _style.innerHTML = `
      h1 {
        color: tomato;
      }
      `;
  
      _template.innerHTML = `
      <h1>
        My Custom Element
      </h1>
    `;
  
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(_style);
      this.shadowRoot.appendChild(_template.content.cloneNode(true));
    }
  }
  
  customElements.define('custom-component', CustomComponent);